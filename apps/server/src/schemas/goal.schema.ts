import { z } from "zod";

export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  targetDate: z.string().datetime().optional(),
  bookingId: z.string().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  targetDate: z.string().datetime().nullable().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

export const createMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(300),
});
