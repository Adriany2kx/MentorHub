import { prisma } from "../../lib/prisma.js";
import { generateJson } from "../../lib/ai.js";
import { milestoneSchema, learningPathSchema, resourceSchema } from "../../lib/ai.js";
import { NotFoundError, ServiceUnavailableError } from "../../lib/errors.js";
import type { Milestone, LearningStage, ResourceSuggestion, GoalPrediction, Skill } from "./types.js";

type MicroMilestoneInput = {
  title: string;
  description?: string;
};

export async function generateMicroMilestones(userId: string, input: MicroMilestoneInput): Promise<Milestone[]> {
  const menteeProfile = await prisma.menteeProfile.findUnique({ where: { userId } });
  const skills = (menteeProfile?.skills ?? []) as Skill[];

  const systemInstruction =
    "You are a career coaching assistant. Break a broad goal into 5-8 specific, measurable milestones ordered from foundational to advanced. Each milestone should be achievable in 1-4 weeks.";

  const userPrompt = [
    `Goal: "${input.title}"`,
    input.description ? `Description: "${input.description}"` : null,
    `Current role: ${menteeProfile?.currentRole ?? "unknown"} → target: ${menteeProfile?.targetRole ?? "unknown"}`,
    skills.length > 0 ? `Current skills: ${skills.map((s) => `${s.skill}(${s.level})`).join(", ")}` : null,
  ].filter(Boolean).join("\n");

  try {
    return await generateJson<Milestone[]>(systemInstruction, userPrompt, milestoneSchema);
  } catch {
    throw new ServiceUnavailableError("AI service temporarily unavailable");
  }
}

export async function getLearningPath(userId: string, goalId: string): Promise<LearningStage[]> {
  const [goal, menteeProfile] = await Promise.all([
    prisma.goal.findFirst({ where: { id: goalId, menteeId: userId } }),
    prisma.menteeProfile.findUnique({ where: { userId } }),
  ]);

  if (!goal) throw new NotFoundError("Goal not found");

  const skills = (menteeProfile?.skills ?? []) as Skill[];

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
    return await generateJson<LearningStage[]>(systemInstruction, userPrompt, learningPathSchema);
  } catch {
    throw new ServiceUnavailableError("AI service temporarily unavailable");
  }
}

export async function getGoalPrediction(userId: string, goalId: string): Promise<GoalPrediction> {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, menteeId: userId },
    include: {
      milestones: true,
      booking: {
        include: { sessions: { where: { status: "COMPLETED" } } },
      },
    },
  });

  if (!goal) throw new NotFoundError("Goal not found");

  const totalMilestones = goal.milestones.length;
  const completedMilestones = goal.milestones.filter((m: { isCompleted: boolean }) => m.isCompleted).length;
  const milestoneRate = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

  const daysElapsed = Math.max(1, Math.floor((Date.now() - new Date(goal.createdAt).getTime()) / 86400000));
  const progressRate = goal.progress / daysElapsed;

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

  const trajectory: GoalPrediction["trajectory"] =
    goal.progress >= 100 ? "completed" :
    likelihood >= 65 ? "on-track" :
    likelihood >= 35 ? "at-risk" : "off-track";

  return { likelihood, predictedDate, trajectory, progress: goal.progress, completedSessions };
}

export async function getGoalResources(userId: string, goalId: string): Promise<ResourceSuggestion[]> {
  const [goal, menteeProfile] = await Promise.all([
    prisma.goal.findFirst({ where: { id: goalId, menteeId: userId }, include: { milestones: true } }),
    prisma.menteeProfile.findUnique({ where: { userId } }),
  ]);

  if (!goal) throw new NotFoundError("Goal not found");

  type MilestoneItem = { isCompleted: boolean; title: string };
  const completedMilestones = goal.milestones.filter((m: MilestoneItem) => m.isCompleted).map((m: MilestoneItem) => m.title);
  const pendingMilestones = goal.milestones.filter((m: MilestoneItem) => !m.isCompleted).map((m: MilestoneItem) => m.title).slice(0, 3);
  const skills = (menteeProfile?.skills ?? []) as Skill[];

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
    return await generateJson<ResourceSuggestion[]>(systemInstruction, userPrompt, resourceSchema);
  } catch {
    throw new ServiceUnavailableError("AI service temporarily unavailable");
  }
}
