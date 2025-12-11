import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadAvatar, getAvatarUrl } from "../middleware/upload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const UpdateProfileBody = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().max(50).optional(),
});

// GET /api/users/me/profile - Get current user's full profile
router.get("/me/profile", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      isVerified: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      timezone: true,
      createdAt: true,
      mentorProfile: true,
      menteeProfile: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});

// PATCH /api/users/me - Update basic user info
router.patch("/me", requireAuth, async (req, res) => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { firstName, lastName, bio, timezone } = parsed.data;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(bio !== undefined && { bio }),
      ...(timezone !== undefined && { timezone }),
    },
    select: {
      id: true,
      email: true,
      isVerified: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      timezone: true,
      createdAt: true,
    },
  });

  res.json({ user });
});

// POST /api/users/me/avatar - Upload avatar
router.post("/me/avatar", requireAuth, (req, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err) {
      if (err.message.includes("Only")) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File size must be less than 5MB" });
        return;
      }
      logger.error({ err }, "Avatar upload error");
      res.status(500).json({ error: "Failed to upload avatar" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Get old avatar to delete it
    const oldUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { avatarUrl: true },
    });

    // Delete old avatar file if it exists
    if (oldUser?.avatarUrl) {
      const oldPath = path.join(__dirname, "../../", oldUser.avatarUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = getAvatarUrl(req.file.filename);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        avatarUrl: true,
      },
    });

    res.json({ user, message: "Avatar uploaded successfully" });
  });
});

// GET /api/users/:id - Get public profile
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      mentorProfile: {
        select: {
          headline: true,
          expertise: true,
          yearsExperience: true,
          isApproved: true,
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Only show mentor profile if approved
  if (user.mentorProfile && !user.mentorProfile.isApproved) {
    user.mentorProfile = null;
  }

  res.json({ user });
});

export default router;
