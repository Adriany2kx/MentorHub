import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/payments — list own payments (mentee sees their payments)
router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const payments = await prisma.payment.findMany({
    where: { booking: { menteeId: userId } },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        select: {
          id: true,
          totalPrice: true,
          program: { select: { id: true, title: true } },
          mentor: { select: { user: { select: { firstName: true, lastName: true } } } },
        },
      },
    },
  });

  return res.json({ payments });
});

// GET /api/payments/mentor — mentor sees their earnings from completed bookings
router.get("/mentor", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"))));
  const skip = (page - 1) * limit;

  const mentor = await prisma.mentorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!mentor) return res.status(404).json({ error: "Mentor profile not found" });

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { booking: { mentor: { userId } }, status: "COMPLETED" },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            totalPrice: true,
            startTime: true,
            status: true,
            program: { select: { id: true, title: true } },
            mentee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    }),
    prisma.payment.count({
      where: { booking: { mentor: { userId } }, status: "COMPLETED" },
    }),
  ]);

  const totalEarnings = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { booking: { mentor: { userId } }, status: "COMPLETED" },
  });

  return res.json({
    payments,
    totalEarnings: totalEarnings._sum.amount ? parseFloat(String(totalEarnings._sum.amount)) : 0,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/payments — record a payment for a booking
router.post("/", requireAuth, async (req, res) => {
  const parsed = z.object({
    bookingId: z.string().min(1),
    stripePaymentId: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const userId = req.userId!;
  const { bookingId, stripePaymentId } = parsed.data;

  const booking = await prisma.booking.findFirst({ where: { id: bookingId, menteeId: userId } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const existing = await prisma.payment.findUnique({ where: { bookingId } });
  if (existing) return res.status(409).json({ error: "Payment already recorded for this booking" });

  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount: booking.totalPrice,
      status: "COMPLETED",
      stripePaymentId,
    },
    include: {
      booking: { select: { id: true, program: { select: { title: true } } } },
    },
  });

  return res.status(201).json({ payment });
});

// GET /api/payments/admin — admin: all payments
router.get("/admin", requireAuth, requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"))));
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            totalPrice: true,
            program: { select: { title: true } },
            mentee: { select: { id: true, firstName: true, lastName: true, email: true } },
            mentor: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    }),
    prisma.payment.count(),
  ]);

  const totalRevenue = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "COMPLETED" },
  });

  return res.json({
    payments,
    totalRevenue: totalRevenue._sum.amount ? parseFloat(String(totalRevenue._sum.amount)) : 0,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// PATCH /api/payments/:id — admin: update payment status
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = z.object({
    status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: parsed.data.status },
  });

  return res.json({ payment: updated });
});

// POST /api/payments/checkout — initiate checkout for a booking (creates PENDING payment)
router.post("/checkout", requireAuth, async (req, res) => {
  const parsed = z.object({
    bookingId: z.string().min(1),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const userId = req.userId!;
  const { bookingId } = parsed.data;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, menteeId: userId },
    include: { program: true, mentor: { include: { user: true } } },
  });
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  // Check if payment already exists
  const existing = await prisma.payment.findUnique({ where: { bookingId } });
  if (existing && existing.status === "COMPLETED") {
    return res.status(409).json({ error: "Payment already completed" });
  }

  // Create or update PENDING payment
  const payment = existing
    ? await prisma.payment.update({
        where: { bookingId },
        data: { status: "PENDING" },
        include: { booking: { select: { id: true, program: { select: { title: true } } } } },
      })
    : await prisma.payment.create({
        data: {
          bookingId,
          amount: booking.totalPrice,
          status: "PENDING",
        },
        include: { booking: { select: { id: true, program: { select: { title: true } } } } },
      });

  // Return mock checkout session
  return res.json({
    payment,
    checkoutSession: {
      id: `cs_${payment.id}`,
      url: `/checkout/${bookingId}`,
    },
  });
});

// POST /api/payments/:id/confirm — confirm payment (simulates Stripe webhook)
router.post("/:id/confirm", requireAuth, async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { booking: true },
  });

  if (!payment) return res.status(404).json({ error: "Payment not found" });

  // Verify ownership (mentee can only confirm their own payment)
  const booking = await prisma.booking.findFirst({
    where: { id: payment.bookingId, menteeId: req.userId },
  });
  if (!booking) return res.status(403).json({ error: "Unauthorized" });

  const updated = await prisma.payment.update({
    where: { id: req.params.id },
    data: { status: "COMPLETED" },
  });

  return res.json({ payment: updated });
});

export default router;
