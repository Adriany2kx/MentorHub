import type { Request, Response, NextFunction } from "express";
import { validateSession } from "../lib/session.js";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import type { Role } from "../generated/prisma/index.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
      user?: { id: string; isBanned: boolean; suspendedUntil: Date | null };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[env.COOKIE_NAME] as string | undefined;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const session = await validateSession(token);

  if (!session) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  // Fetch user role and safety status
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, isBanned: true, suspendedUntil: true },
  });

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Check if user is banned
  if (user.isBanned) {
    res.status(403).json({ error: "Account banned" });
    return;
  }

  // Check if user is suspended
  if (user.suspendedUntil && user.suspendedUntil > new Date()) {
    res.status(403).json({ error: `Account suspended until ${user.suspendedUntil.toISOString()}` });
    return;
  }

  req.userId = session.userId;
  req.userRole = user.role;
  req.user = { id: user.id, isBanned: user.isBanned, suspendedUntil: user.suspendedUntil };
  next();
}

export function requireMentor(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== "MENTOR" && req.userRole !== "ADMIN") {
    res.status(403).json({ error: "Mentor access required" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
