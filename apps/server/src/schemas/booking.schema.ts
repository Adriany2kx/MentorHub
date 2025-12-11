import { z } from "zod";

export const createBookingSchema = z.object({
  programId: z.string().min(1),
  note: z.string().max(1000).optional(),
});

export const scheduleSessionSchema = z.object({
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(15).max(480).optional(),
  meetingUrl: z.string().url().optional(),
});
