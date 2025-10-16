import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All report routes require authentication
router.use(requireAuth);

// POST /api/reports — file a report
router.post("/", async (req, res) => {
  const parsed = z.object({
    reportedId: z.string(),
    messageId: z.string().optional(),
    reason: z.enum(["HARASSMENT", "SPAM", "INAPPROPRIATE_CONTENT", "FAKE_PROFILE", "OTHER"]),
    description: z.string().max(1000).optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  if (parsed.data.reportedId === req.user!.id) {
    return res.status(400).json({ error: "Cannot report yourself" });
  }

  const reported = await prisma.user.findUnique({ where: { id: parsed.data.reportedId } });
  if (!reported) {
    return res.status(404).json({ error: "User not found" });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: req.user!.id,
      reportedId: parsed.data.reportedId,
      messageId: parsed.data.messageId,
      reason: parsed.data.reason,
      description: parsed.data.description,
    },
    include: {
      reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
      reported: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  return res.status(201).json({ report });
});

export default router;
