import { faker } from "@faker-js/faker";
import { hashPassword } from "../../../src/lib/hash.js";
import { prisma } from "../testDb.js";
import type { Role } from "@prisma/client";

type CreateUserOptions = {
  email?: string;
  password?: string;
  role?: Role;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
  isBanned?: boolean;
  bio?: string;
  timezone?: string;
};

export async function createUser(options: CreateUserOptions = {}) {
  const password = options.password ?? "password123";
  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      email: options.email ?? faker.internet.email(),
      passwordHash,
      role: options.role ?? "MENTEE",
      firstName: options.firstName ?? faker.person.firstName(),
      lastName: options.lastName ?? faker.person.lastName(),
      isVerified: options.isVerified ?? true,
      isBanned: options.isBanned ?? false,
      bio: options.bio ?? faker.lorem.paragraph(),
      timezone: options.timezone ?? "UTC",
    },
  });
}

export async function createMentee(options: CreateUserOptions = {}) {
  const user = await createUser({ ...options, role: "MENTEE" });

  await prisma.menteeProfile.create({
    data: {
      userId: user.id,
      goals: faker.lorem.sentence(),
      interests: [faker.word.noun(), faker.word.noun()],
      currentRole: faker.person.jobTitle(),
      targetRole: faker.person.jobTitle(),
      skills: [
        { skill: "JavaScript", level: "intermediate" },
        { skill: "React", level: "beginner" },
      ],
    },
  });

  return user;
}

export async function createMentor(options: CreateUserOptions & { isApproved?: boolean } = {}) {
  const user = await createUser({ ...options, role: "MENTOR" });

  const mentorProfile = await prisma.mentorProfile.create({
    data: {
      userId: user.id,
      headline: faker.person.jobTitle(),
      expertise: [faker.word.noun(), faker.word.noun(), faker.word.noun()],
      hourlyRate: faker.number.int({ min: 50, max: 200 }),
      yearsExperience: faker.number.int({ min: 1, max: 20 }),
      isApproved: options.isApproved ?? true,
    },
  });

  return { user, mentorProfile };
}

export async function createAdmin(options: CreateUserOptions = {}) {
  return createUser({ ...options, role: "ADMIN" });
}

export async function createSession(userId: string): Promise<{ token: string; session: { id: string } }> {
  const crypto = await import("crypto");
  const { hashToken } = await import("../../../src/lib/hash.js");

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const session = await prisma.session.create({
    data: {
      userId,
      sessionTokenHash: tokenHash,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });

  return { token, session };
}
