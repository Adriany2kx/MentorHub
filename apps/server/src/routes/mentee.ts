import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const skillLevels = ["none", "beginner", "intermediate", "advanced", "expert"] as const;

const SkillEntry = z.object({
  skill: z.string().min(1).max(60),
  level: z.enum(skillLevels),
});

const learningStyles = ["structured", "exploratory", "project-based"] as const;

const CreateMenteeProfileBody = z.object({
  goals: z.string().max(1000).optional(),
  interests: z.array(z.string().min(1).max(50)).max(10).optional(),
  currentRole: z.string().max(100).optional(),
  targetRole: z.string().max(100).optional(),
  skills: z.array(SkillEntry).max(20).optional(),
  targetIndustry: z.string().max(100).optional(),
  currentBlocker: z.string().max(300).optional(),
  learningStyle: z.enum(learningStyles).optional(),
});

const UpdateMenteeProfileBody = z.object({
  goals: z.string().max(1000).optional().nullable(),
  interests: z.array(z.string().min(1).max(50)).max(10).optional(),
  currentRole: z.string().max(100).optional().nullable(),
  targetRole: z.string().max(100).optional().nullable(),
  skills: z.array(SkillEntry).max(20).optional().nullable(),
  targetIndustry: z.string().max(100).optional().nullable(),
  currentBlocker: z.string().max(300).optional().nullable(),
  learningStyle: z.enum(learningStyles).optional().nullable(),
});

// POST /api/mentee/profile
router.post("/profile", requireAuth, async (req, res) => {
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

  const { goals, interests, currentRole, targetRole, skills, targetIndustry, currentBlocker, learningStyle } = parsed.data;

  const menteeProfile = await prisma.menteeProfile.create({
    data: {
      userId: req.userId!,
      goals,
      interests: interests ?? [],
      currentRole,
      targetRole,
      skills: skills ?? undefined,
      targetIndustry,
      currentBlocker,
      learningStyle,
    },
  });

  res.status(201).json({ menteeProfile });
});

// PATCH /api/mentee/profile
router.patch("/profile", requireAuth, async (req, res) => {
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

  const { goals, interests, currentRole, targetRole, skills, targetIndustry, currentBlocker, learningStyle } = parsed.data;

  const updateData: Prisma.MenteeProfileUpdateInput = {
    ...(goals !== undefined && { goals }),
    ...(interests !== undefined && { interests }),
    ...(currentRole !== undefined && { currentRole }),
    ...(targetRole !== undefined && { targetRole }),
    ...(skills !== undefined && { skills: skills as Prisma.InputJsonValue }),
    ...(targetIndustry !== undefined && { targetIndustry }),
    ...(currentBlocker !== undefined && { currentBlocker }),
    ...(learningStyle !== undefined && { learningStyle }),
  };

  const menteeProfile = await prisma.menteeProfile.update({
    where: { userId: req.userId },
    data: updateData,
  });

  res.json({ menteeProfile });
});

// GET /api/mentee/profile
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
