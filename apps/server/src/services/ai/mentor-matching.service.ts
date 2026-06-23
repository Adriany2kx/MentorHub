import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { generateJson } from "../../lib/ai.js";
import { mentorMatchSchema, compatibilitySchema } from "../../lib/ai.js";
import { NotFoundError, ServiceUnavailableError } from "../../lib/errors.js";
import type { MentorRecommendation, CompatibilityResult, Skill } from "./types.js";

type MentorRecommendationsResult = {
  recommendations: MentorRecommendation[];
  profileInsufficient: boolean;
};

export async function getMentorRecommendations(userId: string): Promise<MentorRecommendationsResult> {
  const [menteeProfile, mentors] = await Promise.all([
    prisma.menteeProfile.findUnique({
      where: { userId },
      include: { user: { select: { firstName: true, timezone: true } } },
    }),
    prisma.mentorProfile.findMany({
      where: { isApproved: true },
      select: {
        id: true,
        headline: true,
        expertise: true,
        hourlyRate: true,
        yearsExperience: true,
        user: { select: { firstName: true, lastName: true, timezone: true } },
      },
      take: env.AI_MENTOR_LIST_LIMIT,
    }),
  ]);

  if (mentors.length === 0) return { recommendations: [], profileInsufficient: false };

  const filledFields = [
    menteeProfile?.currentRole,
    menteeProfile?.targetRole,
    menteeProfile?.goals,
  ].filter(Boolean).length;
  const profileInsufficient = !menteeProfile || filledFields < 2;

  if (profileInsufficient) {
    return { recommendations: [], profileInsufficient: true };
  }

  const skills = (menteeProfile?.skills ?? []) as Skill[];
  const skillSummary = skills.length > 0
    ? skills.map((s) => `${s.skill}(${s.level})`).join(", ")
    : "not specified";

  const menteeContext = [
    `Current role: ${menteeProfile.currentRole ?? "unknown"}`,
    `Target role: ${menteeProfile.targetRole ?? "unknown"}`,
    `Target industry: ${menteeProfile.targetIndustry ?? "not specified"}`,
    `Current skills: ${skillSummary}`,
    `Goals: ${menteeProfile.goals ?? "not specified"}`,
    `Biggest challenge right now: ${menteeProfile.currentBlocker ?? "not specified"}`,
    `Learning style: ${menteeProfile.learningStyle ?? "not specified"}`,
  ].join(". ");

  type MentorItem = typeof mentors[number];
  const mentorList = mentors
    .map((m: MentorItem) => `ID:${m.id} | ${m.user.firstName ?? ""} ${m.user.lastName ?? ""} | Expertise: ${m.expertise.join(", ")} | Rate: $${m.hourlyRate ?? "??"}/hr | Exp: ${m.yearsExperience ?? "??"} yrs | TZ: ${m.user.timezone ?? "unknown"}`)
    .join("\n");

  const systemInstruction =
    "You are a mentor-matching assistant. Focus on skill gaps (what the mentee needs to learn vs what they have), industry alignment, and their stated challenge. Return at most 5 mentors, highest score first. Scores are 0-100.";

  const userPrompt = `Mentee profile:\n${menteeContext}\n\nAvailable mentors:\n${mentorList}`;

  try {
    const recommendations = await generateJson<MentorRecommendation[]>(systemInstruction, userPrompt, mentorMatchSchema);
    return { recommendations: recommendations.slice(0, 5), profileInsufficient: false };
  } catch (err) {
    logger.error({ err }, "Gemini mentor-recommendations failed");
    throw new ServiceUnavailableError("AI service temporarily unavailable");
  }
}

export async function getCompatibility(userId: string, mentorId: string): Promise<CompatibilityResult> {
  const [menteeProfile, mentorProfile] = await Promise.all([
    prisma.menteeProfile.findUnique({
      where: { userId },
      include: { user: { select: { timezone: true } } },
    }),
    prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: { user: { select: { timezone: true } } },
    }),
  ]);

  if (!mentorProfile) throw new NotFoundError("Mentor not found");

  const menteeInterests = menteeProfile?.interests ?? [];
  const menteeSkills = (menteeProfile?.skills ?? []) as Skill[];
  const mentorExpertise = mentorProfile.expertise;

  const menteeSignals = [...menteeInterests, ...menteeSkills.map((s) => s.skill)];
  const overlapCount = [...new Set(menteeSignals)].filter((i: string) =>
    mentorExpertise.some(
      (e: string) => e.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(e.toLowerCase())
    )
  ).length;
  const expertiseOverlap = menteeSignals.length > 0
    ? Math.round(Math.min((overlapCount / Math.min(menteeSignals.length, 5)) * 100, 100))
    : 0;

  const timezoneMatch =
    !!menteeProfile?.user.timezone &&
    !!mentorProfile.user.timezone &&
    menteeProfile.user.timezone === mentorProfile.user.timezone;

  const goalAlignment = menteeProfile?.goals || menteeProfile?.currentBlocker
    ? Math.min(55 + expertiseOverlap / 4, 100)
    : 50;

  const baseScore = Math.round(
    expertiseOverlap * 0.5 +
    goalAlignment * 0.3 +
    (timezoneMatch ? 20 : 0)
  );

  const skillSummaryForCompat = menteeSkills.length > 0
    ? menteeSkills.map((s) => `${s.skill}(${s.level})`).join(", ")
    : menteeInterests.join(", ") || "none";

  const systemInstruction =
    "You are a mentor-matching assistant. Given this compatibility data, write a single concise sentence (max 30 words) explaining why this mentor is or is not a good fit. Focus on skill gaps and industry alignment.";
  const userPrompt = [
    `Mentee current role: ${menteeProfile?.currentRole ?? "unknown"} → target: ${menteeProfile?.targetRole ?? "unknown"}`,
    `Mentee skills: ${skillSummaryForCompat}`,
    `Mentee challenge: ${menteeProfile?.currentBlocker ?? "not specified"}`,
    `Mentor expertise: ${mentorExpertise.join(", ")}`,
    `Expertise overlap: ${expertiseOverlap}%`,
    `Timezone match: ${timezoneMatch}`,
  ].join(". ");

  let explanation = "Compatibility calculated based on expertise overlap and timezone alignment.";
  try {
    const result = await generateJson<{ explanation: string }>(systemInstruction, userPrompt, compatibilitySchema);
    explanation = result.explanation;
  } catch {
    // fall through to default explanation
  }

  return {
    score: baseScore,
    breakdown: {
      expertiseOverlap,
      goalAlignment: Math.round(goalAlignment),
      timezoneMatch,
    },
    explanation,
  };
}

export async function getGoalMentors(userId: string, goalId: string): Promise<MentorRecommendation[]> {
  const [goal, mentors] = await Promise.all([
    prisma.goal.findFirst({ where: { id: goalId, menteeId: userId } }),
    prisma.mentorProfile.findMany({
      where: { isApproved: true },
      select: {
        id: true,
        expertise: true,
        user: { select: { firstName: true, lastName: true } },
      },
      take: env.AI_MENTOR_LIST_LIMIT,
    }),
  ]);

  if (!goal) throw new NotFoundError("Goal not found");
  if (mentors.length === 0) return [];

  type GoalMentorItem = typeof mentors[number];
  const mentorList = mentors
    .map((m: GoalMentorItem) => `ID:${m.id} | ${m.user.firstName ?? ""} ${m.user.lastName ?? ""} | Expertise: ${m.expertise.join(", ")}`)
    .join("\n");

  const systemInstruction =
    "You are a mentor-matching assistant. Match the most relevant mentors to this mentee's goal. Return at most 5 mentors, highest score first. Scores are 0-100.";
  const userPrompt = `Goal title: "${goal.title}"\nDescription: "${goal.description ?? "none"}"\n\nMentors:\n${mentorList}`;

  try {
    const mentorMatches = await generateJson<MentorRecommendation[]>(systemInstruction, userPrompt, mentorMatchSchema);
    return mentorMatches.slice(0, 5);
  } catch {
    throw new ServiceUnavailableError("AI service temporarily unavailable");
  }
}
