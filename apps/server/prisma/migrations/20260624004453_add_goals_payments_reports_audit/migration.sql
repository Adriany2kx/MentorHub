-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('DOCUMENT', 'VIDEO', 'LINK', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('HARASSMENT', 'SPAM', 'INAPPROPRIATE_CONTENT', 'FAKE_PROFILE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "mentee_profiles" ADD COLUMN     "currentBlocker" TEXT,
ADD COLUMN     "insightsCache" JSONB,
ADD COLUMN     "insightsCachedAt" TIMESTAMP(3),
ADD COLUMN     "learningStyle" TEXT,
ADD COLUMN     "skills" JSONB,
ADD COLUMN     "targetIndustry" TEXT;

-- AlterTable
ALTER TABLE "mentoring_sessions" ADD COLUMN     "aiSummary" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspendedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "messageId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "bookingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "programId" TEXT,
    "bookingId" TEXT,
    "title" TEXT NOT NULL,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "fileType" "FileType" NOT NULL DEFAULT 'OTHER',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_reporterId_idx" ON "reports"("reporterId");

-- CreateIndex
CREATE INDEX "reports_reportedId_idx" ON "reports"("reportedId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "goals_menteeId_idx" ON "goals"("menteeId");

-- CreateIndex
CREATE INDEX "goals_bookingId_idx" ON "goals"("bookingId");

-- CreateIndex
CREATE INDEX "goals_menteeId_status_idx" ON "goals"("menteeId", "status");

-- CreateIndex
CREATE INDEX "milestones_goalId_idx" ON "milestones"("goalId");

-- CreateIndex
CREATE INDEX "resources_uploaderId_idx" ON "resources"("uploaderId");

-- CreateIndex
CREATE INDEX "resources_programId_idx" ON "resources"("programId");

-- CreateIndex
CREATE INDEX "resources_bookingId_idx" ON "resources"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bookingId_key" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_menteeId_status_idx" ON "bookings"("menteeId", "status");

-- CreateIndex
CREATE INDEX "bookings_mentorId_status_idx" ON "bookings"("mentorId", "status");

-- CreateIndex
CREATE INDEX "mentoring_sessions_bookingId_status_idx" ON "mentoring_sessions"("bookingId", "status");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
