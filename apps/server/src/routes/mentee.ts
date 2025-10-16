import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const CreateMenteeProfileBody = z.object({
  goals: z.string().max(1000).optional(),
  interests: z.array(z.string().min(1).max(50)).max(10).optional(),
  currentRole: z.string().max(100).optional(),
  targetRole: z.string().max(100).optional(),
});

const UpdateMenteeProfileBody = z.object({
  goals: z.string().max(1000).optional().nullable(),
  interests: z.array(z.string().min(1).max(50)).max(10).optional(),
  currentRole: z.string().max(100).optional().nullable(),
  targetRole: z.string().max(100).optional().nullable(),
});

// POST /api/mentee/profile - Create mentee profile
router.post("/profile", requireAuth, async (req, res) => {
  // Check if user already has a mentee profile
  const existingProfile = await prisma.menteeProfile.findUnique({
    where: { userId: req.userId },
  });

  if (existingProfile) {
    res.status(409).json({ error: "Mentee profile already exists" });
    return;
  }

  const parsed = CreateMenteeProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { goals, interests, currentRole, targetRole } = parsed.data;

  const menteeProfile = await prisma.menteeProfile.create({
    data: {
      userId: req.userId!,
      goals,
      interests: interests ?? [],
      currentRole,
      targetRole,
    },
  });

  res.status(201).json({ menteeProfile });
});

// PATCH /api/mentee/profile - Update mentee profile
router.patch("/profile", requireAuth, async (req, res) => {
  // Check if user has a mentee profile
  const existingProfile = await prisma.menteeProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!existingProfile) {
    res.status(404).json({ error: "Mentee profile not found. Create one first." });
    return;
  }

  const parsed = UpdateMenteeProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { goals, interests, currentRole, targetRole } = parsed.data;

  const menteeProfile = await prisma.menteeProfile.update({
    where: { userId: req.userId },
    data: {
      ...(goals !== undefined && { goals }),
      ...(interests !== undefined && { interests }),
      ...(currentRole !== undefined && { currentRole }),
      ...(targetRole !== undefined && { targetRole }),
    },
  });

  res.json({ menteeProfile });
});

// GET /api/mentee/profile - Get own mentee profile
router.get("/profile", requireAuth, async (req, res) => {
  const menteeProfile = await prisma.menteeProfile.findUnique({
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

  if (!menteeProfile) {
    res.status(404).json({ error: "Mentee profile not found" });
    return;
  }

  res.json({ menteeProfile });
});

export default router;
