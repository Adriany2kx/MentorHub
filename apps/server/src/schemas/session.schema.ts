import { z } from "zod";

export const completeSessionSchema = z.object({
  mentorNotes: z.string().max(2000).optional(),
  menteeFeedback: z.string().max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const scheduleSessionSchema = z.object({
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(15).max(480).optional(),
  meetingUrl: z.string().url().optional(),
});
