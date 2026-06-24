import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/hash.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";
import { auditLog } from "../lib/audit.js";

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// GET /api/admin/stats — platform overview statistics
router.get("/stats", async (_req, res) => {
  const [
    totalUsers,
    totalMentors,
    totalMentees,
    totalPrograms,
    totalBookings,
    activeBookings,
    totalSessions,
    activeSessions,
    pendingMentors,
    totalRevenue,
    pendingReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "MENTOR" } }),
    prisma.user.count({ where: { role: "MENTEE" } }),
    prisma.program.count({ where: { isPublished: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: { in: ["ACTIVE", "CONFIRMED"] } } }),
    prisma.mentoringSession.count(),
    prisma.mentoringSession.count({ where: { status: "SCHEDULED" } }),
    prisma.mentorProfile.count({ where: { isApproved: false } }),
    prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: "COMPLETED" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  return res.json({
    stats: {
      totalUsers,
      totalMentors,
      totalMentees,
      totalPrograms,
      totalBookings,
      activeBookings,
      totalSessions,
      activeSessions,
      pendingMentors,
      pendingReports,
      totalRevenue: totalRevenue._sum.totalPrice ? parseFloat(String(totalRevenue._sum.totalPrice)) : 0,
    },
  });
});

// GET /api/admin/users — paginated user list with search
router.get("/users", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"))));
  const skip = (page - 1) * limit;
  const search = String(req.query.search ?? "").trim();
  const role = req.query.role as string | undefined;

  const where = {
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(role && ["MENTEE", "MENTOR", "ADMIN"].includes(role)
      ? { role: role as "MENTEE" | "MENTOR" | "ADMIN" }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        createdAt: true,
        avatarUrl: true,
        mentorProfile: { select: { id: true, isApproved: true, headline: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.json({
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/users/:id — single user detail
router.get("/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      mentorProfile: true,
      menteeProfile: true,
      bookings: { orderBy: { createdAt: "desc" }, take: 5, include: { program: { select: { title: true } } } },
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
});

// POST /api/admin/users/create — create a new admin account
router.post("/users/create", async (req, res) => {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { email, password, firstName, lastName } = parsed.data;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  // Hash password and create admin user
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: "ADMIN",
      isVerified: true,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });

  return res.status(201).json({ user });
});

// PATCH /api/admin/users/:id — update user role
router.patch("/users/:id", async (req, res) => {
  const parsed = z.object({
    role: z.enum(["MENTEE", "MENTOR", "ADMIN"]).optional(),
    isVerified: z.boolean().optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isVerified: true },
  });

  return res.json({ user: updated });
});

// GET /api/admin/mentors — all mentor profiles with optional filter
router.get("/mentors", async (req, res) => {
  const filter = req.query.filter as string | undefined; // "pending" | "approved" | undefined = all
  const where = filter === "pending" ? { isApproved: false }
    : filter === "approved" ? { isApproved: true }
    : {};

  const mentors = await prisma.mentorProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { programs: true, reviews: true } },
    },
  });

  return res.json({ mentors });
});

// GET /api/admin/mentors/pending — unapproved mentor profiles
router.get("/mentors/pending", async (_req, res) => {
  const mentors = await prisma.mentorProfile.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  return res.json({ mentors });
});

// PATCH /api/admin/mentors/:id/approve — approve a mentor
router.patch("/mentors/:id/approve", async (req, res) => {
  const profile = await prisma.mentorProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { email: true } } },
  });
  if (!profile) return res.status(404).json({ error: "Mentor profile not found" });

  const updated = await prisma.mentorProfile.update({
    where: { id: req.params.id },
    data: { isApproved: true },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  await auditLog({
    actorId: req.user!.id,
    action: "MENTOR_APPROVED",
    targetType: "MentorProfile",
    targetId: req.params.id,
    metadata: { userId: profile.userId, email: profile.user.email },
    req,
  });

  return res.json({ mentor: updated });
});

// DELETE /api/admin/mentors/:id — reject/remove mentor profile
router.delete("/mentors/:id", async (req, res) => {
  const profile = await prisma.mentorProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { email: true } } },
  });
  if (!profile) return res.status(404).json({ error: "Mentor profile not found" });

  await prisma.mentorProfile.delete({ where: { id: req.params.id } });

  await auditLog({
    actorId: req.user!.id,
    action: "MENTOR_REJECTED",
    targetType: "MentorProfile",
    targetId: req.params.id,
    metadata: { userId: profile.userId, email: profile.user.email },
    req,
  });

  return res.json({ message: "Mentor profile removed" });
});

// GET /api/admin/programs — all programs with mentor info
router.get("/programs", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"))));
  const skip = (page - 1) * limit;
  const search = String(req.query.search ?? "").trim();

  const where = search
    ? { title: { contains: search, mode: "insensitive" as const } }
    : {};

  const [programs, total] = await Promise.all([
    prisma.program.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        mentor: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.program.count({ where }),
  ]);

  return res.json({ programs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// PATCH /api/admin/programs/:id — toggle publish status
router.patch("/programs/:id", async (req, res) => {
  const parsed = z.object({ isPublished: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid data" });

  const program = await prisma.program.findUnique({ where: { id: req.params.id } });
  if (!program) return res.status(404).json({ error: "Program not found" });

  const updated = await prisma.program.update({
    where: { id: req.params.id },
    data: { isPublished: parsed.data.isPublished },
    include: { mentor: { select: { user: { select: { firstName: true, lastName: true, email: true } } } }, _count: { select: { bookings: true } } },
  });

  return res.json({ program: updated });
});

// DELETE /api/admin/programs/:id — remove a program
router.delete("/programs/:id", async (req, res) => {
  const program = await prisma.program.findUnique({ where: { id: req.params.id } });
  if (!program) return res.status(404).json({ error: "Program not found" });

  await prisma.program.delete({ where: { id: req.params.id } });

  await auditLog({
    actorId: req.user!.id,
    action: "PROGRAM_DELETED",
    targetType: "Program",
    targetId: req.params.id,
    metadata: { title: program.title, mentorId: program.mentorId },
    req,
  });

  return res.json({ message: "Program deleted" });
});

// PATCH /api/admin/users/:id/ban — toggle ban status
router.patch("/users/:id/ban", async (req, res) => {
  const parsed = z.object({ isBanned: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid data" });

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBanned: parsed.data.isBanned },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isBanned: true },
  });

  await auditLog({
    actorId: req.user!.id,
    action: parsed.data.isBanned ? "USER_BANNED" : "USER_UNBANNED",
    targetType: "User",
    targetId: req.params.id,
    metadata: { email: user.email },
    req,
  });

  return res.json({ user: updated });
});

// PATCH /api/admin/users/:id/suspend — set suspension period
router.patch("/users/:id/suspend", async (req, res) => {
  const parsed = z.object({ suspendedUntil: z.string().nullable() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid data" });

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { suspendedUntil: parsed.data.suspendedUntil ? new Date(parsed.data.suspendedUntil) : null },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, suspendedUntil: true },
  });

  const isSuspending = !!parsed.data.suspendedUntil;
  await auditLog({
    actorId: req.user!.id,
    action: isSuspending ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
    targetType: "User",
    targetId: req.params.id,
    metadata: { email: user.email, suspendedUntil: parsed.data.suspendedUntil },
    req,
  });

  return res.json({ user: updated });
});

const REPORT_STATUSES = ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"] as const;
type ReportStatus = (typeof REPORT_STATUSES)[number];

// GET /api/admin/reports — paginated reports list
router.get("/reports", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = 20;
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const validStatus = REPORT_STATUSES.includes(status as ReportStatus) ? (status as ReportStatus) : undefined;
  const where = validStatus ? { status: validStatus } : {};

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
        reported: { select: { id: true, email: true, firstName: true, lastName: true } },
        message: { select: { id: true, content: true, createdAt: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return res.json({ reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// PATCH /api/admin/reports/:id — update report status and notes
router.patch("/reports/:id", async (req, res) => {
  const parsed = z.object({
    status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]).optional(),
    adminNotes: z.string().max(1000).optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Invalid data" });

  const report = await prisma.report.findUnique({
    where: { id: req.params.id },
    include: { reported: { select: { id: true, email: true } } },
  });
  if (!report) return res.status(404).json({ error: "Report not found" });

  const updated = await prisma.report.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: {
      reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
      reported: { select: { id: true, email: true, firstName: true, lastName: true } },
      message: { select: { id: true, content: true } },
    },
  });

  // Audit log for resolved/dismissed reports
  if (parsed.data.status === "RESOLVED" || parsed.data.status === "DISMISSED") {
    await auditLog({
      actorId: req.user!.id,
      action: parsed.data.status === "RESOLVED" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
      targetType: "Report",
      targetId: req.params.id,
      metadata: {
        reason: report.reason,
        reportedUserId: report.reported.id,
        reportedEmail: report.reported.email,
      },
      req,
    });
  }

  return res.json({ report: updated });
});

export default router;
