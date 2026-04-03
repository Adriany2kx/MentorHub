-- Enums
DO $$ BEGIN
  CREATE TYPE "ReportReason" AS ENUM ('HARASSMENT', 'SPAM', 'INAPPROPRIATE_CONTENT', 'FAKE_PROFILE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FileType" AS ENUM ('DOCUMENT', 'VIDEO', 'LINK', 'IMAGE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Reports
CREATE TABLE IF NOT EXISTS "reports" (
  "id"          TEXT NOT NULL,
  "reporterId"  TEXT NOT NULL,
  "reportedId"  TEXT NOT NULL,
  "messageId"   TEXT,
  "reason"      "ReportReason" NOT NULL,
  "description" TEXT,
  "status"      "ReportStatus" NOT NULL DEFAULT 'PENDING',
  "adminNotes"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "reports_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "reports_reporterId_idx" ON "reports"("reporterId");
CREATE INDEX IF NOT EXISTS "reports_reportedId_idx" ON "reports"("reportedId");
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status");

-- Goals
CREATE TABLE IF NOT EXISTS "goals" (
  "id"          TEXT NOT NULL,
  "menteeId"    TEXT NOT NULL,
  "bookingId"   TEXT,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "targetDate"  TIMESTAMP(3),
  "status"      "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "progress"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "goals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "goals_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "goals_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "goals_menteeId_idx" ON "goals"("menteeId");
CREATE INDEX IF NOT EXISTS "goals_bookingId_idx" ON "goals"("bookingId");
CREATE INDEX IF NOT EXISTS "goals_menteeId_status_idx" ON "goals"("menteeId", "status");

-- Milestones
CREATE TABLE IF NOT EXISTS "milestones" (
  "id"          TEXT NOT NULL,
  "goalId"      TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "milestones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "milestones_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "milestones_goalId_idx" ON "milestones"("goalId");

-- Resources
CREATE TABLE IF NOT EXISTS "resources" (
  "id"         TEXT NOT NULL,
  "uploaderId" TEXT NOT NULL,
  "programId"  TEXT,
  "bookingId"  TEXT,
  "title"      TEXT NOT NULL,
  "filePath"   TEXT,
  "fileSize"   INTEGER,
  "mimeType"   TEXT,
  "fileType"   "FileType" NOT NULL DEFAULT 'OTHER',
  "isPublic"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "resources_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "resources_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "resources_uploaderId_idx" ON "resources"("uploaderId");
CREATE INDEX IF NOT EXISTS "resources_programId_idx" ON "resources"("programId");
CREATE INDEX IF NOT EXISTS "resources_bookingId_idx" ON "resources"("bookingId");

-- Payments
CREATE TABLE IF NOT EXISTS "payments" (
  "id"              TEXT NOT NULL,
  "bookingId"       TEXT NOT NULL,
  "amount"          DECIMAL(10,2) NOT NULL,
  "status"          "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "stripePaymentId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_bookingId_key" UNIQUE ("bookingId"),
  CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
