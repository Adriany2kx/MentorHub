import { faker } from "@faker-js/faker";
import { prisma } from "../testDb.js";
import type { BookingStatus, SessionStatus, GoalStatus } from "@prisma/client";

type CreateProgramOptions = {
  mentorId: string;
  title?: string;
  duration?: number;
  sessionCount?: number;
  price?: number;
  isPublished?: boolean;
};

export async function createProgram(options: CreateProgramOptions) {
  return prisma.program.create({
    data: {
      mentorId: options.mentorId,
      title: options.title ?? faker.commerce.productName(),
      description: faker.lorem.paragraph(),
      duration: options.duration ?? 60,
      sessionCount: options.sessionCount ?? 4,
      price: options.price ?? faker.number.int({ min: 100, max: 500 }),
      topics: [faker.word.noun(), faker.word.noun()],
      isPublished: options.isPublished ?? true,
    },
  });
}

type CreateBookingOptions = {
  programId: string;
  menteeId: string;
  mentorId: string;
  status?: BookingStatus;
  totalPrice?: number;
};

export async function createBooking(options: CreateBookingOptions) {
  return prisma.booking.create({
    data: {
      programId: options.programId,
      menteeId: options.menteeId,
      mentorId: options.mentorId,
      status: options.status ?? "CONFIRMED",
      totalPrice: options.totalPrice ?? faker.number.int({ min: 100, max: 500 }),
    },
  });
}

type CreateSessionOptions = {
  bookingId: string;
  scheduledAt?: Date;
  duration?: number;
  status?: SessionStatus;
};

export async function createMentoringSession(options: CreateSessionOptions) {
  return prisma.mentoringSession.create({
    data: {
      bookingId: options.bookingId,
      scheduledAt: options.scheduledAt ?? faker.date.future(),
      duration: options.duration ?? 60,
      status: options.status ?? "SCHEDULED",
    },
  });
}

type CreateGoalOptions = {
  menteeId: string;
  bookingId?: string;
  title?: string;
  status?: GoalStatus;
  progress?: number;
};

export async function createGoal(options: CreateGoalOptions) {
  return prisma.goal.create({
    data: {
      menteeId: options.menteeId,
      bookingId: options.bookingId,
      title: options.title ?? faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      status: options.status ?? "IN_PROGRESS",
      progress: options.progress ?? faker.number.int({ min: 0, max: 100 }),
    },
  });
}

type CreateMilestoneOptions = {
  goalId: string;
  title?: string;
  isCompleted?: boolean;
};

export async function createMilestone(options: CreateMilestoneOptions) {
  return prisma.milestone.create({
    data: {
      goalId: options.goalId,
      title: options.title ?? faker.lorem.sentence(),
      isCompleted: options.isCompleted ?? false,
      completedAt: options.isCompleted ? new Date() : null,
    },
  });
}

type CreatePaymentOptions = {
  bookingId: string;
  amount?: number;
  status?: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  stripePaymentId?: string;
};

export async function createPayment(options: CreatePaymentOptions) {
  return prisma.payment.create({
    data: {
      bookingId: options.bookingId,
      amount: options.amount ?? faker.number.int({ min: 100, max: 500 }),
      status: options.status ?? "COMPLETED",
      stripePaymentId: options.stripePaymentId ?? `pi_${faker.string.alphanumeric(24)}`,
    },
  });
}
