import { Router } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const SyncBody = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
});

/**
 * @openapi
 * /auth/sync:
 *   post:
 *     tags: [Auth]
 *     summary: Sync Clerk user to database (creates or links user)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: User synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *                 created: { type: boolean }
 *       400: { description: Validation error }
 *       401: { description: Not authenticated }
 */
router.post("/sync", async (req, res) => {
  try {
    // Get Clerk user ID from the request
    const auth = getAuth(req);
    const clerkId = auth.userId;

    if (!clerkId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const parsed = SyncBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email } = parsed.data;

    // Check if user already exists with this clerkId (stored in auth0Id field)
    let user = await prisma.user.findUnique({ where: { auth0Id: clerkId } });
    let created = false;

    if (!user) {
      // Check if user exists with this email (link existing account)
      user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        // Link existing user to Clerk
        user = await prisma.user.update({
          where: { id: user.id },
          data: { auth0Id: clerkId, isVerified: true },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            auth0Id: clerkId, // Store Clerk ID in auth0Id field for compatibility
            isVerified: true, // Clerk handles email verification
          },
        });
        created = true;
      }
    }

    // Check safety status
    if (user.isBanned) {
      res.status(403).json({ error: "Account banned" });
      return;
    }

    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      res.status(403).json({ error: `Account suspended until ${user.suspendedUntil.toISOString()}` });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
      created,
    });
  } catch (err) {
    logger.error({ err }, "Auth sync error");
    res.status(500).json({ error: "Sync failed. Please try again." });
  }
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { description: Not authenticated }
 *       404: { description: User not found }
 */
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      isVerified: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});

export default router;
