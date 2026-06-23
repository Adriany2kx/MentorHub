import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { generateJson } from "../../lib/ai.js";
import { insightsSchema } from "../../lib/ai.js";
import { NotFoundError, ServiceUnavailableError } from "../../lib/errors.js";
import type { ProgressInsights, Skill } from "./types.js";

type InsightsResult = {
  insights: ProgressInsights;
  cached: boolean;
};

export async function getProgressInsights(userId: string): Promise<InsightsResult> {
  const menteeProfile = await prisma.menteeProfile.findUnique({ where: { userId } });
  if (!menteeProfile) throw new NotFoundError("Mentee profile not found");

  // Return cached insights if fresh
  const cacheTtlMs = env.INSIGHTS_CACHE_TTL_HOURS * 60 * 60 * 1000;
  if (menteeProfile.insightsCachedAt && menteeProfile.insightsCache) {
    const age = Date.now() - new Date(menteeProfile.insightsCachedAt).getTime();
    if (age < cacheTtlMs) {
      return { insights: menteeProfile.insightsCache as ProgressInsights, cached: true };
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

  type GoalItem = typeof goals[number];
  type MilestoneItem = { isCompleted: boolean };
  const goalsSummary = goals.map((g: GoalItem) => {
    const done = g.milestones.filter((m: MilestoneItem) => m.isCompleted).length;
    return `${g.title}: ${g.progress}% (${done}/${g.milestones.length} milestones, status: ${g.status})`;
  }).join("\n") || "No goals set";

  const skills = (menteeProfile.skills ?? []) as Skill[];

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
    const insights = await generateJson<ProgressInsights>(systemInstruction, userPrompt, insightsSchema);

    // Cache result
    await prisma.menteeProfile.update({
      where: { userId },
      data: { insightsCache: insights, insightsCachedAt: new Date() },
    });

    return { insights, cached: false };
  } catch {
    throw new ServiceUnavailableError("AI service temporarily unavailable");
  }
}
