import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, generateToken, hashToken } from "../lib/hash.js";
import { createSession, revokeSession, revokeAllUserSessions } from "../lib/session.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email.js";
import { verifyRecaptcha } from "../lib/recaptcha.js";
import { logger } from "../lib/logger.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter, registerLimiter, resetLimiter } from "../middleware/rateLimiter.js";
import { env } from "../config/env.js";

const router = Router();

const AUTH_INVALID_MESSAGE = "Invalid email or password";
const RESET_GENERIC_MESSAGE = "If that email exists, we sent a reset link";

const RegisterBody = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  recaptchaToken: z.string().optional(),
});

const LoginBody = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1),
  recaptchaToken: z.string().optional(),
});

const RequestResetBody = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
});

const ResetPasswordBody = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

function setCookie(res: import("express").Response, token: string) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    maxAge: env.SESSION_TTL_MS,
    path: "/",
  });
}

function clearCookie(res: import("express").Response) {
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: "/",
  });
}

// POST /api/auth/register
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, password, recaptchaToken } = parsed.data;

    const recaptchaValid = await verifyRecaptcha(recaptchaToken || "", req.ip);
    if (!recaptchaValid) {
      res.status(400).json({ error: "CAPTCHA verification failed. Please try again." });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateToken();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        verificationToken,
        verificationTokenExpiry: new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_MS),
      },
    });

    sendVerificationEmail(email, verificationToken).catch(err => {
      logger.error({ err, email }, "Failed to send verification email");
    });

    const { session: _, token } = await createSession(user.id);
    setCookie(res, token);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    logger.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: AUTH_INVALID_MESSAGE });
    return;
  }

  const { email, password, recaptchaToken } = parsed.data;

  if (recaptchaToken) {
    const recaptchaValid = await verifyRecaptcha(recaptchaToken, req.ip);
    if (!recaptchaValid) {
      res.status(400).json({ error: "CAPTCHA verification failed. Please try again." });
      return;
    }
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: AUTH_INVALID_MESSAGE });
    return;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    res.status(401).json({ error: AUTH_INVALID_MESSAGE });
    return;
  }

  const { session: _, token } = await createSession(user.id);
  setCookie(res, token);

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
  });
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  const token = req.cookies[env.COOKIE_NAME] as string | undefined;
  if (token) {
    await revokeSession(token);
  }
  clearCookie(res);
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
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

// POST /api/auth/verify-email
router.post("/verify-email", resetLimiter, async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    res.status(400).json({ error: "Invalid or expired verification token" });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  res.json({ message: "Email verified successfully" });
});

// POST /api/auth/request-reset
router.post("/request-reset", resetLimiter, async (req, res) => {
  const parsed = RequestResetBody.safeParse(req.body);
  if (!parsed.success) {
    res.json({ message: RESET_GENERIC_MESSAGE });
    return;
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = generateToken();
    const resetTokenH = hashToken(resetToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: resetTokenH,
        resetTokenExpiry: new Date(Date.now() + env.PASSWORD_RESET_TTL_MS),
      },
    });

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (err) {
      logger.error({ err, email }, "Failed to send reset email");
    }
  }

  // Always return the same response to prevent email enumeration
  res.json({ message: RESET_GENERIC_MESSAGE });
});

// POST /api/auth/reset-password
router.post("/reset-password", resetLimiter, async (req, res) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { token, newPassword } = parsed.data;
  const tokenH = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenH,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiry: null,
    },
  });

  // Revoke all existing sessions for security
  await revokeAllUserSessions(user.id);

  res.json({ message: "Password reset successfully" });
});

export default router;
