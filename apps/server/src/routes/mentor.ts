import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const CreateMentorProfileBody = z.object({
  headline: z.string().min(10).max(200),
  expertise: z.array(z.string().min(1).max(50)).min(1).max(10),
  hourlyRate: z.number().positive().optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
});

const UpdateMentorProfileBody = z.object({
  headline: z.string().min(10).max(200).optional(),
  expertise: z.array(z.string().min(1).max(50)).min(1).max(10).optional(),
  hourlyRate: z.number().positive().optional().nullable(),
  yearsExperience: z.number().int().min(0).max(50).optional().nullable(),
});

// POST /api/mentor/profile - Create mentor profile (become a mentor)
router.post("/profile", requireAuth, async (req, res) => {
  const parsed = CreateMentorProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  // Check if user already has a mentor profile
  const existingProfile = await prisma.mentorProfile.findUnique({
    where: { userId: req.userId },
  });

  if (existingProfile) {
    res.status(409).json({ error: "Mentor profile already exists" });
    return;
  }

  const { headline, expertise, hourlyRate, yearsExperience } = parsed.data;

  // Create mentor profile and update user role
  const [mentorProfile] = await prisma.$transaction([
    prisma.mentorProfile.create({
      data: {
        userId: req.userId!,
        headline,
        expertise,
        hourlyRate,
        yearsExperience,
        isApproved: false, // Requires admin approval
      },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: { role: "MENTOR" },
    }),
  ]);

  res.status(201).json({
    mentorProfile,
    message: "Mentor profile created. Pending admin approval.",
  });
});

// PATCH /api/mentor/profile - Update mentor profile
router.patch("/profile", requireAuth, async (req, res) => {
  // Check if user has a mentor profile
  const existingProfile = await prisma.mentorProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!existingProfile) {
    res.status(404).json({ error: "Mentor profile not found. Create one first." });
    return;
  }

  const parsed = UpdateMentorProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { headline, expertise, hourlyRate, yearsExperience } = parsed.data;

  const mentorProfile = await prisma.mentorProfile.update({
    where: { userId: req.userId },
    data: {
      ...(headline !== undefined && { headline }),
      ...(expertise !== undefined && { expertise }),
      ...(hourlyRate !== undefined && { hourlyRate }),
      ...(yearsExperience !== undefined && { yearsExperience }),
    },
  });

  res.json({ mentorProfile });
});

// GET /api/mentor/profile - Get own mentor profile
router.get("/profile", requireAuth, async (req, res) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: req.userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
        },
      },
    },
  });

  if (!mentorProfile) {
    res.status(404).json({ error: "Mentor profile not found" });
    return;
  }

  res.json({ mentorProfile });
});

export default router;
