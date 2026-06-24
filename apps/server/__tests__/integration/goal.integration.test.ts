import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import goalRoutes from "../../src/routes/goals.js";
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
  createGoal,
  createMilestone,
} from "../helpers/index.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use("/api/goals", goalRoutes);
app.use(errorHandler);

describe("Goal Integration Tests", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("GET /api/goals", () => {
    it("should list all goals for mentee", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      await createGoal({ menteeId: mentee.id, title: "Learn React" });
      await createGoal({ menteeId: mentee.id, title: "Learn TypeScript" });

      const res = await request(app)
        .get("/api/goals")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.goals).toHaveLength(2);
    });

    it("should filter goals by status", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      await createGoal({ menteeId: mentee.id, title: "Active Goal", status: "IN_PROGRESS" });
      await createGoal({ menteeId: mentee.id, title: "Completed Goal", status: "COMPLETED" });

      const res = await request(app)
        .get("/api/goals?status=IN_PROGRESS")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.goals).toHaveLength(1);
      expect(res.body.goals[0].title).toBe("Active Goal");
    });

    it("should return empty array for user with no goals", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/goals")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.goals).toHaveLength(0);
    });

    it("should include milestones in goal list", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id, title: "Learn React" });
      await createMilestone({ goalId: goal.id, title: "Complete tutorial" });
      await createMilestone({ goalId: goal.id, title: "Build project" });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/goals")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.goals[0].milestones).toHaveLength(2);
    });

    it("should not return other user's goals", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });

      await createGoal({ menteeId: mentee1.id, title: "User 1 Goal" });

      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .get("/api/goals")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.goals).toHaveLength(0);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/goals");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/goals", () => {
    it("should create a goal without booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/goals")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Learn Machine Learning",
          description: "Master ML fundamentals",
        });

      expect(res.status).toBe(201);
      expect(res.body.goal).toBeDefined();
      expect(res.body.goal.title).toBe("Learn Machine Learning");
      expect(res.body.goal.description).toBe("Master ML fundamentals");
      expect(res.body.goal.status).toBe("NOT_STARTED");
    });

    it("should create a goal with booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/goals")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Program Goal",
          bookingId: booking.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.goal.booking).toBeDefined();
      expect(res.body.goal.booking.id).toBe(booking.id);
    });

    it("should create a goal with target date", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);
      const targetDate = new Date("2025-12-31").toISOString();

      const res = await request(app)
        .post("/api/goals")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Year-end Goal",
          targetDate,
        });

      expect(res.status).toBe(201);
      expect(res.body.goal.targetDate).toBeDefined();
    });

    it("should reject empty title", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/goals")
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "" });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent booking", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/goals")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Goal",
          bookingId: "non-existent-id",
        });

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's booking", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee1.id,
        mentorId: mentorProfile.id,
      });

      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .post("/api/goals")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Goal",
          bookingId: booking.id,
        });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/goals/:id", () => {
    it("should return goal detail", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({
        menteeId: mentee.id,
        title: "Learn React",
        description: "Master React hooks",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.goal.id).toBe(goal.id);
      expect(res.body.goal.title).toBe("Learn React");
      expect(res.body.goal.milestones).toBeDefined();
    });

    it("should include milestones in detail", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id, title: "Learn React" });
      await createMilestone({ goalId: goal.id, title: "Step 1" });
      await createMilestone({ goalId: goal.id, title: "Step 2" });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.goal.milestones).toHaveLength(2);
    });

    it("should return 404 for non-existent goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/goals/non-existent-id")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's goal", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const goal = await createGoal({ menteeId: mentee1.id, title: "Private Goal" });

      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .get(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/goals/:id", () => {
    it("should update goal title", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id, title: "Old Title" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "New Title" });

      expect(res.status).toBe(200);
      expect(res.body.goal.title).toBe("New Title");
    });

    it("should update goal status", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id, status: "NOT_STARTED" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.goal.status).toBe("IN_PROGRESS");
    });

    it("should update goal progress", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id, progress: 0 });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ progress: 50 });

      expect(res.status).toBe(200);
      expect(res.body.goal.progress).toBe(50);
    });

    it("should update goal target date", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id });
      const { token } = await createSession(mentee.id);
      const newDate = new Date("2026-06-01").toISOString();

      const res = await request(app)
        .patch(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ targetDate: newDate });

      expect(res.status).toBe(200);
      expect(res.body.goal.targetDate).toBeDefined();
    });

    it("should clear target date when set to null", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await prisma.goal.create({
        data: {
          menteeId: mentee.id,
          title: "Goal with date",
          targetDate: new Date("2025-12-31"),
        },
      });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ targetDate: null });

      expect(res.status).toBe(200);
      expect(res.body.goal.targetDate).toBeNull();
    });

    it("should return 404 for non-existent goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch("/api/goals/non-existent-id")
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "New Title" });

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's goal", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const goal = await createGoal({ menteeId: mentee1.id });
      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .patch(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "Hacked Title" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/goals/:id", () => {
    it("should delete own goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .delete(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);

      // Verify deletion
      const deleted = await prisma.goal.findUnique({ where: { id: goal.id } });
      expect(deleted).toBeNull();
    });

    it("should cascade delete milestones", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id });
      const milestone = await createMilestone({ goalId: goal.id });
      const { token } = await createSession(mentee.id);

      await request(app)
        .delete(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`);

      const deletedMilestone = await prisma.milestone.findUnique({ where: { id: milestone.id } });
      expect(deletedMilestone).toBeNull();
    });

    it("should return 404 for non-existent goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .delete("/api/goals/non-existent-id")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's goal", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const goal = await createGoal({ menteeId: mentee1.id });
      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .delete(`/api/goals/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/goals/:id/milestones", () => {
    it("should add milestone to goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post(`/api/goals/${goal.id}/milestones`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "Complete first chapter" });

      expect(res.status).toBe(201);
      expect(res.body.milestone).toBeDefined();
      expect(res.body.milestone.title).toBe("Complete first chapter");
      expect(res.body.milestone.isCompleted).toBe(false);
    });

    it("should reject empty milestone title", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post(`/api/goals/${goal.id}/milestones`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "" });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/goals/non-existent-id/milestones")
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "Milestone" });

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's goal", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const goal = await createGoal({ menteeId: mentee1.id });
      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .post(`/api/goals/${goal.id}/milestones`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "Sneaky Milestone" });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/goals/:goalId/milestones/:milestoneId", () => {
    it("should toggle milestone to completed", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id, progress: 0 });
      const milestone = await createMilestone({ goalId: goal.id, isCompleted: false });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/goals/${goal.id}/milestones/${milestone.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.milestone.isCompleted).toBe(true);
      expect(res.body.milestone.completedAt).toBeDefined();
    });

    it("should toggle milestone to incomplete", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id });
      const milestone = await createMilestone({ goalId: goal.id, isCompleted: true });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/goals/${goal.id}/milestones/${milestone.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.milestone.isCompleted).toBe(false);
      expect(res.body.milestone.completedAt).toBeNull();
    });

    it("should auto-update goal progress when milestone toggled", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id, progress: 0 });
      const milestone1 = await createMilestone({ goalId: goal.id, isCompleted: false });
      await createMilestone({ goalId: goal.id, isCompleted: false });
      const { token } = await createSession(mentee.id);

      // Complete first milestone (1/2 = 50%)
      const res = await request(app)
        .patch(`/api/goals/${goal.id}/milestones/${milestone1.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.progress).toBe(50);
    });

    it("should set progress to 100 when all milestones completed", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id, progress: 0 });
      const milestone = await createMilestone({ goalId: goal.id, isCompleted: false });
      const { token } = await createSession(mentee.id);

      // Complete only milestone (1/1 = 100%)
      const res = await request(app)
        .patch(`/api/goals/${goal.id}/milestones/${milestone.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.progress).toBe(100);
    });

    it("should return 404 for non-existent milestone", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({ menteeId: mentee.id });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch(`/api/goals/${goal.id}/milestones/non-existent-id`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's milestone", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });
      const goal = await createGoal({ menteeId: mentee1.id });
      const milestone = await createMilestone({ goalId: goal.id });
      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .patch(`/api/goals/${goal.id}/milestones/${milestone.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });
});
