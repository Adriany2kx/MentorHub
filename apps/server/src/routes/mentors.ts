import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const ListMentorsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  expertise: z.string().optional(), // comma-separated
  minRate: z.coerce.number().optional(),
  maxRate: z.coerce.number().optional(),
  minExperience: z.coerce.number().int().optional(),
});

// GET /api/mentors - List approved mentors with pagination and filters
router.get("/", async (req, res) => {
  const parsed = ListMentorsQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { page, limit, search, expertise, minRate, maxRate, minExperience } = parsed.data;
  const skip = (page - 1) * limit;

  // Build filter conditions
  const where: any = {
    isApproved: true,
  };

  // Search by name or headline
  if (search) {
    where.OR = [
      { headline: { contains: search, mode: "insensitive" } },
      { user: { firstName: { contains: search, mode: "insensitive" } } },
      { user: { lastName: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Filter by expertise
  if (expertise) {
    const expertiseList = expertise.split(",").map((e) => e.trim());
    where.expertise = { hasSome: expertiseList };
  }

  // Filter by hourly rate range
  if (minRate !== undefined || maxRate !== undefined) {
    where.hourlyRate = {};
    if (minRate !== undefined) where.hourlyRate.gte = minRate;
    if (maxRate !== undefined) where.hourlyRate.lte = maxRate;
  }

  // Filter by years of experience
  if (minExperience !== undefined) {
    where.yearsExperience = { gte: minExperience };
  }

  const [mentors, total] = await Promise.all([
    prisma.mentorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
        _count: {
          select: { programs: { where: { isPublished: true } } },
        },
      },
    }),
    prisma.mentorProfile.count({ where }),
  ]);

  res.json({
    mentors: mentors.map((m) => ({
      id: m.id,
      headline: m.headline,
      expertise: m.expertise,
      hourlyRate: m.hourlyRate,
      yearsExperience: m.yearsExperience,
      user: m.user,
      programCount: m._count.programs,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /api/mentors/:id - Get mentor detail
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const mentor = await prisma.mentorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
        },
      },
      programs: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
      },
      availability: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!mentor || !mentor.isApproved) {
    res.status(404).json({ error: "Mentor not found" });
    return;
  }

  res.json({ mentor });
});

// GET /api/mentors/:id/availability - Get mentor's availability
router.get("/:id/availability", async (req, res) => {
  const { id } = req.params;

  const mentor = await prisma.mentorProfile.findUnique({
    where: { id },
    select: { isApproved: true },
  });

  if (!mentor || !mentor.isApproved) {
    res.status(404).json({ error: "Mentor not found" });
    return;
  }

  const availability = await prisma.availability.findMany({
    where: { mentorId: id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  res.json({ availability });
});

export default router;
