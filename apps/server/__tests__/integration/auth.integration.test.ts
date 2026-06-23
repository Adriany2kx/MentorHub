import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "../../src/routes/auth.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { requestId } from "../../src/middleware/requestId.js";
import {
  prisma,
  cleanupDatabase,
  disconnectDatabase,
  createUser,
  createSession,
} from "../helpers/index.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use("/api/auth", authRoutes);
app.use(errorHandler);

describe("Auth Integration Tests", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          password: "Password123!",
          firstName: "Test",
          lastName: "User",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe("test@example.com");

      const user = await prisma.user.findUnique({ where: { email: "test@example.com" } });
      expect(user).toBeTruthy();
    });

    it("should reject duplicate email", async () => {
      await createUser({ email: "existing@example.com" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "existing@example.com",
          password: "Password123!",
          firstName: "Test",
          lastName: "User",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered/i);
    });

    it("should reject weak passwords", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          password: "weak",
          firstName: "Test",
          lastName: "User",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      await createUser({ email: "test@example.com", password: "Password123!", isVerified: true });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should reject invalid password", async () => {
      await createUser({ email: "test@example.com", password: "Password123!" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword!",
        });

      expect(res.status).toBe(401);
    });

    it("should reject banned users", async () => {
      await createUser({ email: "banned@example.com", password: "Password123!", isBanned: true });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "banned@example.com",
          password: "Password123!",
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/has been banned/i);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout authenticated user", async () => {
      const user = await createUser({ email: "test@example.com" });
      const { token } = await createSession(user.id);

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);

      // Session should be revoked
      const session = await prisma.session.findFirst({ where: { userId: user.id } });
      expect(session?.revokedAt).toBeTruthy();
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user when authenticated", async () => {
      const user = await createUser({ email: "test@example.com", firstName: "Test" });
      const { token } = await createSession(user.id);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.user.firstName).toBe("Test");
    });

    it("should return 401 without session", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
    });
  });
});
