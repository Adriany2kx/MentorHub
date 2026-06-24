import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import paymentRoutes from "../../src/routes/payments.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { requestId } from "../../src/middleware/requestId.js";
import {
  prisma,
  cleanupDatabase,
  disconnectDatabase,
  createMentee,
  createMentor,
  createAdmin,
  createSession,
  createProgram,
  createBooking,
  createPayment,
} from "../helpers/index.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use("/api/payments", paymentRoutes);
app.use(errorHandler);

describe("Payment Integration Tests", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("GET /api/payments", () => {
    it("should list payments for mentee", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      await createPayment({ bookingId: booking.id, amount: 150, status: "COMPLETED" });

      const res = await request(app)
        .get("/api/payments")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.payments).toHaveLength(1);
      expect(res.body.payments[0].booking.id).toBe(booking.id);
    });

    it("should return empty array for user with no payments", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/payments")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.payments).toHaveLength(0);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/payments");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/payments/mentor", () => {
    it("should return mentor earnings", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentor.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "COMPLETED",
      });

      await createPayment({ bookingId: booking.id, amount: 200, status: "COMPLETED" });

      const res = await request(app)
        .get("/api/payments/mentor")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.payments).toHaveLength(1);
      expect(res.body.totalEarnings).toBe(200);
      expect(res.body.pagination).toBeDefined();
    });

    it("should return 404 for non-mentor", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/payments/mentor")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/mentor profile not found/i);
    });

    it("should return zero earnings for mentor with no completed payments", async () => {
      const { user: mentor } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .get("/api/payments/mentor")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.payments).toHaveLength(0);
      expect(res.body.totalEarnings).toBe(0);
    });
  });

  describe("POST /api/payments", () => {
    it("should record a payment for a booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id, price: 100 });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        totalPrice: 100,
      });

      const res = await request(app)
        .post("/api/payments")
        .set("Cookie", `sessionToken=${token}`)
        .send({ bookingId: booking.id });

      expect(res.status).toBe(201);
      expect(res.body.payment).toBeDefined();
      expect(res.body.payment.status).toBe("COMPLETED");
    });

    it("should reject duplicate payment", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      await createPayment({ bookingId: booking.id });

      const res = await request(app)
        .post("/api/payments")
        .set("Cookie", `sessionToken=${token}`)
        .send({ bookingId: booking.id });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already recorded/i);
    });

    it("should return 404 for non-existent booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/payments")
        .set("Cookie", `sessionToken=${token}`)
        .send({ bookingId: "non-existent-id" });

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's booking", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee2.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee1.id,
        mentorId: mentorProfile.id,
      });

      const res = await request(app)
        .post("/api/payments")
        .set("Cookie", `sessionToken=${token}`)
        .send({ bookingId: booking.id });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/payments/checkout", () => {
    it("should initiate checkout and return session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id, price: 150 });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        totalPrice: 150,
      });

      const res = await request(app)
        .post("/api/payments/checkout")
        .set("Cookie", `sessionToken=${token}`)
        .send({ bookingId: booking.id });

      expect(res.status).toBe(200);
      expect(res.body.payment).toBeDefined();
      expect(res.body.payment.status).toBe("PENDING");
      expect(res.body.checkoutSession).toBeDefined();
      expect(res.body.checkoutSession.url).toContain(booking.id);
    });

    it("should reject checkout for already completed payment", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      await createPayment({ bookingId: booking.id, status: "COMPLETED" });

      const res = await request(app)
        .post("/api/payments/checkout")
        .set("Cookie", `sessionToken=${token}`)
        .send({ bookingId: booking.id });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already completed/i);
    });

    it("should return 404 for non-existent booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/payments/checkout")
        .set("Cookie", `sessionToken=${token}`)
        .send({ bookingId: "non-existent-id" });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/payments/:id/confirm", () => {
    it("should confirm pending payment", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const payment = await createPayment({ bookingId: booking.id, status: "PENDING" });

      const res = await request(app)
        .post(`/api/payments/${payment.id}/confirm`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.payment.status).toBe("COMPLETED");
    });

    it("should return 404 for non-existent payment", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/payments/non-existent-id/confirm")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });

    it("should reject confirmation for other user's payment", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee2.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee1.id,
        mentorId: mentorProfile.id,
      });

      const payment = await createPayment({ bookingId: booking.id, status: "PENDING" });

      const res = await request(app)
        .post(`/api/payments/${payment.id}/confirm`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/payments/admin", () => {
    it("should return all payments for admin", async () => {
      const admin = await createAdmin({ email: "admin@test.com" });
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(admin.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      await createPayment({ bookingId: booking.id, amount: 300, status: "COMPLETED" });

      const res = await request(app)
        .get("/api/payments/admin")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.payments).toHaveLength(1);
      expect(res.body.totalRevenue).toBe(300);
      expect(res.body.pagination).toBeDefined();
    });

    it("should reject non-admin", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/payments/admin")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/payments/:id", () => {
    it("should allow admin to update payment status", async () => {
      const admin = await createAdmin({ email: "admin@test.com" });
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(admin.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const payment = await createPayment({ bookingId: booking.id, status: "PENDING" });

      const res = await request(app)
        .patch(`/api/payments/${payment.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ status: "REFUNDED" });

      expect(res.status).toBe(200);
      expect(res.body.payment.status).toBe("REFUNDED");
    });

    it("should reject invalid status", async () => {
      const admin = await createAdmin({ email: "admin@test.com" });
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(admin.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const payment = await createPayment({ bookingId: booking.id });

      const res = await request(app)
        .patch(`/api/payments/${payment.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ status: "INVALID_STATUS" });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent payment", async () => {
      const admin = await createAdmin({ email: "admin@test.com" });
      const { token } = await createSession(admin.id);

      const res = await request(app)
        .patch("/api/payments/non-existent-id")
        .set("Cookie", `sessionToken=${token}`)
        .send({ status: "COMPLETED" });

      expect(res.status).toBe(404);
    });

    it("should reject non-admin", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const payment = await createPayment({ bookingId: booking.id });

      const res = await request(app)
        .patch(`/api/payments/${payment.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ status: "REFUNDED" });

      expect(res.status).toBe(403);
    });
  });
});
