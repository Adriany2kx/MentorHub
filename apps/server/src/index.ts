import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";
import { initSentry, Sentry } from "./lib/sentry.js";
import { logger } from "./lib/logger.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { noCache, cacheStatic } from "./middleware/cacheHeaders.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import mentorRoutes from "./routes/mentor.js";
import menteeRoutes from "./routes/mentee.js";
import mentorsRoutes from "./routes/mentors.js";
import programsRoutes from "./routes/programs.js";
import availabilityRoutes from "./routes/availability.js";
import bookingsRoutes from "./routes/bookings.js";
import sessionsRoutes from "./routes/sessions.js";
import conversationsRoutes from "./routes/conversations.js";
import reviewsRoutes from "./routes/reviews.js";
import goalsRoutes from "./routes/goals.js";
import resourcesRoutes from "./routes/resources.js";
import adminRoutes from "./routes/admin.js";
import paymentsRoutes from "./routes/payments.js";
import reportsRoutes from "./routes/reports.js";
import aiRoutes from "./routes/ai.js";

// Initialize Sentry first
initSentry();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust nginx reverse proxy so express-rate-limit reads the real client IP
app.set("trust proxy", 1);

// Request ID for tracing
app.use(requestId);

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// CORS – allow frontend origin with credentials
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// Body parsing
app.use(express.json());

// Cookie parsing
app.use(cookieParser());

// Clerk authentication middleware
app.use(clerkMiddleware());

// Structured request logging
app.use(requestLogger);

// Serve static files (uploaded avatars, resources) with cache headers
app.use("/uploads", cacheStatic(86400), express.static(path.join(__dirname, "../uploads")));

// Prevent caching of API responses
app.use("/api", noCache);

// API v1 Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/mentor", mentorRoutes);
app.use("/api/v1/mentee", menteeRoutes);
app.use("/api/v1/mentors", mentorsRoutes);
app.use("/api/v1/programs", programsRoutes);
app.use("/api/v1/availability", availabilityRoutes);
app.use("/api/v1/bookings", bookingsRoutes);
app.use("/api/v1/sessions", sessionsRoutes);
app.use("/api/v1/conversations", conversationsRoutes);
app.use("/api/v1/reviews", reviewsRoutes);
app.use("/api/v1/goals", goalsRoutes);
app.use("/api/v1/resources", resourcesRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/ai", aiRoutes);

// Legacy routes (backwards compatibility)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/mentee", menteeRoutes);
app.use("/api/mentors", mentorsRoutes);
app.use("/api/programs", programsRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: env.APP_VERSION });
});

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", version: env.APP_VERSION });
});

// API Documentation (development only)
if (env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));
}

// Sentry error handler (captures errors before our handler)
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler – always return JSON
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info({ signal }, "Shutdown signal received");
  server.close((err) => {
    if (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
    logger.info("Server closed gracefully");
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
