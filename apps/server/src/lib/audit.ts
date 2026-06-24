import { prisma } from "./prisma.js";
import { logger } from "./logger.js";
import type { Request } from "express";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "USER_BANNED"
  | "USER_UNBANNED"
  | "USER_SUSPENDED"
  | "USER_UNSUSPENDED"
  | "MENTOR_APPROVED"
  | "MENTOR_REJECTED"
  | "PAYMENT_REFUNDED"
  | "REPORT_RESOLVED"
  | "REPORT_DISMISSED"
  | "PROGRAM_DELETED"
  | "SESSION_CANCELLED"
  | "BOOKING_CANCELLED"
  | "PASSWORD_RESET"
  | "EMAIL_VERIFIED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED";

export type AuditTargetType =
  | "User"
  | "MentorProfile"
  | "Payment"
  | "Report"
  | "Program"
  | "MentoringSession"
  | "Booking";

interface AuditLogParams {
  actorId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: Prisma.InputJsonValue;
  req?: Request;
}

/**
 * Create an audit log entry for tracking admin actions and security events.
 * Non-blocking - failures are logged but don't throw.
 */
export async function auditLog(params: AuditLogParams): Promise<void> {
  const { actorId, action, targetType, targetId, metadata, req } = params;

  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        metadata: metadata ?? undefined,
        ipAddress: req?.ip ?? null,
        userAgent: req?.get("user-agent") ?? null,
      },
    });

    logger.info(
      { action, targetType, targetId, actorId },
      "Audit log created"
    );
  } catch (err) {
    // Log but don't throw - audit failures shouldn't break the main operation
    logger.error({ err, action, targetType, targetId }, "Failed to create audit log");
  }
}

/**
 * Query audit logs with filtering and pagination
 */
export async function queryAuditLogs(options: {
  actorId?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const {
    actorId,
    action,
    targetType,
    targetId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = options;

  const where: Record<string, unknown> = {};

  if (actorId) where.actorId = actorId;
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = targetId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
