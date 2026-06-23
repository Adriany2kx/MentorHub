import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import bookingRoutes from "../../src/routes/bookings.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { requestId } from "../../src/middleware/requestId.js";
import {
  prisma,
  cleanupDatabase,
  disconnectDatabase,
  createUser,
  createMentor,
  createMentee,
  createSession,
  createProgram,
  createBooking,
} from "../helpers/index.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use("/api/bookings", bookingRoutes);
app.use(errorHandler);

describe("Booking Integration Tests", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("POST /api/bookings", () => {
    it("should create a booking for a mentee", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id, price: 150 });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/bookings")
        .set("Cookie", `sessionToken=${token}`)
        .send({ programId: program.id, note: "Looking forward to this!" });

      expect(res.status).toBe(201);
      expect(res.body.booking).toBeDefined();
      expect(Number(res.body.booking.totalPrice)).toBe(150);
      expect(res.body.booking.program.id).toBe(program.id);

      const booking = await prisma.booking.findFirst({ where: { menteeId: mentee.id } });
      expect(booking).toBeTruthy();
      expect(booking?.status).toBe("PENDING");
    });

    it("should reject booking from a mentor", async () => {
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const { mentorProfile: otherMentorProfile } = await createMentor({ email: "other@test.com" });
      const program = await createProgram({ mentorId: otherMentorProfile.id });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .post("/api/bookings")
        .set("Cookie", `sessionToken=${token}`)
        .send({ programId: program.id });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/mentors cannot book/i);
    });

    it("should reject duplicate active booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      // Create first booking
      await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "PENDING",
      });

      // Try to create another
      const res = await request(app)
        .post("/api/bookings")
        .set("Cookie", `sessionToken=${token}`)
        .send({ programId: program.id });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already have an active booking/i);
    });

    it("should return 404 for non-existent program", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/bookings")
        .set("Cookie", `sessionToken=${token}`)
        .send({ programId: "non-existent-id" });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/program not found/i);
    });

    it("should return 404 for unpublished program", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id, isPublished: false });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/bookings")
        .set("Cookie", `sessionToken=${token}`)
        .send({ programId: program.id });

      expect(res.status).toBe(404);
    });

    it("should reject unauthenticated requests", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .send({ programId: "some-id" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/bookings", () => {
    it("should list mentee bookings", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const res = await request(app)
        .get("/api/bookings")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.bookings).toHaveLength(1);
      expect(res.body.bookings[0].program.id).toBe(program.id);
    });

    it("should list mentor bookings (received)", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentor.id);

      await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const res = await request(app)
        .get("/api/bookings")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.bookings).toHaveLength(1);
      expect(res.body.bookings[0].mentee.id).toBe(mentee.id);
    });

    it("should return empty array for user with no bookings", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/bookings")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.bookings).toHaveLength(0);
    });
  });

  describe("GET /api/bookings/:id", () => {
    it("should return booking detail for mentee", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const res = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.id).toBe(booking.id);
      expect(res.body.booking.program).toBeDefined();
      expect(res.body.booking.mentor).toBeDefined();
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
        .get(`/api/bookings/${booking.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/bookings/non-existent-id")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/bookings/:id/confirm", () => {
    it("should allow mentor to confirm pending booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentor.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "PENDING",
      });

      const res = await request(app)
        .patch(`/api/bookings/${booking.id}/confirm`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe("CONFIRMED");
    });

    it("should reject confirming non-pending booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentor.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "CONFIRMED",
      });

      const res = await request(app)
        .patch(`/api/bookings/${booking.id}/confirm`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot confirm/i);
    });

    it("should reject mentee trying to confirm", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "PENDING",
      });

      const res = await request(app)
        .patch(`/api/bookings/${booking.id}/confirm`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/bookings/:id/cancel", () => {
    it("should allow mentee to cancel booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "PENDING",
      });

      const res = await request(app)
        .patch(`/api/bookings/${booking.id}/cancel`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe("CANCELLED");
    });

    it("should allow mentor to cancel booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentor.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "CONFIRMED",
      });

      const res = await request(app)
        .patch(`/api/bookings/${booking.id}/cancel`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe("CANCELLED");
    });

    it("should reject cancelling already cancelled booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "CANCELLED",
      });

      const res = await request(app)
        .patch(`/api/bookings/${booking.id}/cancel`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already cancelled/i);
    });

    it("should reject cancelling completed booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "COMPLETED",
      });

      const res = await request(app)
        .patch(`/api/bookings/${booking.id}/cancel`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot cancel.*completed/i);
    });
  });

  describe("POST /api/bookings/:id/sessions", () => {
    it("should allow mentor to schedule a session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id, sessionCount: 3 });
      const { token } = await createSession(mentor.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "CONFIRMED",
      });

      const scheduledAt = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

      const res = await request(app)
        .post(`/api/bookings/${booking.id}/sessions`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          scheduledAt,
          meetingUrl: "https://meet.google.com/abc-def-ghi",
        });

      expect(res.status).toBe(201);
      expect(res.body.session).toBeDefined();
      expect(res.body.session.meetingUrl).toBe("https://meet.google.com/abc-def-ghi");

      // Booking should now be ACTIVE
      const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
      expect(updatedBooking?.status).toBe("ACTIVE");
    });

    it("should reject scheduling on cancelled booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentor.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "CANCELLED",
      });

      const res = await request(app)
        .post(`/api/bookings/${booking.id}/sessions`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cancelled/i);
    });

    it("should reject exceeding session count limit", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id, sessionCount: 1 });
      const { token } = await createSession(mentor.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "ACTIVE",
      });

      // Create existing session
      await prisma.mentoringSession.create({
        data: {
          bookingId: booking.id,
          scheduledAt: new Date(),
          duration: 60,
          status: "SCHEDULED",
        },
      });

      // Try to schedule another
      const res = await request(app)
        .post(`/api/bookings/${booking.id}/sessions`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/only allows 1 session/i);
    });

    it("should reject mentee trying to schedule", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentee.id);

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "CONFIRMED",
      });

      const res = await request(app)
        .post(`/api/bookings/${booking.id}/sessions`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(403);
    });
  });
});
