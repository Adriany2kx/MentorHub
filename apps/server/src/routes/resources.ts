import { Router } from "express";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadResource } from "../middleware/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const FILE_TYPE_MAP: Record<string, "DOCUMENT" | "VIDEO" | "IMAGE" | "OTHER"> = {
  "application/pdf": "DOCUMENT",
  "application/msword": "DOCUMENT",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCUMENT",
  "application/vnd.ms-excel": "DOCUMENT",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "DOCUMENT",
  "application/vnd.ms-powerpoint": "DOCUMENT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "DOCUMENT",
  "text/plain": "DOCUMENT",
  "video/mp4": "VIDEO",
  "video/webm": "VIDEO",
  "video/ogg": "VIDEO",
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/gif": "IMAGE",
  "image/webp": "IMAGE",
};

// GET /api/resources — list accessible resources for the current user
router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const resources = await prisma.resource.findMany({
    where: {
      OR: [
        { uploaderId: userId },
        { isPublic: true },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  return res.json({ resources });
});

// POST /api/resources — upload a file resource
router.post("/", requireAuth, (req, res, next) => {
  uploadResource(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  const userId = req.userId!;

  // Validate metadata fields
  const parsed = z.object({
    title: z.string().trim().min(1).max(200),
    programId: z.string().optional(),
    bookingId: z.string().optional(),
    isPublic: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { title, programId, bookingId, isPublic = false } = parsed.data;

  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const fileType = FILE_TYPE_MAP[file.mimetype] ?? "OTHER";

  const resource = await prisma.resource.create({
    data: {
      uploaderId: userId,
      title,
      programId: programId || undefined,
      bookingId: bookingId || undefined,
      filePath: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileType,
      isPublic,
    },
    include: {
      uploader: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  return res.status(201).json({ resource });
});

// GET /api/resources/:id — get resource metadata
router.get("/:id", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const resource = await prisma.resource.findFirst({
    where: {
      id: req.params.id as string,
      OR: [{ uploaderId: userId }, { isPublic: true }],
    },
    include: {
      uploader: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  if (!resource) return res.status(404).json({ error: "We couldn't find this file." });
  return res.json({ resource });
});

// GET /api/resources/:id/download — download the file
router.get("/:id/download", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const resource = await prisma.resource.findFirst({
    where: {
      id: req.params.id as string,
      OR: [{ uploaderId: userId }, { isPublic: true }],
    },
  });

  if (!resource) return res.status(404).json({ error: "We couldn't find this file." });
  if (!resource.filePath) return res.status(400).json({ error: "This item does not have a file to download." });

  const safeFilename = path.basename(resource.filePath);
  const filePath = path.join(__dirname, "../../uploads/resources", safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "This file is no longer available." });
  }

  res.download(filePath, resource.title + path.extname(safeFilename));
});

// GET /api/resources/:id/preview — stream file inline for browser preview
router.get("/:id/preview", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const resource = await prisma.resource.findFirst({
    where: {
      id: req.params.id as string,
      OR: [{ uploaderId: userId }, { isPublic: true }],
    },
  });

  if (!resource) return res.status(404).json({ error: "We couldn't find this file." });
  if (!resource.filePath) return res.status(400).json({ error: "This item does not have a file to preview." });

  const safeFilename = path.basename(resource.filePath);
  const filePath = path.join(__dirname, "../../uploads/resources", safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "This file is no longer available." });
  }

  const ext = path.extname(safeFilename);
  const previewName = `${resource.title}${ext}`;

  if (resource.mimeType) {
    res.setHeader("Content-Type", resource.mimeType);
  }
  res.setHeader("Content-Disposition", `inline; filename="${previewName.replace(/\"/g, "")}"`);
  return res.sendFile(filePath);
});

// DELETE /api/resources/:id — delete own resource
router.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const resource = await prisma.resource.findFirst({ where: { id: req.params.id as string, uploaderId: userId } });
  if (!resource) return res.status(404).json({ error: "We couldn't find this file." });

  // Remove file from disk
  if (resource.filePath) {
    const filePath = path.join(__dirname, "../../uploads/resources", resource.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await prisma.resource.delete({ where: { id: resource.id } });
  return res.json({ message: "Resource deleted" });
});

export default router;
