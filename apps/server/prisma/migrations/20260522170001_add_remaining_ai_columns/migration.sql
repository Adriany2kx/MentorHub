ALTER TABLE "mentee_profiles" ADD COLUMN IF NOT EXISTS "targetIndustry" TEXT;
ALTER TABLE "mentee_profiles" ADD COLUMN IF NOT EXISTS "currentBlocker" TEXT;
ALTER TABLE "mentee_profiles" ADD COLUMN IF NOT EXISTS "learningStyle" TEXT;
ALTER TABLE "mentee_profiles" ADD COLUMN IF NOT EXISTS "insightsCache" JSONB;
ALTER TABLE "mentee_profiles" ADD COLUMN IF NOT EXISTS "insightsCachedAt" TIMESTAMP(3);
