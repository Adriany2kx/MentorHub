import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireMentor } from "../middleware/auth.js";

const router = Router();

const CreateProgramBody = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  duration: z.number().int().min(15).max(480), // 15 min to 8 hours
  sessionCount: z.number().int().min(1).max(100).default(1),
  price: z.number().min(0),
  maxParticipants: z.number().int().min(1).max(50).default(1),
  topics: z.array(z.string().min(1).max(50)).max(10).optional(),
  isPublished: z.boolean().default(false),
});

const UpdateProgramBody = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  duration: z.number().int().min(15).max(480).optional(),
  sessionCount: z.number().int().min(1).max(100).optional(),
  price: z.number().min(0).optional(),
  maxParticipants: z.number().int().min(1).max(50).optional(),
  topics: z.array(z.string().min(1).max(50)).max(10).optional(),
  isPublished: z.boolean().optional(),
});

const ListProgramsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  topic: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  mentorId: z.string().optional(),
});

// GET /api/programs - List published programs
router.get("/", async (req, res) => {
  const parsed = ListProgramsQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { page, limit, search, topic, minPrice, maxPrice, mentorId } = parsed.data;
  const skip = (page - 1) * limit;

  const where: any = {
    isPublished: true,
    mentor: { isApproved: true },
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (topic) {
    where.topics = { has: topic };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  if (mentorId) {
    where.mentorId = mentorId;
  }

  const [programs, total] = await Promise.all([
    prisma.program.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.program.count({ where }),
  ]);

  res.json({
    programs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /api/programs/my - Get mentor's own programs (requires auth)
router.get("/my", requireAuth, requireMentor, async (req, res) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!mentorProfile) {
    res.status(404).json({ error: "Mentor profile not found" });
    return;
  }

  const programs = await prisma.program.findMany({
    where: { mentorId: mentorProfile.id },
    orderBy: { createdAt: "desc" },
  });

  res.json({ programs });
});

// GET /api/programs/:id - Get program detail
router.get("/:id", async (req, res) => {
  const id = req.params.id as string;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      },
    },
  });

  if (!program) {
    res.status(404).json({ error: "Program not found" });
    return;
  }

  // Only show unpublished programs to the owner
  if (!program.isPublished) {
    res.status(404).json({ error: "Program not found" });
    return;
  }

  res.json({ program });
});

// POST /api/programs - Create program (mentor only)
router.post("/", requireAuth, requireMentor, async (req, res) => {
  const parsed = CreateProgramBody.safeParse(req.body);
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

  const { title, description, duration, sessionCount, price, maxParticipants, topics, isPublished } = parsed.data;

  const program = await prisma.program.create({
    data: {
      mentorId: mentorProfile.id,
      title,
      description,
      duration,
      sessionCount,
      price,
      maxParticipants,
      topics: topics ?? [],
      isPublished,
    },
  });

  res.status(201).json({ program });
});

// PATCH /api/programs/:id - Update program (owner only)
router.patch("/:id", requireAuth, requireMentor, async (req, res) => {
  const id = req.params.id as string;

  const parsed = UpdateProgramBody.safeParse(req.body);
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

  // Check ownership
  const existingProgram = await prisma.program.findUnique({
    where: { id },
  });

  if (!existingProgram || existingProgram.mentorId !== mentorProfile.id) {
    res.status(404).json({ error: "Program not found" });
    return;
  }

  const { title, description, duration, sessionCount, price, maxParticipants, topics, isPublished } = parsed.data;

  const program = await prisma.program.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(duration !== undefined && { duration }),
      ...(sessionCount !== undefined && { sessionCount }),
      ...(price !== undefined && { price }),
      ...(maxParticipants !== undefined && { maxParticipants }),
      ...(topics !== undefined && { topics }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });

  res.json({ program });
});

// DELETE /api/programs/:id - Delete program (owner only)
router.delete("/:id", requireAuth, requireMentor, async (req, res) => {
  const id = req.params.id as string;

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!mentorProfile) {
    res.status(404).json({ error: "Mentor profile not found" });
    return;
  }

  // Check ownership
  const existingProgram = await prisma.program.findUnique({
    where: { id },
  });

  if (!existingProgram || existingProgram.mentorId !== mentorProfile.id) {
    res.status(404).json({ error: "Program not found" });
    return;
  }

  await prisma.program.delete({ where: { id } });

  res.json({ message: "Program deleted" });
});

export default router;
