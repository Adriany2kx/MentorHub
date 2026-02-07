import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireMentor } from "../middleware/auth.js";

const router = Router();

const TimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const CreateAvailabilityBody = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(TimeRegex, "Invalid time format (use HH:MM)"),
  endTime: z.string().regex(TimeRegex, "Invalid time format (use HH:MM)"),
  timezone: z.string().default("UTC"),
}).refine((data) => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

const BulkAvailabilityBody = z.object({
  slots: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(TimeRegex, "Invalid time format"),
    endTime: z.string().regex(TimeRegex, "Invalid time format"),
  })).min(1).max(50),
  timezone: z.string().default("UTC"),
});

// GET /api/availability - Get own availability (mentor only)
router.get("/", requireAuth, requireMentor, async (req, res) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!mentorProfile) {
    res.status(404).json({ error: "Mentor profile not found" });
    return;
  }

  const availability = await prisma.availability.findMany({
    where: { mentorId: mentorProfile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  res.json({ availability });
});

// POST /api/availability - Add availability slot
router.post("/", requireAuth, requireMentor, async (req, res) => {
  const parsed = CreateAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!mentorProfile) {
    res.status(404).json({ error: "Mentor profile not found" });
    return;
  }

  const { dayOfWeek, startTime, endTime, timezone } = parsed.data;

  // Check for overlapping slots
  const existingSlots = await prisma.availability.findMany({
    where: {
      mentorId: mentorProfile.id,
      dayOfWeek,
    },
  });

  const hasOverlap = existingSlots.some((slot) => {
    return startTime < slot.endTime && endTime > slot.startTime;
  });

  if (hasOverlap) {
    res.status(400).json({ error: "This time slot overlaps with an existing slot" });
    return;
  }

  const availability = await prisma.availability.create({
    data: {
      mentorId: mentorProfile.id,
      dayOfWeek,
      startTime,
      endTime,
      timezone,
    },
  });

  res.status(201).json({ availability });
});

// POST /api/availability/bulk - Set multiple availability slots (replaces existing)
router.post("/bulk", requireAuth, requireMentor, async (req, res) => {
  const parsed = BulkAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!mentorProfile) {
    res.status(404).json({ error: "Mentor profile not found" });
    return;
  }

  const { slots, timezone } = parsed.data;

  // Validate no overlaps within the new slots
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[i].dayOfWeek === slots[j].dayOfWeek) {
        const a = slots[i];
        const b = slots[j];
        if (a.startTime < b.endTime && a.endTime > b.startTime) {
          res.status(400).json({ error: "Provided slots contain overlapping times" });
          return;
        }
      }
    }
  }

  // Delete all existing and create new slots in a transaction
  await prisma.$transaction([
    prisma.availability.deleteMany({
      where: { mentorId: mentorProfile.id },
    }),
    prisma.availability.createMany({
      data: slots.map((slot) => ({
        mentorId: mentorProfile.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        timezone,
      })),
    }),
  ]);

  const availability = await prisma.availability.findMany({
    where: { mentorId: mentorProfile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  res.json({ availability, message: "Availability updated" });
});

// DELETE /api/availability/:id - Delete availability slot
router.delete("/:id", requireAuth, requireMentor, async (req, res) => {
  const id = req.params.id as string;

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!mentorProfile) {
    res.status(404).json({ error: "Mentor profile not found" });
    return;
  }

  const slot = await prisma.availability.findUnique({
    where: { id },
  });

  if (!slot || slot.mentorId !== mentorProfile.id) {
    res.status(404).json({ error: "Availability slot not found" });
    return;
  }

  await prisma.availability.delete({ where: { id } });

  res.json({ message: "Availability slot deleted" });
});

export default router;
