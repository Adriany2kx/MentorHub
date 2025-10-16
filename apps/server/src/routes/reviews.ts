import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().min(1).max(3000),
});

const respondSchema = z.object({
  response: z.string().min(1).max(2000),
});

// GET /api/reviews/mentor/:mentorId — public: get reviews for a mentor
router.get("/mentor/:mentorId", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? "10"))));
  const skip = (page - 1) * limit;

  const mentorProfile = await prisma.mentorProfile.findFirst({
    where: { OR: [{ id: req.params.mentorId }, { userId: req.params.mentorId }] },
  });
  if (!mentorProfile) return res.status(404).json({ error: "Mentor not found" });

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { mentorId: mentorProfile.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    prisma.review.count({ where: { mentorId: mentorProfile.id } }),
  ]);

  // Average rating
  const agg = await prisma.review.aggregate({
    where: { mentorId: mentorProfile.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return res.json({
    reviews,
    averageRating: agg._avg.rating ? parseFloat(agg._avg.rating.toFixed(1)) : null,
    totalReviews: total,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/reviews — mentee creates a review after completed booking
router.post("/", requireAuth, async (req, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const userId = req.userId!;
  const { bookingId, rating, title, content } = parsed.data;

  // Booking must exist and belong to this mentee
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, menteeId: userId },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });

  if (booking.status !== "COMPLETED") {
    return res.status(400).json({ error: "Can only review a completed booking" });
  }

  // One review per booking
  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) return res.status(409).json({ error: "You have already reviewed this booking" });

  const review = await prisma.review.create({
    data: {
      mentorId: booking.mentorId,
      menteeId: userId,
      bookingId,
      rating,
      title,
      content,
    },
    include: {
      mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  return res.status(201).json({ review });
});

// GET /api/reviews/:id — get single review
router.get("/:id", async (req, res) => {
  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
    include: {
      mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      mentor: { select: { id: true, headline: true, user: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });

  if (!review) return res.status(404).json({ error: "Review not found" });
  return res.json({ review });
});

// PATCH /api/reviews/:id/response — mentor responds to a review
router.patch("/:id/response", requireAuth, async (req, res) => {
  const parsed = respondSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const userId = req.userId!;

  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ error: "Review not found" });

  // Verify this is the mentor's review
  const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId } });
  if (!mentorProfile || mentorProfile.id !== review.mentorId) {
    return res.status(403).json({ error: "Not your review to respond to" });
  }

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: { response: parsed.data.response },
    include: {
      mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  return res.json({ review: updated });
});

export default router;
