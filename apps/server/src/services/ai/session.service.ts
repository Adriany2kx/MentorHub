import { prisma } from "../../lib/prisma.js";
import { SchemaType } from "@google/generative-ai";
import type { Schema } from "@google/generative-ai";
import { generateJson } from "../../lib/ai.js";
import { agendaSchema, sessionSummarySchema } from "../../lib/ai.js";
import { NotFoundError, ValidationError, ServiceUnavailableError } from "../../lib/errors.js";
import type { AgendaItem, SessionSummary, Skill } from "./types.js";

const stringListSchema: Schema = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };

type SessionAccess = {
  session: Awaited<ReturnType<typeof prisma.mentoringSession.findUnique>> & {
    booking: {
      id: string;
      mentorId: string;
      menteeId: string;
      program: { title: string };
      mentee: {
        menteeProfile: { currentRole: string | null; targetRole: string | null; currentBlocker: string | null; skills: unknown } | null;
        goals: { id: string; title: string; status: string; progress: number; milestones: { id: string }[] }[];
      };
    };
  };
  isMentee: boolean;
  isMentor: boolean;
};

export async function getAccessibleSession(sessionId: string, userId: string, userRole: string): Promise<SessionAccess | null> {
  const session = await prisma.mentoringSession.findUnique({
    where: { id: sessionId },
    include: {
      booking: {
        include: {
          program: { select: { title: true } },
          mentee: {
            include: {
              menteeProfile: true,
              goals: {
                where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
                include: { milestones: true },
                take: 5,
              },
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  const mentorProfile = (userRole === "MENTOR" || userRole === "ADMIN")
    ? await prisma.mentorProfile.findUnique({ where: { userId } })
    : null;

  const isMentee = session.booking.menteeId === userId;
  const isMentor = mentorProfile ? session.booking.mentorId === mentorProfile.id : false;
  if (!isMentee && !isMentor && userRole !== "ADMIN") return null;

  return { session: session as SessionAccess["session"], isMentee, isMentor };
}

export async function getSessionAgenda(userId: string, userRole: string, sessionId: string): Promise<AgendaItem[]> {
  const owned = await getAccessibleSession(sessionId, userId, userRole);
  if (!owned) throw new NotFoundError("Session not found");

  const { session } = owned;

  if (session.status !== "SCHEDULED") {
    throw new ValidationError("Agenda is only available for scheduled sessions");
  }

  const mentee = session.booking.mentee;
  const menteeProfile = mentee.menteeProfile;
  const goals = mentee.goals;

  const pastSessions = await prisma.mentoringSession.findMany({
    where: { bookingId: session.booking.id, status: "COMPLETED" },
    orderBy: { scheduledAt: "desc" },
    take: 3,
    select: { mentorNotes: true, menteeFeedback: true, aiSummary: true },
  });

  const skills = (menteeProfile?.skills ?? []) as Skill[];
  type GoalItem = typeof goals[number];
  const goalsSummary = goals.length > 0
    ? goals.map((g: GoalItem) => `- ${g.title} (${g.status}, ${g.progress}% done)`).join("\n")
    : "No active goals";

  type PastSessionItem = typeof pastSessions[number];
  const previousContext = pastSessions.length > 0
    ? pastSessions.map((s: PastSessionItem, i: number) => {
        const summary = s.aiSummary as { actionItems?: string[] } | null;
        const items = summary?.actionItems?.join(", ") ?? s.mentorNotes ?? s.menteeFeedback ?? "No notes";
        return `Session ${i + 1} ago: ${items}`;
      }).join("\n")
    : "This is the first session";

  const systemInstruction =
    "You are a session preparation assistant. Generate a focused, practical agenda for a mentoring session. Each item should be concrete and achievable within the time allocated. Return 4-6 items.";

  const userPrompt = [
    `Program: ${session.booking.program.title}`,
    `Session duration: ${session.duration} minutes`,
    `Mentee current role: ${menteeProfile?.currentRole ?? "unknown"} → target: ${menteeProfile?.targetRole ?? "unknown"}`,
    `Mentee skills: ${skills.map((s) => `${s.skill}(${s.level})`).join(", ") || "not specified"}`,
    `Biggest challenge: ${menteeProfile?.currentBlocker ?? "not specified"}`,
    `Active goals:\n${goalsSummary}`,
    `Previous sessions:\n${previousContext}`,
  ].join("\n");

  try {
    return await generateJson<AgendaItem[]>(systemInstruction, userPrompt, agendaSchema);
  } catch {
    throw new ServiceUnavailableError("AI service temporarily unavailable");
  }
}

type SummaryInput = {
  mentorNotes?: string;
  menteeFeedback?: string;
};

export async function generateSessionSummary(userId: string, userRole: string, sessionId: string, input: SummaryInput): Promise<SessionSummary> {
  const owned = await getAccessibleSession(sessionId, userId, userRole);
  if (!owned) throw new NotFoundError("Session not found");

  const { session } = owned;

  const mentorNotes = input.mentorNotes ?? session.mentorNotes ?? "";
  const menteeFeedback = input.menteeFeedback ?? session.menteeFeedback ?? "";

  if (!mentorNotes && !menteeFeedback) {
    throw new ValidationError("No notes or feedback available to summarise");
  }

  const systemInstruction =
    "You are a session summarisation assistant. Structure the provided raw notes into a clean, actionable summary. Be concise and specific.";

  const userPrompt = [
    `Program: ${session.booking.program.title}`,
    mentorNotes ? `Mentor notes: ${mentorNotes}` : null,
    menteeFeedback ? `Mentee feedback: ${menteeFeedback}` : null,
  ].filter(Boolean).join("\n\n");

  try {
    const aiSummary = await generateJson<SessionSummary>(systemInstruction, userPrompt, sessionSummarySchema);

    await prisma.mentoringSession.update({
      where: { id: session.id },
      data: { aiSummary },
    });

    return aiSummary;
  } catch {
    throw new ServiceUnavailableError("AI service temporarily unavailable");
  }
}

type ActionItemsResult = {
  created: number;
  milestones: { id: string; title: string }[];
  note?: string;
};

export async function extractActionItems(userId: string, userRole: string, sessionId: string): Promise<ActionItemsResult> {
  const owned = await getAccessibleSession(sessionId, userId, userRole);
  if (!owned) throw new NotFoundError("Session not found");

  const { session } = owned;

  const storedSummary = session.aiSummary as { actionItems?: string[] } | null;
  let actionItemTexts: string[] = storedSummary?.actionItems ?? [];

  if (actionItemTexts.length === 0) {
    const notes = [session.mentorNotes, session.menteeFeedback].filter(Boolean).join("\n");
    if (!notes) throw new ValidationError("No notes to extract action items from");

    const systemInstruction =
      "Extract specific, actionable tasks from these session notes. Return only concrete next steps the mentee should take. Return as a JSON array of strings.";

    try {
      actionItemTexts = await generateJson<string[]>(systemInstruction, notes, stringListSchema);
    } catch {
      throw new ServiceUnavailableError("AI service temporarily unavailable");
    }
  }

  if (actionItemTexts.length === 0) return { created: 0, milestones: [] };

  const menteeGoals = session.booking.mentee.goals;
  const primaryGoal = menteeGoals[0] ?? null;

  if (!primaryGoal) {
    return { created: 0, milestones: [], note: "No active goal found to attach milestones to" };
  }

  const milestones = await Promise.all(
    actionItemTexts.slice(0, 8).map((title) =>
      prisma.milestone.create({
        data: { goalId: primaryGoal.id, title: title.slice(0, 300) },
      }).catch(() => null)
    )
  );

  const created = milestones.filter(Boolean) as { id: string; title: string }[];

  return { created: created.length, milestones: created };
}
