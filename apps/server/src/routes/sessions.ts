import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireId } from "../lib/validate.js";
import { completeSessionSchema } from "../schemas/session.schema.js";

const router = Router();

// Helper to check session ownership
async function getOwnedSession(sessionId: string, userId: string, userRole: string) {
  const session = await prisma.mentoringSession.findUnique({
    where: { id: sessionId },
    include: {
      booking: {
        select: {
          menteeId: true,
          mentorId: true,
          program: { select: { title: true, duration: true } },
        },
      },
    },
  });

  if (!session) return null;

  const mentorProfile =
    userRole === "MENTOR" || userRole === "ADMIN"
      ? await prisma.mentorProfile.findUnique({ where: { userId } })
      : null;

  const isMentee = session.booking.menteeId === userId;
  const isMentor = mentorProfile ? session.booking.mentorId === mentorProfile.id : false;
  const isAdmin = userRole === "ADMIN";

  if (!isMentee && !isMentor && !isAdmin) return null;
  return { session, isMentee, isMentor };
}

// GET /api/sessions — list own sessions
router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const role = req.userRole;

  let bookingWhere: Record<string, unknown> = {};

  if (role === "MENTOR" || role === "ADMIN") {
    const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (!mentorProfile) return res.json({ sessions: [] });
    bookingWhere = { mentorId: mentorProfile.id };
  } else {
    bookingWhere = { menteeId: userId };
  }

  const sessions = await prisma.mentoringSession.findMany({
    where: { booking: bookingWhere },
    orderBy: { scheduledAt: "asc" },
    include: {
      booking: {
        select: {
          id: true,
          status: true,
          program: { select: { id: true, title: true } },
          mentor: {
            select: {
              id: true,
              user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
  });

  return res.json({ sessions });
});

// GET /api/sessions/:id — get session detail
router.get("/:id", requireAuth, async (req, res) => {
  if (!requireId(req.params.id, res)) return;
  const id = req.params.id as string;
  const owned = await getOwnedSession(id, req.userId!, req.userRole!);
  if (!owned) return res.status(404).json({ error: "Session not found" });

  const full = await prisma.mentoringSession.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          program: { select: { id: true, title: true, duration: true, sessionCount: true } },
          mentor: {
            select: {
              id: true,
              headline: true,
              user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          mentee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
  });

  return res.json({ session: full });
});

// PATCH /api/sessions/:id/complete — mark session complete + add notes/feedback/rating
router.patch("/:id/complete", requireAuth, async (req, res) => {
  const parsed = completeSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const owned = await getOwnedSession(req.params.id as string, req.userId!, req.userRole!);
  if (!owned) return res.status(404).json({ error: "Session not found" });

  const { session, isMentee, isMentor } = owned;

  if (session.status === "COMPLETED") {
    return res.status(400).json({ error: "Session is already completed" });
  }
  if (session.status === "CANCELLED" || session.status === "NO_SHOW") {
    return res.status(400).json({ error: "Cannot complete a cancelled or no-show session" });
  }

  const { mentorNotes, menteeFeedback, rating } = parsed.data;

  // Only the mentor can set mentorNotes; only the mentee can set menteeFeedback/rating
  const updateData: Record<string, unknown> = { status: "COMPLETED" };
  if (isMentor && mentorNotes !== undefined) updateData.mentorNotes = mentorNotes;
  if (isMentee) {
    if (menteeFeedback !== undefined) updateData.menteeFeedback = menteeFeedback;
    if (rating !== undefined) updateData.rating = rating;
  }

  const updated = await prisma.mentoringSession.update({
    where: { id: session.id },
    data: updateData,
  });

  // Check if all sessions in the booking are in terminal state → complete booking
  const bookingSessions = await prisma.mentoringSession.findMany({
    where: { bookingId: session.bookingId },
  });

  const allTerminal = bookingSessions.every((s) =>
    ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(s.status === "COMPLETED" ? "COMPLETED" : s.status)
  );

  if (allTerminal) {
    await prisma.booking.update({
      where: { id: session.bookingId },
      data: { status: "COMPLETED" },
    });
  }

  return res.json({ session: updated });
});

// PATCH /api/sessions/:id/cancel — cancel a session
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const owned = await getOwnedSession(req.params.id as string, req.userId!, req.userRole!);
  if (!owned) return res.status(404).json({ error: "Session not found" });

  const { session } = owned;

  if (session.status === "CANCELLED") {
    return res.status(400).json({ error: "Session is already cancelled" });
  }
  if (session.status === "COMPLETED") {
    return res.status(400).json({ error: "Cannot cancel a completed session" });
  }

  const updated = await prisma.mentoringSession.update({
    where: { id: session.id },
    data: { status: "CANCELLED" },
  });

  return res.json({ session: updated });
});

export default router;
