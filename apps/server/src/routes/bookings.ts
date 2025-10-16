import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireMentor } from "../middleware/auth.js";

const router = Router();

const createBookingSchema = z.object({
  programId: z.string().min(1),
  note: z.string().max(1000).optional(),
});

const scheduleSessionSchema = z.object({
  scheduledAt: z.string().datetime(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
});

// POST /api/bookings — mentee creates a booking
router.post("/", requireAuth, async (req, res) => {
  if (req.userRole === "MENTOR") {
    return res.status(403).json({ error: "Mentors cannot book programs" });
  }

  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { programId, note } = parsed.data;
  const menteeId = req.userId!;

  // Fetch the program (must be published and mentor must be approved)
  const program = await prisma.program.findFirst({
    where: {
      id: programId,
      isPublished: true,
      mentor: { isApproved: true },
    },
    include: { mentor: true },
  });

  if (!program) {
    return res.status(404).json({ error: "Program not found" });
  }

  // Prevent mentee from booking their own program
  const mentorUser = await prisma.user.findUnique({
    where: { id: program.mentor.userId },
  });
  if (mentorUser?.id === menteeId) {
    return res.status(400).json({ error: "You cannot book your own program" });
  }

  // Prevent duplicate active bookings
  const existing = await prisma.booking.findFirst({
    where: {
      programId,
      menteeId,
      status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
    },
  });
  if (existing) {
    return res.status(409).json({ error: "You already have an active booking for this program" });
  }

  const booking = await prisma.booking.create({
    data: {
      programId,
      menteeId,
      mentorId: program.mentorId,
      totalPrice: program.price,
      note,
    },
    include: {
      program: {
        select: { id: true, title: true, duration: true, sessionCount: true, topics: true },
      },
      mentor: {
        select: { id: true, headline: true, user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      },
    },
  });

  return res.status(201).json({ booking });
});

// GET /api/bookings — list own bookings
router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const role = req.userRole;

  let where: Record<string, unknown> = {};
  if (role === "MENTOR" || role === "ADMIN") {
    // Find their mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (mentorProfile) {
      where = { mentorId: mentorProfile.id };
    } else {
      return res.json({ bookings: [] });
    }
  } else {
    where = { menteeId: userId };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      program: {
        select: { id: true, title: true, duration: true, sessionCount: true, topics: true },
      },
      mentor: {
        select: { id: true, headline: true, user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      },
      mentee: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      sessions: {
        select: { id: true, scheduledAt: true, status: true, duration: true },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  return res.json({ bookings });
});

// GET /api/bookings/:id — get booking detail (own only)
router.get("/:id", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const role = req.userRole;

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      program: {
        select: { id: true, title: true, description: true, duration: true, sessionCount: true, price: true, topics: true },
      },
      mentor: {
        select: { id: true, headline: true, user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      },
      mentee: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
      },
      sessions: {
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });

  // Check ownership
  const mentorProfile = role === "MENTOR" || role === "ADMIN"
    ? await prisma.mentorProfile.findUnique({ where: { userId } })
    : null;

  const isMentee = booking.menteeId === userId;
  const isMentor = mentorProfile ? booking.mentorId === mentorProfile.id : false;

  if (!isMentee && !isMentor) {
    return res.status(404).json({ error: "Booking not found" });
  }

  return res.json({ booking });
});

// PATCH /api/bookings/:id/confirm — mentor confirms
router.patch("/:id/confirm", requireAuth, requireMentor, async (req, res) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: req.userId! } });
  if (!mentorProfile) return res.status(403).json({ error: "Mentor profile not found" });

  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, mentorId: mentorProfile.id },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.status !== "PENDING") {
    return res.status(400).json({ error: `Cannot confirm a booking with status ${booking.status}` });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED" },
    include: {
      program: { select: { id: true, title: true, duration: true, sessionCount: true } },
      mentor: { select: { id: true, user: { select: { id: true, firstName: true, lastName: true } } } },
      mentee: { select: { id: true, firstName: true, lastName: true } },
      sessions: true,
    },
  });

  return res.json({ booking: updated });
});

// PATCH /api/bookings/:id/cancel — either party cancels
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const role = req.userRole;

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  // Check ownership
  const mentorProfile = role === "MENTOR" || role === "ADMIN"
    ? await prisma.mentorProfile.findUnique({ where: { userId } })
    : null;

  const isMentee = booking.menteeId === userId;
  const isMentor = mentorProfile ? booking.mentorId === mentorProfile.id : false;
  const isAdmin = role === "ADMIN";

  if (!isMentee && !isMentor && !isAdmin) {
    return res.status(404).json({ error: "Booking not found" });
  }

  if (booking.status === "CANCELLED") {
    return res.status(400).json({ error: "Booking is already cancelled" });
  }
  if (booking.status === "COMPLETED") {
    return res.status(400).json({ error: "Cannot cancel a completed booking" });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
    include: {
      program: { select: { id: true, title: true } },
      sessions: { select: { id: true, scheduledAt: true, status: true } },
    },
  });

  return res.json({ booking: updated });
});

// POST /api/bookings/:id/sessions — mentor schedules a session
router.post("/:id/sessions", requireAuth, requireMentor, async (req, res) => {
  const parsed = scheduleSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: req.userId! } });
  if (!mentorProfile) return res.status(403).json({ error: "Mentor profile not found" });

  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, mentorId: mentorProfile.id },
    include: { program: true, sessions: true },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });

  if (booking.status === "CANCELLED") {
    return res.status(400).json({ error: "Cannot schedule sessions for a cancelled booking" });
  }
  if (booking.status === "COMPLETED") {
    return res.status(400).json({ error: "Booking is already completed" });
  }

  // Check we haven't exceeded sessionCount
  const activeSessionCount = booking.sessions.filter(
    (s) => s.status !== "CANCELLED" && s.status !== "NO_SHOW"
  ).length;
  if (activeSessionCount >= booking.program.sessionCount) {
    return res.status(400).json({
      error: `This program only allows ${booking.program.sessionCount} session(s)`,
    });
  }

  const { scheduledAt, meetingUrl } = parsed.data;

  const session = await prisma.mentoringSession.create({
    data: {
      bookingId: booking.id,
      scheduledAt: new Date(scheduledAt),
      duration: booking.program.duration,
      meetingUrl: meetingUrl || null,
    },
  });

  // Auto-set booking to ACTIVE when first session is scheduled
  if (booking.status === "CONFIRMED" || booking.status === "PENDING") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "ACTIVE" },
    });
  }

  return res.status(201).json({ session });
});

export default router;
