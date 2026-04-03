ALTER TABLE "mentee_profiles" ADD COLUMN IF NOT EXISTS "skills" JSONB;
ALTER TABLE "mentoring_sessions" ADD COLUMN IF NOT EXISTS "aiSummary" JSONB;
