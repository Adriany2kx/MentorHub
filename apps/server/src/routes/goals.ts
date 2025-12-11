import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireId } from "../lib/validate.js";
import { createGoalSchema, updateGoalSchema, createMilestoneSchema } from "../schemas/goal.schema.js";

const router = Router();

// GET /api/goals — list own goals (mentee)
router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const status = req.query.status as string | undefined;

  const goals = await prisma.goal.findMany({
    where: {
      menteeId: userId,
      ...(status ? { status: status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      milestones: { orderBy: { createdAt: "asc" } },
      booking: { select: { id: true, program: { select: { id: true, title: true } } } },
    },
  });

  return res.json({ goals });
});

// POST /api/goals — create a goal
router.post("/", requireAuth, async (req, res) => {
  const parsed = createGoalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const userId = req.userId!;
  const { title, description, targetDate, bookingId } = parsed.data;

  if (bookingId) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, menteeId: userId } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
  }

  const goal = await prisma.goal.create({
    data: { menteeId: userId, title, description, targetDate: targetDate ? new Date(targetDate) : undefined, bookingId },
    include: { milestones: true, booking: { select: { id: true, program: { select: { id: true, title: true } } } } },
  });

  return res.status(201).json({ goal });
});

// GET /api/goals/:id — get goal detail
router.get("/:id", requireAuth, async (req, res) => {
  if (!requireId(req.params.id, res)) return;
  const id = req.params.id as string;
  const userId = req.userId!;

  const goal = await prisma.goal.findFirst({
    where: { id, menteeId: userId },
    include: {
      milestones: { orderBy: { createdAt: "asc" } },
      booking: { select: { id: true, program: { select: { id: true, title: true } } } },
    },
  });

  if (!goal) return res.status(404).json({ error: "Goal not found" });
  return res.json({ goal });
});

// PATCH /api/goals/:id — update goal
router.patch("/:id", requireAuth, async (req, res) => {
  if (!requireId(req.params.id, res)) return;
  const id = req.params.id as string;

  const parsed = updateGoalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const userId = req.userId!;
  const goal = await prisma.goal.findFirst({ where: { id, menteeId: userId } });
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const { title, description, targetDate, status, progress } = parsed.data;

  const updated = await prisma.goal.update({
    where: { id: goal.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
      ...(status !== undefined && { status }),
      ...(progress !== undefined && { progress }),
    },
    include: { milestones: { orderBy: { createdAt: "asc" } }, booking: { select: { id: true, program: { select: { id: true, title: true } } } } },
  });

  return res.json({ goal: updated });
});

// DELETE /api/goals/:id
router.delete("/:id", requireAuth, async (req, res) => {
  if (!requireId(req.params.id, res)) return;
  const id = req.params.id as string;
  const userId = req.userId!;

  const goal = await prisma.goal.findFirst({ where: { id, menteeId: userId } });
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  await prisma.goal.delete({ where: { id: goal.id } });
  return res.json({ message: "Goal deleted" });
});

// POST /api/goals/:id/milestones — add milestone
router.post("/:id/milestones", requireAuth, async (req, res) => {
  if (!requireId(req.params.id, res)) return;
  const parsed = createMilestoneSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const id = req.params.id as string;
  const userId = req.userId!;
  const goal = await prisma.goal.findFirst({ where: { id, menteeId: userId } });
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const milestone = await prisma.milestone.create({
    data: { goalId: goal.id, title: parsed.data.title },
  });

  return res.status(201).json({ milestone });
});

// PATCH /api/goals/:goalId/milestones/:milestoneId — toggle milestone complete
router.patch("/:goalId/milestones/:milestoneId", requireAuth, async (req, res) => {
  const milestoneId = req.params.milestoneId as string;
  const userId = req.userId!;

  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, goal: { menteeId: userId } },
    include: { goal: { select: { progress: true } } },
  });

  if (!milestone) return res.status(404).json({ error: "Milestone not found" });

  const updated = await prisma.milestone.update({
    where: { id: milestone.id },
    data: {
      isCompleted: !milestone.isCompleted,
      completedAt: !milestone.isCompleted ? new Date() : null,
    },
  });

  const allMilestones = await prisma.milestone.findMany({ where: { goalId: milestone.goalId } });
  const completedCount = allMilestones.filter((m) => (m.id === updated.id ? updated.isCompleted : m.isCompleted)).length;
  const progress = allMilestones.length > 0
    ? Math.round((completedCount / allMilestones.length) * 100)
    : milestone.goal.progress;

  await prisma.goal.update({ where: { id: milestone.goalId }, data: { progress } });

  return res.json({ milestone: updated, progress });
});

export default router;
