import type { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma.js";
import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
      user?: { id: string; isBanned: boolean; suspendedUntil: Date | null };
    }
  }
}

// Validate Clerk JWT and load user from database
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Find user by clerkId (stored in auth0Id field for backwards compatibility)
    const user = await prisma.user.findFirst({
      where: { auth0Id: auth.userId },
      select: { id: true, role: true, isBanned: true, suspendedUntil: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: "Account banned" });
      return;
    }

    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      res.status(403).json({ error: `Account suspended until ${user.suspendedUntil.toISOString()}` });
      return;
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.user = { id: user.id, isBanned: user.isBanned, suspendedUntil: user.suspendedUntil };
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
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

// Export clerkClient for use in other routes
export { clerkClient };
