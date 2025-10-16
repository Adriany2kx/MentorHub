import { prisma } from "./prisma.js";
import { generateToken, hashToken } from "./hash.js";
import { env } from "../config/env.js";

export async function createSession(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);

  const session = await prisma.session.create({
    data: {
      userId,
      sessionTokenHash: tokenHash,
      expiresAt: new Date(Date.now() + env.SESSION_TTL_MS),
    },
  });

  return { session, token };
}

export async function validateSession(token: string) {
  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { sessionTokenHash: tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;

  return session;
}

export async function revokeSession(token: string) {
  const tokenHash = hashToken(token);

  await prisma.session.updateMany({
    where: { sessionTokenHash: tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
