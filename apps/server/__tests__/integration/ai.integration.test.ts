import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import aiRoutes from "../../src/routes/ai.js";
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
  createMentoringSession,
} from "../helpers/index.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use("/api/ai", aiRoutes);
app.use(errorHandler);

describe("AI Integration Tests", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("GET /api/ai/profile-quality", () => {
    it("should return profile score for mentee with complete profile", async () => {
      const mentee = await createMentee({
        email: "mentee@test.com",
        bio: "I am a software developer looking to transition into machine learning. I have 5 years of experience in web development.",
        avatarUrl: "https://example.com/avatar.jpg",
        timezone: "America/New_York",
      });

      await prisma.menteeProfile.update({
        where: { userId: mentee.id },
        data: {
          currentRole: "Software Developer",
          targetRole: "ML Engineer",
          targetIndustry: "Technology",
          currentBlocker: "Need to learn Python and ML fundamentals",
          skills: [
            { skill: "JavaScript", level: "advanced" },
            { skill: "TypeScript", level: "intermediate" },
            { skill: "React", level: "advanced" },
            { skill: "Node.js", level: "intermediate" },
            { skill: "SQL", level: "intermediate" },
          ],
        },
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/profile-quality")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.score).toBeGreaterThanOrEqual(80);
      expect(res.body.suggestions).toBeDefined();
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });

    it("should return lower score with suggestions for sparse profile", async () => {
      // Create user without bio, avatar, or timezone
      const user = await prisma.user.create({
        data: {
          email: "sparse@test.com",
          passwordHash: "hash",
          role: "MENTEE",
          firstName: "Sparse",
          lastName: "User",
          isVerified: true,
        },
      });

      await prisma.menteeProfile.create({
        data: {
          userId: user.id,
          // Minimal profile - no skills, no blocker, no industry
        },
      });

      const { token } = await createSession(user.id);

      const res = await request(app)
        .get("/api/ai/profile-quality")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.score).toBeLessThan(30);
      expect(res.body.suggestions.length).toBeGreaterThan(3);
    });

    it("should return profile score for mentor", async () => {
      // Create mentor with complete profile: long bio + avatar + timezone + 3+ expertise
      const user = await prisma.user.create({
        data: {
          email: "mentor@test.com",
          passwordHash: "hash",
          role: "MENTOR",
          firstName: "Expert",
          lastName: "Mentor",
          isVerified: true,
          bio: "Senior engineer with 10 years of experience in backend systems and distributed architecture. I specialize in helping developers grow their careers.",
          avatarUrl: "https://example.com/mentor.jpg",
          timezone: "Europe/London",
        },
      });

      await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          headline: "Senior Backend Engineer",
          expertise: ["Backend Development", "System Design", "Distributed Systems"],
          hourlyRate: 100,
          yearsExperience: 10,
          isApproved: true,
        },
      });

      const { token } = await createSession(user.id);

      const res = await request(app)
        .get("/api/ai/profile-quality")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      // bio (15) + long bio bonus (5) + avatar (10) + timezone (5) + 3 expertise (25) = 60
      expect(res.body.score).toBeGreaterThanOrEqual(55);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/ai/profile-quality");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/ai/mentor-recommendations", () => {
    it("should return recommendations for mentee with complete profile", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor1@test.com" });
      await createMentor({ email: "mentor2@test.com" });

      await prisma.menteeProfile.update({
        where: { userId: mentee.id },
        data: {
          currentRole: "Junior Developer",
          targetRole: "Senior Developer",
          goals: "Become a better engineer",
        },
      });

      await prisma.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { isApproved: true },
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/mentor-recommendations")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendations).toBeDefined();
      expect(res.body.profileInsufficient).toBe(false);
    });

    it("should return profileInsufficient for incomplete profile", async () => {
      // Create an approved mentor first (required for profileInsufficient check to trigger)
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await prisma.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { isApproved: true },
      });

      // Create user with sparse mentee profile (missing currentRole, targetRole, goals)
      const user = await prisma.user.create({
        data: {
          email: "incomplete@test.com",
          passwordHash: "hash",
          role: "MENTEE",
          firstName: "Incomplete",
          lastName: "User",
          isVerified: true,
        },
      });

      await prisma.menteeProfile.create({
        data: {
          userId: user.id,
          // No currentRole, targetRole, or goals - triggers profileInsufficient
        },
      });

      const { token } = await createSession(user.id);

      const res = await request(app)
        .get("/api/ai/mentor-recommendations")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profileInsufficient).toBe(true);
      expect(res.body.recommendations).toHaveLength(0);
    });

    it("should return empty array when no approved mentors", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });

      await prisma.menteeProfile.update({
        where: { userId: mentee.id },
        data: {
          currentRole: "Developer",
          targetRole: "Senior Developer",
          goals: "Grow career",
        },
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/mentor-recommendations")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendations).toHaveLength(0);
    });
  });

  describe("GET /api/ai/compatibility/:mentorId", () => {
    it("should return compatibility score", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });

      await prisma.menteeProfile.update({
        where: { userId: mentee.id },
        data: {
          currentRole: "Developer",
          targetRole: "Senior Developer",
          interests: ["JavaScript", "React"],
        },
      });

      await prisma.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: {
          expertise: ["JavaScript", "React", "Node.js"],
        },
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/ai/compatibility/${mentorProfile.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.score).toBeDefined();
      expect(res.body.breakdown).toBeDefined();
      expect(res.body.breakdown.expertiseOverlap).toBeDefined();
      expect(res.body.breakdown.goalAlignment).toBeDefined();
      expect(res.body.breakdown.timezoneMatch).toBeDefined();
      expect(res.body.explanation).toBeDefined();
    });

    it("should return higher score for timezone match", async () => {
      const mentee = await createMentee({
        email: "mentee@test.com",
        timezone: "America/New_York",
      });
      const { mentorProfile, user: mentor } = await createMentor({
        email: "mentor@test.com",
        timezone: "America/New_York",
      });

      await prisma.menteeProfile.update({
        where: { userId: mentee.id },
        data: { interests: ["Python"] },
      });

      await prisma.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { expertise: ["Python"] },
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/ai/compatibility/${mentorProfile.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.breakdown.timezoneMatch).toBe(true);
    });

    it("should return 404 for non-existent mentor", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/compatibility/non-existent-id")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/ai/goal-mentors/:goalId", () => {
    it("should return mentor suggestions for goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });

      await prisma.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { isApproved: true, expertise: ["Machine Learning", "Python"] },
      });

      const goal = await createGoal({
        menteeId: mentee.id,
        title: "Learn Machine Learning",
        description: "Master ML fundamentals",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/ai/goal-mentors/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.mentors).toBeDefined();
    });

    it("should return 404 for non-existent goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/goal-mentors/non-existent-id")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for other user's goal", async () => {
      const mentee1 = await createMentee({ email: "mentee1@test.com" });
      const mentee2 = await createMentee({ email: "mentee2@test.com" });

      const goal = await createGoal({
        menteeId: mentee1.id,
        title: "My Goal",
      });

      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .get(`/api/ai/goal-mentors/${goal.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/ai/goals/micro-milestones", () => {
    it("should generate milestones for goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/ai/goals/micro-milestones")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Learn React",
          description: "Master React for frontend development",
        });

      expect(res.status).toBe(200);
      expect(res.body.milestones).toBeDefined();
      expect(Array.isArray(res.body.milestones)).toBe(true);
    });

    it("should reject empty title", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/ai/goals/micro-milestones")
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "" });

      expect(res.status).toBe(400);
    });

    it("should reject title exceeding max length", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/ai/goals/micro-milestones")
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "a".repeat(201) });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/ai/goals/:id/learning-path", () => {
    it("should return learning path for goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({
        menteeId: mentee.id,
        title: "Become a Data Scientist",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/ai/goals/${goal.id}/learning-path`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.path).toBeDefined();
      expect(Array.isArray(res.body.path)).toBe(true);
    });

    it("should return 404 for non-existent goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/goals/non-existent-id/learning-path")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/ai/goals/:id/prediction", () => {
    it("should return goal prediction with milestones", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const goal = await createGoal({
        menteeId: mentee.id,
        title: "Learn Python",
        progress: 50,
        bookingId: booking.id,
      });

      await createMilestone({ goalId: goal.id, title: "Basics", isCompleted: true });
      await createMilestone({ goalId: goal.id, title: "Advanced", isCompleted: false });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/ai/goals/${goal.id}/prediction`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.likelihood).toBeDefined();
      expect(res.body.trajectory).toBeDefined();
      expect(res.body.progress).toBe(50);
      expect(["on-track", "at-risk", "off-track", "completed"]).toContain(res.body.trajectory);
    });

    it("should return completed trajectory for 100% progress", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({
        menteeId: mentee.id,
        title: "Done Goal",
        progress: 100,
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/ai/goals/${goal.id}/prediction`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.trajectory).toBe("completed");
    });

    it("should return 404 for non-existent goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/goals/non-existent-id/prediction")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/ai/goals/:id/resources", () => {
    it("should return resource recommendations for goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const goal = await createGoal({
        menteeId: mentee.id,
        title: "Learn Kubernetes",
        progress: 30,
      });

      await createMilestone({ goalId: goal.id, title: "Docker basics", isCompleted: true });
      await createMilestone({ goalId: goal.id, title: "K8s pods", isCompleted: false });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/ai/goals/${goal.id}/resources`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.resources).toBeDefined();
      expect(Array.isArray(res.body.resources)).toBe(true);
    });

    it("should return 404 for non-existent goal", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/goals/non-existent-id/resources")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/ai/insights", () => {
    it("should return insights for mentee", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });

      await prisma.menteeProfile.update({
        where: { userId: mentee.id },
        data: {
          currentRole: "Developer",
          targetRole: "Senior Developer",
        },
      });

      const goal = await createGoal({ menteeId: mentee.id, title: "Grow skills" });
      await createMilestone({ goalId: goal.id, title: "Step 1" });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/insights")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.insights).toBeDefined();
      expect(res.body.cached).toBeDefined();
    });

    it("should return cached insights on second call", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });

      await prisma.menteeProfile.update({
        where: { userId: mentee.id },
        data: {
          currentRole: "Developer",
          targetRole: "Senior Developer",
        },
      });

      const { token } = await createSession(mentee.id);

      // First call - generates fresh insights
      const res1 = await request(app)
        .get("/api/ai/insights")
        .set("Cookie", `sessionToken=${token}`);

      expect(res1.status).toBe(200);
      expect(res1.body.cached).toBe(false);

      // Second call - should be cached
      const res2 = await request(app)
        .get("/api/ai/insights")
        .set("Cookie", `sessionToken=${token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.cached).toBe(true);
    });

    it("should return 404 for non-mentee", async () => {
      const { user: mentor } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .get("/api/ai/insights")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/ai/sessions/:id/agenda", () => {
    it("should return agenda for scheduled session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
        duration: 60,
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/ai/sessions/${session.id}/agenda`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.agenda).toBeDefined();
      expect(Array.isArray(res.body.agenda)).toBe(true);
    });

    it("should reject agenda for completed session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get(`/api/ai/sessions/${session.id}/agenda`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/only available for scheduled/i);
    });

    it("should return 404 for non-existent session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/ai/sessions/non-existent-id/agenda")
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

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "SCHEDULED",
      });

      const { token } = await createSession(mentee2.id);

      const res = await request(app)
        .get(`/api/ai/sessions/${session.id}/agenda`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/ai/sessions/:id/summary", () => {
    it("should generate summary from notes", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
        mentorNotes: "Discussed React hooks and state management. Mentee should practice useEffect.",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post(`/api/ai/sessions/${session.id}/summary`)
        .set("Cookie", `sessionToken=${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.keyPoints).toBeDefined();
      expect(res.body.summary.actionItems).toBeDefined();
    });

    it("should accept notes in request body", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post(`/api/ai/sessions/${session.id}/summary`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          mentorNotes: "Great progress on the project",
          menteeFeedback: "Learned a lot about architecture",
        });

      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
    });

    it("should reject when no notes available", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post(`/api/ai/sessions/${session.id}/summary`)
        .set("Cookie", `sessionToken=${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/no notes or feedback/i);
    });

    it("should return 404 for non-existent session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/ai/sessions/non-existent-id/summary")
        .set("Cookie", `sessionToken=${token}`)
        .send({ mentorNotes: "Some notes" });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/ai/sessions/:id/action-items", () => {
    it("should extract action items from session notes", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const goal = await createGoal({ menteeId: mentee.id, title: "Learn React", bookingId: booking.id });

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
        mentorNotes: "Complete the React tutorial. Practice useState hooks. Build a small project.",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post(`/api/ai/sessions/${session.id}/action-items`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.created).toBeDefined();
      expect(res.body.milestones).toBeDefined();
    });

    it("should use aiSummary action items if available", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const goal = await createGoal({ menteeId: mentee.id, title: "Learn React", bookingId: booking.id });

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
        aiSummary: {
          keyPoints: ["Discussed hooks"],
          decisions: ["Focus on useState first"],
          actionItems: ["Complete tutorial", "Practice hooks"],
          followUpQuestions: ["How did practice go?"],
        },
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post(`/api/ai/sessions/${session.id}/action-items`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.created).toBe(2);
    });

    it("should return note when no active goal exists", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
        aiSummary: {
          actionItems: ["Do something"],
        },
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post(`/api/ai/sessions/${session.id}/action-items`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.note).toMatch(/no active goal/i);
    });

    it("should reject when no notes to extract from", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });

      const booking = await createBooking({
        programId: program.id,
        menteeId: mentee.id,
        mentorId: mentorProfile.id,
      });

      const session = await createMentoringSession({
        bookingId: booking.id,
        status: "COMPLETED",
      });

      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post(`/api/ai/sessions/${session.id}/action-items`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/no notes/i);
    });

    it("should return 404 for non-existent session", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/ai/sessions/non-existent-id/action-items")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });
});
