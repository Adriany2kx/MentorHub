import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let dbAvailable: boolean | null = null;

export async function checkDatabaseConnection(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;
  try {
    await prisma.$connect();
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
  return dbAvailable;
}

export async function cleanupDatabase(): Promise<void> {
  if (!(await checkDatabaseConnection())) {
    return;
  }
  // Delete in order respecting foreign key constraints
  await prisma.milestone.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.mentoringSession.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.program.deleteMany();
  await prisma.session.deleteMany();
  await prisma.menteeProfile.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.user.deleteMany();
}

export async function disconnectDatabase(): Promise<void> {
  if (dbAvailable) {
    await prisma.$disconnect();
  }
}

export { prisma };
