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
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:5173",

  SESSION_SECRET: required("SESSION_SECRET"),
  COOKIE_NAME: process.env.COOKIE_NAME ?? "sessionToken",
  COOKIE_SECURE: process.env.NODE_ENV === "production",
  COOKIE_SAMESITE: (process.env.COOKIE_SAMESITE ?? "strict") as "strict" | "lax",
  SESSION_TTL_MS: parseInt(process.env.SESSION_TTL_MS ?? "3600000", 10), // 1 hour

  EMAIL_FROM: process.env.EMAIL_FROM ?? "noreply@example.com",
  SMTP_HOST: process.env.SMTP_HOST ?? "localhost",
  SMTP_PORT: parseInt(process.env.SMTP_PORT ?? "587", 10),
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",

  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
  LOG_FILE_PATH: process.env.LOG_FILE_PATH ?? "",

  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS ?? "5", 10),
  LOCKOUT_DURATION_MS: parseInt(process.env.LOCKOUT_DURATION_MS ?? "900000", 10), // 15 min

  EMAIL_VERIFICATION_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_TTL_MS: 60 * 60 * 1000, // 1 hour
} as const;
