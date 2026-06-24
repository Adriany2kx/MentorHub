import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import mentorRoutes from "../../src/routes/mentor.js";
import mentorsRoutes from "../../src/routes/mentors.js";
import programsRoutes from "../../src/routes/programs.js";
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
} from "../helpers/index.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestId);
app.use("/api/mentor", mentorRoutes);
app.use("/api/mentors", mentorsRoutes);
app.use("/api/programs", programsRoutes);
app.use(errorHandler);

describe("Mentor Integration Tests", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // ==========================================================================
  // Mentor Profile Management (mentor.ts)
  // ==========================================================================
  describe("POST /api/mentor/profile", () => {
    it("should create mentor profile for mentee", async () => {
      const mentee = await createMentee({ email: "user@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          headline: "Senior Software Engineer with 10 years experience",
          expertise: ["JavaScript", "React", "Node.js"],
          hourlyRate: 100,
          yearsExperience: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.mentorProfile).toBeDefined();
      expect(res.body.mentorProfile.headline).toContain("Senior Software Engineer");
      expect(res.body.mentorProfile.isApproved).toBe(false);
      expect(res.body.message).toMatch(/pending.*approval/i);

      // Verify user role was updated
      const user = await prisma.user.findUnique({ where: { id: mentee.id } });
      expect(user?.role).toBe("MENTOR");
    });

    it("should reject duplicate mentor profile", async () => {
      const { user: mentor } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .post("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          headline: "Another profile attempt",
          expertise: ["Python"],
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it("should reject headline too short", async () => {
      const mentee = await createMentee({ email: "user@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          headline: "Short",
          expertise: ["JavaScript"],
        });

      expect(res.status).toBe(400);
    });

    it("should reject empty expertise array", async () => {
      const mentee = await createMentee({ email: "user@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          headline: "Valid headline with enough characters",
          expertise: [],
        });

      expect(res.status).toBe(400);
    });

    it("should create profile without optional fields", async () => {
      const mentee = await createMentee({ email: "user@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          headline: "Junior developer looking to mentor",
          expertise: ["HTML", "CSS"],
        });

      expect(res.status).toBe(201);
      expect(res.body.mentorProfile.hourlyRate).toBeNull();
      expect(res.body.mentorProfile.yearsExperience).toBeNull();
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app)
        .post("/api/mentor/profile")
        .send({
          headline: "Valid headline here",
          expertise: ["JavaScript"],
        });

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/mentor/profile", () => {
    it("should update mentor profile", async () => {
      const { user: mentor } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .patch("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          headline: "Updated headline with new info",
          hourlyRate: 150,
        });

      expect(res.status).toBe(200);
      expect(res.body.mentorProfile.headline).toBe("Updated headline with new info");
      expect(Number(res.body.mentorProfile.hourlyRate)).toBe(150);
    });

    it("should update expertise array", async () => {
      const { user: mentor } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .patch("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          expertise: ["Python", "Machine Learning", "Data Science"],
        });

      expect(res.status).toBe(200);
      expect(res.body.mentorProfile.expertise).toHaveLength(3);
      expect(res.body.mentorProfile.expertise).toContain("Python");
    });

    it("should return 404 for non-mentor", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .patch("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`)
        .send({ headline: "Trying to update" });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/mentor/profile", () => {
    it("should return own mentor profile", async () => {
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .get("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.mentorProfile.id).toBe(mentorProfile.id);
      expect(res.body.mentorProfile.user).toBeDefined();
      expect(res.body.mentorProfile.user.email).toBe("mentor@test.com");
    });

    it("should return 404 for non-mentor", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/mentor/profile")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================================================
  // Public Mentor Listing (mentors.ts)
  // ==========================================================================
  describe("GET /api/mentors", () => {
    it("should list approved mentors", async () => {
      const { mentorProfile: mp1 } = await createMentor({ email: "mentor1@test.com" });
      const { mentorProfile: mp2 } = await createMentor({ email: "mentor2@test.com" });

      await prisma.mentorProfile.update({ where: { id: mp1.id }, data: { isApproved: true } });
      await prisma.mentorProfile.update({ where: { id: mp2.id }, data: { isApproved: true } });

      const res = await request(app).get("/api/mentors");

      expect(res.status).toBe(200);
      expect(res.body.mentors).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
    });

    it("should not list unapproved mentors", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isApproved: false } });

      const res = await request(app).get("/api/mentors");

      expect(res.status).toBe(200);
      expect(res.body.mentors).toHaveLength(0);
    });

    it("should filter by expertise", async () => {
      const { mentorProfile: mp1 } = await createMentor({ email: "mentor1@test.com" });
      const { mentorProfile: mp2 } = await createMentor({ email: "mentor2@test.com" });

      await prisma.mentorProfile.update({
        where: { id: mp1.id },
        data: { isApproved: true, expertise: ["JavaScript", "React"] },
      });
      await prisma.mentorProfile.update({
        where: { id: mp2.id },
        data: { isApproved: true, expertise: ["Python", "Django"] },
      });

      const res = await request(app).get("/api/mentors?expertise=JavaScript");

      expect(res.status).toBe(200);
      expect(res.body.mentors).toHaveLength(1);
      expect(res.body.mentors[0].expertise).toContain("JavaScript");
    });

    it("should filter by hourly rate range", async () => {
      const { mentorProfile: mp1 } = await createMentor({ email: "mentor1@test.com" });
      const { mentorProfile: mp2 } = await createMentor({ email: "mentor2@test.com" });

      await prisma.mentorProfile.update({
        where: { id: mp1.id },
        data: { isApproved: true, hourlyRate: 50 },
      });
      await prisma.mentorProfile.update({
        where: { id: mp2.id },
        data: { isApproved: true, hourlyRate: 150 },
      });

      const res = await request(app).get("/api/mentors?minRate=100&maxRate=200");

      expect(res.status).toBe(200);
      expect(res.body.mentors).toHaveLength(1);
      expect(Number(res.body.mentors[0].hourlyRate)).toBe(150);
    });

    it("should search by name or headline", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com", firstName: "John" });
      await prisma.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { isApproved: true, headline: "Machine Learning Expert" },
      });

      const res = await request(app).get("/api/mentors?search=Machine");

      expect(res.status).toBe(200);
      expect(res.body.mentors).toHaveLength(1);
    });

    it("should paginate results", async () => {
      // Create 5 approved mentors
      for (let i = 0; i < 5; i++) {
        const { mentorProfile } = await createMentor({ email: `mentor${i}@test.com` });
        await prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isApproved: true } });
      }

      const res = await request(app).get("/api/mentors?page=1&limit=2");

      expect(res.status).toBe(200);
      expect(res.body.mentors).toHaveLength(2);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.totalPages).toBe(3);
    });
  });

  describe("GET /api/mentors/:id", () => {
    it("should return mentor detail with programs", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isApproved: true } });
      await createProgram({ mentorId: mentorProfile.id, isPublished: true });

      const res = await request(app).get(`/api/mentors/${mentorProfile.id}`);

      expect(res.status).toBe(200);
      expect(res.body.mentor.id).toBe(mentorProfile.id);
      expect(res.body.mentor.user).toBeDefined();
      expect(res.body.mentor.programs).toHaveLength(1);
    });

    it("should return 404 for unapproved mentor", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isApproved: false } });

      const res = await request(app).get(`/api/mentors/${mentorProfile.id}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent mentor", async () => {
      const res = await request(app).get("/api/mentors/non-existent-id");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/mentors/:id/availability", () => {
    it("should return mentor availability", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isApproved: true } });

      await prisma.availability.createMany({
        data: [
          { mentorId: mentorProfile.id, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
          { mentorId: mentorProfile.id, dayOfWeek: 3, startTime: "14:00", endTime: "18:00" },
        ],
      });

      const res = await request(app).get(`/api/mentors/${mentorProfile.id}/availability`);

      expect(res.status).toBe(200);
      expect(res.body.availability).toHaveLength(2);
    });

    it("should return 404 for unapproved mentor", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isApproved: false } });

      const res = await request(app).get(`/api/mentors/${mentorProfile.id}/availability`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================================================
  // Program Management (programs.ts)
  // ==========================================================================
  describe("GET /api/programs", () => {
    it("should list published programs", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isApproved: true } });

      await createProgram({ mentorId: mentorProfile.id, isPublished: true });
      await createProgram({ mentorId: mentorProfile.id, isPublished: false }); // Should not appear

      const res = await request(app).get("/api/programs");

      expect(res.status).toBe(200);
      expect(res.body.programs).toHaveLength(1);
    });

    it("should filter by topic", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isApproved: true } });

      await prisma.program.create({
        data: {
          mentorId: mentorProfile.id,
          title: "React Bootcamp",
          duration: 60,
          sessionCount: 4,
          price: 200,
          topics: ["React", "JavaScript"],
          isPublished: true,
        },
      });

      const res = await request(app).get("/api/programs?topic=React");

      expect(res.status).toBe(200);
      expect(res.body.programs).toHaveLength(1);
    });

    it("should filter by price range", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await prisma.mentorProfile.update({ where: { id: mentorProfile.id }, data: { isApproved: true } });

      await createProgram({ mentorId: mentorProfile.id, price: 50, isPublished: true });
      await createProgram({ mentorId: mentorProfile.id, price: 200, isPublished: true });

      const res = await request(app).get("/api/programs?minPrice=100&maxPrice=300");

      expect(res.status).toBe(200);
      expect(res.body.programs).toHaveLength(1);
    });
  });

  describe("GET /api/programs/my", () => {
    it("should return mentor's own programs", async () => {
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      await createProgram({ mentorId: mentorProfile.id, isPublished: true });
      await createProgram({ mentorId: mentorProfile.id, isPublished: false });

      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .get("/api/programs/my")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.programs).toHaveLength(2); // Both published and unpublished
    });

    it("should reject non-mentor", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .get("/api/programs/my")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/programs/:id", () => {
    it("should return program detail", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id, isPublished: true });

      const res = await request(app).get(`/api/programs/${program.id}`);

      expect(res.status).toBe(200);
      expect(res.body.program.id).toBe(program.id);
      expect(res.body.program.mentor).toBeDefined();
    });

    it("should return 404 for unpublished program", async () => {
      const { mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id, isPublished: false });

      const res = await request(app).get(`/api/programs/${program.id}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent program", async () => {
      const res = await request(app).get("/api/programs/non-existent-id");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/programs", () => {
    it("should create program", async () => {
      const { user: mentor } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .post("/api/programs")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "React Masterclass",
          description: "Learn React from scratch",
          duration: 60,
          sessionCount: 8,
          price: 500,
          topics: ["React", "JavaScript", "Frontend"],
          isPublished: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.program).toBeDefined();
      expect(res.body.program.title).toBe("React Masterclass");
      expect(res.body.program.isPublished).toBe(false);
    });

    it("should create published program", async () => {
      const { user: mentor } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .post("/api/programs")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Quick Consultation",
          duration: 30,
          price: 50,
          isPublished: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.program.isPublished).toBe(true);
    });

    it("should reject invalid duration", async () => {
      const { user: mentor } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .post("/api/programs")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Invalid Program",
          duration: 5, // Less than 15 min
          price: 50,
        });

      expect(res.status).toBe(400);
    });

    it("should reject non-mentor", async () => {
      const mentee = await createMentee({ email: "mentee@test.com" });
      const { token } = await createSession(mentee.id);

      const res = await request(app)
        .post("/api/programs")
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Sneaky Program",
          duration: 60,
          price: 100,
        });

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/programs/:id", () => {
    it("should update own program", async () => {
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .patch(`/api/programs/${program.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({
          title: "Updated Title",
          price: 999,
        });

      expect(res.status).toBe(200);
      expect(res.body.program.title).toBe("Updated Title");
      expect(Number(res.body.program.price)).toBe(999);
    });

    it("should publish program", async () => {
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id, isPublished: false });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .patch(`/api/programs/${program.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ isPublished: true });

      expect(res.status).toBe(200);
      expect(res.body.program.isPublished).toBe(true);
    });

    it("should return 404 for other mentor's program", async () => {
      const { mentorProfile: mp1 } = await createMentor({ email: "mentor1@test.com" });
      const { user: mentor2 } = await createMentor({ email: "mentor2@test.com" });
      const program = await createProgram({ mentorId: mp1.id });
      const { token } = await createSession(mentor2.id);

      const res = await request(app)
        .patch(`/api/programs/${program.id}`)
        .set("Cookie", `sessionToken=${token}`)
        .send({ title: "Hacked Title" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/programs/:id", () => {
    it("should delete own program", async () => {
      const { user: mentor, mentorProfile } = await createMentor({ email: "mentor@test.com" });
      const program = await createProgram({ mentorId: mentorProfile.id });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .delete(`/api/programs/${program.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);

      const deleted = await prisma.program.findUnique({ where: { id: program.id } });
      expect(deleted).toBeNull();
    });

    it("should return 404 for other mentor's program", async () => {
      const { mentorProfile: mp1 } = await createMentor({ email: "mentor1@test.com" });
      const { user: mentor2 } = await createMentor({ email: "mentor2@test.com" });
      const program = await createProgram({ mentorId: mp1.id });
      const { token } = await createSession(mentor2.id);

      const res = await request(app)
        .delete(`/api/programs/${program.id}`)
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent program", async () => {
      const { user: mentor } = await createMentor({ email: "mentor@test.com" });
      const { token } = await createSession(mentor.id);

      const res = await request(app)
        .delete("/api/programs/non-existent-id")
        .set("Cookie", `sessionToken=${token}`);

      expect(res.status).toBe(404);
    });
  });
});
