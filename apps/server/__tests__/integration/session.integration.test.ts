import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import sessionRoutes from "../../src/routes/sessions.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { requestId } from "../../src/middleware/requestId.js";
import {
  prisma,
  cleanupDatabase,
  disconnectDatabase,
  createMentee,
  createMentor,
  createSession,
  createProgram,
  createBooking,
  createMentoringSession,
} from "../helpers/index.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use("/api/sessions", sessionRoutes);
app.use(errorHandler);

describe("Session Integration Tests", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("GET /api/sessions", () => {
    it("should list sessions for mentee", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      await createMentoringSession({ bookingId: booking.id, status: "SCHEDULED" });
      await createMentoringSession({ bookingId: booking.id, status: "SCHEDULED" });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/sessions")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(2);
      expect(res.body.sessions[0].booking).toBeDefined();
      expect(res.body.sessions[0].booking.mentee).toBeDefined();
    });

    it("should list sessions for mentor", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      await createMentoringSession({ bookingId: booking.id });

      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .get("/api/sessions")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(1);
    });

    it("should return empty array for mentee with no sessions", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/sessions")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(0);
    });

    it("should not return other user's sessions", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee1.id,
        mentorId: mentorProfile.id,
      });

      await createMentoringSession({ bookingId: booking.id });

      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .get("/api/sessions")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(0);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/sessions");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/sessions/:id", () => {
    it("should return session detail for mentee", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
        duration: 60,
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/sessions/${mentoringSession.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.session.id).toBe(mentoringSession.id);
      expect(res.body.session.booking).toBeDefined();
      expect(res.body.session.booking.program).toBeDefined();
      expect(res.body.session.booking.mentor).toBeDefined();
      expect(res.body.session.booking.mentee).toBeDefined();
    });

    it("should return session detail for mentor", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({ bookingId: booking.id });

      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .get(`/api/sessions/${mentoringSession.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.session.id).toBe(mentoringSession.id);
    });

    it("should return 404 for non-existent session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/sessions/non-existent-id")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's session", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee1.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({ bookingId: booking.id });

      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .get(`/api/sessions/${mentoringSession.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/sessions/:id/complete", () => {
    it("should complete session as mentee with feedback and rating", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/complete`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          menteeFeedback: "Great session, learned a lot!",
          rating: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.session.status).toBe("COMPLETED");
      expect(res.body.session.menteeFeedback).toBe("Great session, learned a lot!");
      expect(res.body.session.rating).toBe(5);
    });

    it("should complete session as mentor with notes", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/complete`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          mentorNotes: "Covered React hooks and state management",
        });

      expect(res.status).toBe(200);
      expect(res.body.session.status).toBe("COMPLETED");
      expect(res.body.session.mentorNotes).toBe("Covered React hooks and state management");
    });

    it("should complete booking when all sessions are terminal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
        status: "CONFIRMED",
      });

      // Create single session
      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentee.id);

      await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/complete`)
        .set("Cookie", `sessionToken=${token}`)
        .send({});

      // Check booking is now completed
      const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
      expect(updatedBooking?.status).toBe("COMPLETED");
    });

    it("should reject completing already completed session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/complete`)
        .set("Cookie", `sessionToken=${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already completed/i);
    });

    it("should reject completing cancelled session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "CANCELLED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/complete`)
        .set("Cookie", `sessionToken=${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cancelled|no-show/i);
    });

    it("should reject invalid rating", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/complete`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ rating: 6 });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch("/api/sessions/non-existent-id/complete")
        .set("Cookie", `sessionToken=${token}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's session", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee1.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/complete`)
        .set("Cookie", `sessionToken=${token}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it("should ignore mentorNotes when mentee completes session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/complete`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          mentorNotes: "Trying to set mentor notes as mentee",
          menteeFeedback: "Valid feedback",
        });

      expect(res.status).toBe(200);
      expect(res.body.session.mentorNotes).toBeNull();
      expect(res.body.session.menteeFeedback).toBe("Valid feedback");
    });

    it("should ignore menteeFeedback when mentor completes session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/complete`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          mentorNotes: "Valid notes",
          menteeFeedback: "Trying to set mentee feedback as mentor",
          rating: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.session.mentorNotes).toBe("Valid notes");
      expect(res.body.session.menteeFeedback).toBeNull();
      expect(res.body.session.rating).toBeNull();
    });
  });

  describe("PATCH /api/sessions/:id/cancel", () => {
    it("should cancel scheduled session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/cancel`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.session.status).toBe("CANCELLED");
    });

    it("should allow mentor to cancel session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/cancel`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.session.status).toBe("CANCELLED");
    });

    it("should reject cancelling already cancelled session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "CANCELLED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/cancel`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already cancelled/i);
    });

    it("should reject cancelling completed session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/cancel`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/completed/i);
    });

    it("should return 404 for non-existent session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch("/api/sessions/non-existent-id/cancel")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's session", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee1.id,
        mentorId: mentorProfile.id,
      });

      const mentoringSession = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .patch(`/api/sessions/${mentoringSession.id}/cancel`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });
});
