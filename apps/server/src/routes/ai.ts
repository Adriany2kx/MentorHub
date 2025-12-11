import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { SchemaType } from "@google/generative-ai";
import type { Schema } from "@google/generative-ai";
import {
  generateJson, generateText,
  mentorMatchSchema, compatibilitySchema,
  agendaSchema, sessionSummarySchema,
  milestoneSchema, learningPathSchema, insightsSchema, resourceSchema,
} from "../lib/ai.js";

const stringListSchema: Schema = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { env } from "../config/env.js";

const router = Router();

router.use(requireAuth, aiLimiter);

// ---------------------------------------------------------------------------
// Feature 11 — Profile Quality Score (rule-based, no LLM cost)
// GET /api/ai/profile-quality
// ---------------------------------------------------------------------------
router.get("/profile-quality", async (req, res) => {
  const userId = req.userId!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { mentorProfile: true, menteeProfile: true },
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  let score = 0;
  const suggestions: string[] = [];

  if (user.bio) {
    score += 15;
    if (user.bio.length >= 100) score += 5;
    else suggestions.push("Expand your bio to at least 100 characters");
  } else {
    suggestions.push("Add a bio to your profile");
  }

  if (user.avatarUrl) score += 10;
  else suggestions.push("Upload a profile photo");

  if (user.timezone) score += 5;
  else suggestions.push("Set your timezone");

  if (user.role === "MENTOR" && user.mentorProfile) {
    const count = user.mentorProfile.expertise.length;
    if (count >= 3) score += 25;
    else {
      const missing = 3 - count;
      suggestions.push(`Add at least ${missing} more expertise area${missing > 1 ? "s" : ""}`);
      score += Math.round((count / 3) * 25);
    }
  } else if (user.role === "MENTEE" && user.menteeProfile) {
    const p = user.menteeProfile;

    // Core role fields (25 pts)
    const filled = [p.currentRole, p.targetRole].filter(Boolean).length;
    score += Math.round((filled / 2) * 25);
    if (!p.currentRole) suggestions.push("Add your current role");
    if (!p.targetRole) suggestions.push("Set your target role");

    // Skills (20 pts) — biggest AI signal
    const skills = (p.skills ?? []) as { skill: string; level: string }[];
    if (skills.length >= 5) score += 20;
    else if (skills.length > 0) {
      score += Math.round((skills.length / 5) * 20);
      suggestions.push(`Add ${5 - skills.length} more skill${5 - skills.length > 1 ? "s" : ""} to improve your matches`);
    } else {
      suggestions.push("Add your skills — this is the biggest factor in mentor matching");
    }

    // Blocker (10 pts) — unlocks session agenda AI
    if (p.currentBlocker) score += 10;
    else suggestions.push("Tell us your biggest challenge to get better session agendas");

    // Industry (5 pts)
    if (p.targetIndustry) score += 5;
    else suggestions.push("Set your target industry");
  } else {
    suggestions.push(user.role === "MENTOR" ? "Complete your mentor profile" : "Complete your mentee profile");
  }

  return res.json({ score: Math.min(score, 100), suggestions });
});

// ---------------------------------------------------------------------------
// Feature 1 — Smart Mentor Recommendations
// GET /api/ai/mentor-recommendations
// Gemini advantage: 1M context window — pass full mentor list, no 20-item cap
// ---------------------------------------------------------------------------
router.get("/mentor-recommendations", async (req, res) => {
  const userId = req.userId!;

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

  if (mentors.length === 0) return res.json({ recommendations: [] });

  const skills = (menteeProfile?.skills ?? []) as { skill: string; level: string }[];
  const skillSummary = skills.length > 0
    ? skills.map((s) => `${s.skill}(${s.level})`).join(", ")
    : "not specified";

  const menteeContext = menteeProfile
    ? [
        `Current role: ${menteeProfile.currentRole ?? "unknown"}`,
        `Target role: ${menteeProfile.targetRole ?? "unknown"}`,
        `Target industry: ${menteeProfile.targetIndustry ?? "not specified"}`,
        `Current skills: ${skillSummary}`,
        `Goals: ${menteeProfile.goals ?? "not specified"}`,
        `Biggest challenge right now: ${menteeProfile.currentBlocker ?? "not specified"}`,
        `Learning style: ${menteeProfile.learningStyle ?? "not specified"}`,
      ].join(". ")
    : "No mentee profile created yet.";

  const mentorList = mentors
    .map((m) => `ID:${m.id} | ${m.user.firstName ?? ""} ${m.user.lastName ?? ""} | Expertise: ${m.expertise.join(", ")} | Rate: $${m.hourlyRate ?? "??"}/hr | Exp: ${m.yearsExperience ?? "??"} yrs | TZ: ${m.user.timezone ?? "unknown"}`)
    .join("\n");

  const systemInstruction =
    "You are a mentor-matching assistant. Focus on skill gaps (what the mentee needs to learn vs what they have), industry alignment, and their stated challenge. Return at most 5 mentors, highest score first. Scores are 0-100.";

  const userPrompt = `Mentee profile:\n${menteeContext}\n\nAvailable mentors:\n${mentorList}`;

  try {
    type Rec = { mentorId: string; score: number; reason: string };
    const recommendations = await generateJson<Rec[]>(systemInstruction, userPrompt, mentorMatchSchema);
    return res.json({ recommendations: recommendations.slice(0, 5) });
  } catch {
    return res.status(503).json({ error: "AI service temporarily unavailable" });
  }
});

// ---------------------------------------------------------------------------
// Feature 2 — Mentor-Mentee Compatibility Score
// GET /api/ai/compatibility/:mentorId
// Gemini advantage: JSON schema enforces exact response shape
// ---------------------------------------------------------------------------
router.get("/compatibility/:mentorId", async (req, res) => {
  const userId = req.userId!;
  const { mentorId } = req.params;

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

  if (!mentorProfile) return res.status(404).json({ error: "Mentor not found" });

  // Algorithmic sub-scores (deterministic, free)
  const menteeInterests = menteeProfile?.interests ?? [];
  const menteeSkills = (menteeProfile?.skills ?? []) as { skill: string; level: string }[];
  const mentorExpertise = mentorProfile.expertise;

  // Expertise overlap — check interests AND skill names against mentor expertise
  const menteeSignals = [...menteeInterests, ...menteeSkills.map((s) => s.skill)];
  const overlapCount = [...new Set(menteeSignals)].filter((i) =>
    mentorExpertise.some(
      (e) => e.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(e.toLowerCase())
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

  // Gemini generates the human-readable explanation with enforced schema
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

  return res.json({
    score: baseScore,
    breakdown: {
      expertiseOverlap,
      goalAlignment: Math.round(goalAlignment),
      timezoneMatch,
    },
    explanation,
  });
});

// ---------------------------------------------------------------------------
// Feature 3 — Goal-Based Mentor Suggestions
// GET /api/ai/goal-mentors/:goalId
// ---------------------------------------------------------------------------
router.get("/goal-mentors/:goalId", async (req, res) => {
  const userId = req.userId!;
  const { goalId } = req.params;

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

  if (!goal) return res.status(404).json({ error: "Goal not found" });
  if (mentors.length === 0) return res.json({ mentors: [] });

  const mentorList = mentors
    .map((m) => `ID:${m.id} | ${m.user.firstName ?? ""} ${m.user.lastName ?? ""} | Expertise: ${m.expertise.join(", ")}`)
    .join("\n");

  const systemInstruction =
    "You are a mentor-matching assistant. Match the most relevant mentors to this mentee's goal. Return at most 5 mentors, highest score first. Scores are 0-100.";
  const userPrompt = `Goal title: "${goal.title}"\nDescription: "${goal.description ?? "none"}"\n\nMentors:\n${mentorList}`;

  try {
    type Rec = { mentorId: string; score: number; reason: string };
    const mentorMatches = await generateJson<Rec[]>(systemInstruction, userPrompt, mentorMatchSchema);
    return res.json({ mentors: mentorMatches.slice(0, 5) });
  } catch {
    return res.status(503).json({ error: "AI service temporarily unavailable" });
  }
});

// ---------------------------------------------------------------------------
// Feature 8 — AI Micro-Milestones
// POST /api/ai/goals/micro-milestones
// ---------------------------------------------------------------------------
const microMilestoneBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

router.post("/goals/micro-milestones", async (req, res) => {
  const parsed = microMilestoneBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const userId = req.userId!;
  const menteeProfile = await prisma.menteeProfile.findUnique({ where: { userId } });
  const skills = (menteeProfile?.skills ?? []) as { skill: string; level: string }[];

  const systemInstruction =
    "You are a career coaching assistant. Break a broad goal into 5-8 specific, measurable milestones ordered from foundational to advanced. Each milestone should be achievable in 1-4 weeks.";

  const userPrompt = [
    `Goal: "${parsed.data.title}"`,
    parsed.data.description ? `Description: "${parsed.data.description}"` : null,
    `Current role: ${menteeProfile?.currentRole ?? "unknown"} → target: ${menteeProfile?.targetRole ?? "unknown"}`,
    skills.length > 0 ? `Current skills: ${skills.map((s) => `${s.skill}(${s.level})`).join(", ")}` : null,
  ].filter(Boolean).join("\n");

  try {
    type Milestone = { title: string; description?: string; order: number; suggestedWeeks: number };
    const milestones = await generateJson<Milestone[]>(systemInstruction, userPrompt, milestoneSchema);
    return res.json({ milestones });
  } catch {
    return res.status(503).json({ error: "AI service temporarily unavailable" });
  }
});

// ---------------------------------------------------------------------------
// Feature 9 — Personalised Learning Path
// GET /api/ai/goals/:id/learning-path
// ---------------------------------------------------------------------------
router.get("/goals/:id/learning-path", async (req, res) => {
  const userId = req.userId!;

  const [goal, menteeProfile] = await Promise.all([
    prisma.goal.findFirst({ where: { id: req.params.id, menteeId: userId } }),
    prisma.menteeProfile.findUnique({ where: { userId } }),
  ]);

  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const skills = (menteeProfile?.skills ?? []) as { skill: string; level: string }[];

  const systemInstruction =
    "You are a career development coach. Create an ordered learning path to achieve this goal. Each stage should build on the previous one. Be specific about what to focus on at each stage.";

  const userPrompt = [
    `Goal: "${goal.title}"`,
    goal.description ? `Description: "${goal.description}"` : null,
    `Current role: ${menteeProfile?.currentRole ?? "unknown"} → target: ${menteeProfile?.targetRole ?? "unknown"}`,
    skills.length > 0 ? `Current skills: ${skills.map((s) => `${s.skill}(${s.level})`).join(", ")}` : null,
    menteeProfile?.currentBlocker ? `Current challenge: "${menteeProfile.currentBlocker}"` : null,
    menteeProfile?.learningStyle ? `Learning style: ${menteeProfile.learningStyle}` : null,
  ].filter(Boolean).join("\n");

  try {
    type Stage = { stage: string; focus: string; resourceTypes: string[]; estimatedDuration: string };
    const path = await generateJson<Stage[]>(systemInstruction, userPrompt, learningPathSchema);
    return res.json({ path });
  } catch {
    return res.status(503).json({ error: "AI service temporarily unavailable" });
  }
});

// ---------------------------------------------------------------------------
// Feature 7 — Goal Achievement Prediction (algorithmic, no LLM)
// GET /api/ai/goals/:id/prediction
// ---------------------------------------------------------------------------
router.get("/goals/:id/prediction", async (req, res) => {
  const userId = req.userId!;

  const goal = await prisma.goal.findFirst({
    where: { id: req.params.id, menteeId: userId },
    include: {
      milestones: true,
      booking: {
        include: { sessions: { where: { status: "COMPLETED" } } },
      },
    },
  });

  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const totalMilestones = goal.milestones.length;
  const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
  const milestoneRate = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

  const daysElapsed = Math.max(1, Math.floor((Date.now() - new Date(goal.createdAt).getTime()) / 86400000));
  const progressRate = goal.progress / daysElapsed; // % per day

  let predictedDate: string | null = null;
  if (progressRate > 0 && goal.progress < 100) {
    const daysToComplete = (100 - goal.progress) / progressRate;
    predictedDate = new Date(Date.now() + daysToComplete * 86400000).toISOString().split("T")[0];
  } else if (goal.progress >= 100) {
    predictedDate = new Date().toISOString().split("T")[0];
  }

  const completedSessions = goal.booking?.sessions.length ?? 0;
  const sessionsScore = Math.min(completedSessions * 10, 30);
  const progressScore = goal.progress * 0.4;
  const milestoneScore = milestoneRate * 30;
  const likelihood = Math.round(Math.min(sessionsScore + progressScore + milestoneScore, 100));

  const trajectory =
    goal.progress >= 100 ? "completed" :
    likelihood >= 65 ? "on-track" :
    likelihood >= 35 ? "at-risk" : "off-track";

  return res.json({ likelihood, predictedDate, trajectory, progress: goal.progress, completedSessions });
});

// ---------------------------------------------------------------------------
// Feature 13 — Contextual Resource Recommendations
// GET /api/ai/goals/:id/resources
// ---------------------------------------------------------------------------
router.get("/goals/:id/resources", async (req, res) => {
  const userId = req.userId!;

  const [goal, menteeProfile] = await Promise.all([
    prisma.goal.findFirst({ where: { id: req.params.id, menteeId: userId }, include: { milestones: true } }),
    prisma.menteeProfile.findUnique({ where: { userId } }),
  ]);

  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const completedMilestones = goal.milestones.filter((m) => m.isCompleted).map((m) => m.title);
  const pendingMilestones = goal.milestones.filter((m) => !m.isCompleted).map((m) => m.title).slice(0, 3);
  const skills = (menteeProfile?.skills ?? []) as { skill: string; level: string }[];

  const systemInstruction =
    "You are a learning resource advisor. Suggest 4-5 specific resource types and search topics. Do NOT suggest URLs. Focus on what to search for and what type of content would be most useful at this stage.";

  const userPrompt = [
    `Goal: "${goal.title}" (${goal.progress}% complete)`,
    completedMilestones.length > 0 ? `Already completed: ${completedMilestones.join(", ")}` : null,
    pendingMilestones.length > 0 ? `Working on next: ${pendingMilestones.join(", ")}` : null,
    skills.length > 0 ? `Current skills: ${skills.map((s) => `${s.skill}(${s.level})`).join(", ")}` : null,
    menteeProfile?.learningStyle ? `Prefers: ${menteeProfile.learningStyle} learning` : null,
  ].filter(Boolean).join("\n");

  try {
    type Resource = { topic: string; resourceType: string; searchQuery: string; rationale: string };
    const resources = await generateJson<Resource[]>(systemInstruction, userPrompt, resourceSchema);
    return res.json({ resources });
  } catch {
    return res.status(503).json({ error: "AI service temporarily unavailable" });
  }
});

// ---------------------------------------------------------------------------
// Feature 10 — AI Progress Insights (24h cached)
// GET /api/ai/insights
// ---------------------------------------------------------------------------
router.get("/insights", async (req, res) => {
  const userId = req.userId!;

  const menteeProfile = await prisma.menteeProfile.findUnique({ where: { userId } });
  if (!menteeProfile) return res.status(404).json({ error: "Mentee profile not found" });

  // Return cached insights if fresh
  const cacheTtlMs = env.INSIGHTS_CACHE_TTL_HOURS * 60 * 60 * 1000;
  if (menteeProfile.insightsCachedAt && menteeProfile.insightsCache) {
    const age = Date.now() - new Date(menteeProfile.insightsCachedAt).getTime();
    if (age < cacheTtlMs) {
      return res.json({ insights: menteeProfile.insightsCache, cached: true });
    }
  }

  // Gather last 30 days of activity
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [goals, sessions] = await Promise.all([
    prisma.goal.findMany({
      where: { menteeId: userId },
      include: { milestones: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.mentoringSession.findMany({
      where: {
        booking: { menteeId: userId },
        status: "COMPLETED",
        scheduledAt: { gte: since },
      },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
  ]);

  const goalsSummary = goals.map((g) => {
    const done = g.milestones.filter((m) => m.isCompleted).length;
    return `${g.title}: ${g.progress}% (${done}/${g.milestones.length} milestones, status: ${g.status})`;
  }).join("\n") || "No goals set";

  const skills = (menteeProfile.skills ?? []) as { skill: string; level: string }[];

  const systemInstruction =
    "You are a mentorship progress coach. Generate a concise weekly progress review. Be specific, encouraging, and actionable. Identify real patterns in the data.";

  const userPrompt = [
    `Sessions in last 30 days: ${sessions.length}`,
    `Goals:\n${goalsSummary}`,
    skills.length > 0 ? `Skills: ${skills.map((s) => `${s.skill}(${s.level})`).join(", ")}` : null,
    `Target: ${menteeProfile.currentRole ?? "unknown"} → ${menteeProfile.targetRole ?? "unknown"}`,
    menteeProfile.currentBlocker ? `Current challenge: "${menteeProfile.currentBlocker}"` : null,
  ].filter(Boolean).join("\n");

  try {
    type Insights = { highlights: string[]; stalledAreas: string[]; recommendations: string[]; sessionFrequency: string };
    const insights = await generateJson<Insights>(systemInstruction, userPrompt, insightsSchema);

    // Cache result
    await prisma.menteeProfile.update({
      where: { userId },
      data: { insightsCache: insights, insightsCachedAt: new Date() },
    });

    return res.json({ insights, cached: false });
  } catch {
    return res.status(503).json({ error: "AI service temporarily unavailable" });
  }
});

// ---------------------------------------------------------------------------
// Helper — get session and verify access
// ---------------------------------------------------------------------------
async function getAccessibleSession(sessionId: string, userId: string, userRole: string) {
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

  return { session, isMentee, isMentor };
}

// ---------------------------------------------------------------------------
// Feature 6 — AI-Suggested Session Agenda
// GET /api/ai/sessions/:id/agenda
// ---------------------------------------------------------------------------
router.get("/sessions/:id/agenda", async (req, res) => {
  const userId = req.userId!;
  const owned = await getAccessibleSession(req.params.id, userId, req.userRole!);
  if (!owned) return res.status(404).json({ error: "Session not found" });

  const { session } = owned;

  if (session.status !== "SCHEDULED") {
    return res.status(400).json({ error: "Agenda is only available for scheduled sessions" });
  }

  // Gather context: mentee goals + last 3 completed session notes from same booking
  const mentee = session.booking.mentee;
  const menteeProfile = mentee.menteeProfile;
  const goals = mentee.goals;

  const pastSessions = await prisma.mentoringSession.findMany({
    where: { bookingId: session.booking.id, status: "COMPLETED" },
    orderBy: { scheduledAt: "desc" },
    take: 3,
    select: { mentorNotes: true, menteeFeedback: true, aiSummary: true },
  });

  const skills = (menteeProfile?.skills ?? []) as { skill: string; level: string }[];
  const goalsSummary = goals.length > 0
    ? goals.map((g) => `- ${g.title} (${g.status}, ${g.progress}% done)`).join("\n")
    : "No active goals";

  const previousContext = pastSessions.length > 0
    ? pastSessions.map((s, i) => {
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
    type AgendaItem = { item: string; rationale: string; estimatedMinutes: number };
    const agenda = await generateJson<AgendaItem[]>(systemInstruction, userPrompt, agendaSchema);
    return res.json({ agenda });
  } catch {
    return res.status(503).json({ error: "AI service temporarily unavailable" });
  }
});

// ---------------------------------------------------------------------------
// Feature 4 — AI Session Summary Generation
// POST /api/ai/sessions/:id/summary
// ---------------------------------------------------------------------------
const summaryBodySchema = z.object({
  mentorNotes: z.string().max(3000).optional(),
  menteeFeedback: z.string().max(3000).optional(),
});

router.post("/sessions/:id/summary", async (req, res) => {
  const parsed = summaryBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const userId = req.userId!;
  const owned = await getAccessibleSession(req.params.id, userId, req.userRole!);
  if (!owned) return res.status(404).json({ error: "Session not found" });

  const { session } = owned;

  const mentorNotes = parsed.data.mentorNotes ?? session.mentorNotes ?? "";
  const menteeFeedback = parsed.data.menteeFeedback ?? session.menteeFeedback ?? "";

  if (!mentorNotes && !menteeFeedback) {
    return res.status(400).json({ error: "No notes or feedback available to summarise" });
  }

  const systemInstruction =
    "You are a session summarisation assistant. Structure the provided raw notes into a clean, actionable summary. Be concise and specific.";

  const userPrompt = [
    `Program: ${session.booking.program.title}`,
    mentorNotes ? `Mentor notes: ${mentorNotes}` : null,
    menteeFeedback ? `Mentee feedback: ${menteeFeedback}` : null,
  ].filter(Boolean).join("\n\n");

  try {
    type Summary = { keyPoints: string[]; decisions: string[]; actionItems: string[]; followUpQuestions: string[] };
    const aiSummary = await generateJson<Summary>(systemInstruction, userPrompt, sessionSummarySchema);

    // Persist to DB
    await prisma.mentoringSession.update({
      where: { id: session.id },
      data: { aiSummary },
    });

    return res.json({ summary: aiSummary });
  } catch {
    return res.status(503).json({ error: "AI service temporarily unavailable" });
  }
});

// ---------------------------------------------------------------------------
// Feature 5 — Action Item Extraction → auto-create milestones
// POST /api/ai/sessions/:id/action-items
// ---------------------------------------------------------------------------
router.post("/sessions/:id/action-items", async (req, res) => {
  const userId = req.userId!;
  const owned = await getAccessibleSession(req.params.id, userId, req.userRole!);
  if (!owned) return res.status(404).json({ error: "Session not found" });

  const { session } = owned;

  // Use stored aiSummary if available, else fall back to raw notes
  const storedSummary = session.aiSummary as { actionItems?: string[] } | null;
  let actionItemTexts: string[] = storedSummary?.actionItems ?? [];

  if (actionItemTexts.length === 0) {
    const notes = [session.mentorNotes, session.menteeFeedback].filter(Boolean).join("\n");
    if (!notes) return res.status(400).json({ error: "No notes to extract action items from" });

    const systemInstruction =
      "Extract specific, actionable tasks from these session notes. Return only concrete next steps the mentee should take. Return as a JSON array of strings.";

    try {
      actionItemTexts = await generateJson<string[]>(systemInstruction, notes, stringListSchema);
    } catch {
      return res.status(503).json({ error: "AI service temporarily unavailable" });
    }
  }

  if (actionItemTexts.length === 0) return res.json({ created: 0, milestones: [] });

  const menteeGoals = session.booking.mentee.goals;
  const primaryGoal = menteeGoals[0] ?? null;

  if (!primaryGoal) {
    return res.json({ created: 0, milestones: [], note: "No active goal found to attach milestones to" });
  }

  const milestones = await Promise.all(
    actionItemTexts.slice(0, 8).map((title) =>
      prisma.milestone.create({
        data: { goalId: primaryGoal.id, title: title.slice(0, 300) },
      }).catch(() => null)
    )
  );

  const created = milestones.filter(Boolean);

  return res.json({ created: created.length, milestones: created });
});

export default router;
