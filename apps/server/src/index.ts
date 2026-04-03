import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
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
import { logger } from "./lib/logger.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust nginx reverse proxy so express-rate-limit reads the real client IP
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

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

// Structured request logging
app.use(requestLogger);

// Serve static files (uploaded avatars, resources)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
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
  res.json({ status: "ok" });
});

// Global error handler – always return JSON
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
});
