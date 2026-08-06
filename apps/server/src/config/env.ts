import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3000", 10),
  // Production: FRONTEND_URL must be explicitly set (not localhost). Controls CORS and cookie SameSite policy.
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:5173",

  SESSION_SECRET: required("SESSION_SECRET"),
  COOKIE_NAME: process.env.COOKIE_NAME ?? "sessionToken",
  COOKIE_SECURE: process.env.NODE_ENV === "production",
  COOKIE_SAMESITE: (process.env.COOKIE_SAMESITE ?? "strict") as "strict" | "lax",
  SESSION_TTL_MS: parseInt(process.env.SESSION_TTL_MS ?? "3600000", 10), // 1 hour

  EMAIL_FROM: process.env.EMAIL_FROM ?? "noreply@mentor-hub.app",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",

  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
  LOG_FILE_PATH: process.env.LOG_FILE_PATH ?? "",

  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS ?? "5", 10),
  LOCKOUT_DURATION_MS: parseInt(process.env.LOCKOUT_DURATION_MS ?? "900000", 10), // 15 min

  EMAIL_VERIFICATION_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_TTL_MS: 60 * 60 * 1000, // 1 hour

  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY ?? "",

  // AI / LLM (Google Gemini)
  // Using gemini-2.5-flash (stable June 2025) — 1M token context
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  AI_MODEL: process.env.AI_MODEL ?? "gemini-2.5-flash",
  AI_MENTOR_LIST_LIMIT: parseInt(process.env.AI_MENTOR_LIST_LIMIT ?? "50", 10), // Gemini 1M ctx handles more
  INSIGHTS_CACHE_TTL_HOURS: parseInt(process.env.INSIGHTS_CACHE_TTL_HOURS ?? "24", 10),
  SESSION_RECOMMENDATION_WINDOW_HOURS: parseInt(process.env.SESSION_RECOMMENDATION_WINDOW_HOURS ?? "48", 10),
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE ?? "20", 10),

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN ?? "",
  APP_VERSION: process.env.APP_VERSION ?? "0.0.0",

  // AWS S3 (optional, falls back to local disk if not set)
  AWS_REGION: process.env.AWS_REGION ?? "eu-west-1",
  S3_UPLOADS_BUCKET: process.env.S3_UPLOADS_BUCKET ?? "",

  // Clerk Authentication
  // CLERK_SECRET_KEY is read automatically by @clerk/express
  // CLERK_PUBLISHABLE_KEY is used by frontend (VITE_CLERK_PUBLISHABLE_KEY)
} as const;
