import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MentorHub API",
      version: env.APP_VERSION,
      description: "REST API for the MentorHub mentoring platform",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
          description: "Session cookie authentication",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            firstName: { type: "string", nullable: true },
            lastName: { type: "string", nullable: true },
            role: { type: "string", enum: ["MENTEE", "MENTOR", "ADMIN"] },
            avatarUrl: { type: "string", nullable: true },
            bio: { type: "string", nullable: true },
            timezone: { type: "string", nullable: true },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        MentorProfile: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            headline: { type: "string", nullable: true },
            expertise: { type: "array", items: { type: "string" } },
            hourlyRate: { type: "number", nullable: true },
            yearsExperience: { type: "integer", nullable: true },
            isApproved: { type: "boolean" },
          },
        },
        Program: {
          type: "object",
          properties: {
            id: { type: "string" },
            mentorId: { type: "string" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            duration: { type: "integer", description: "Duration in minutes" },
            sessionCount: { type: "integer" },
            price: { type: "number" },
            maxParticipants: { type: "integer" },
            topics: { type: "array", items: { type: "string" } },
            isPublished: { type: "boolean" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string" },
            programId: { type: "string" },
            menteeId: { type: "string" },
            mentorId: { type: "string" },
            status: { type: "string", enum: ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"] },
            totalPrice: { type: "number" },
            note: { type: "string", nullable: true },
          },
        },
        Session: {
          type: "object",
          properties: {
            id: { type: "string" },
            bookingId: { type: "string" },
            scheduledAt: { type: "string", format: "date-time" },
            duration: { type: "integer" },
            status: { type: "string", enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"] },
            meetingUrl: { type: "string", nullable: true },
            mentorNotes: { type: "string", nullable: true },
            menteeFeedback: { type: "string", nullable: true },
            rating: { type: "integer", minimum: 1, maximum: 5, nullable: true },
          },
        },
        Goal: {
          type: "object",
          properties: {
            id: { type: "string" },
            menteeId: { type: "string" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            targetDate: { type: "string", format: "date-time", nullable: true },
            status: { type: "string", enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"] },
            progress: { type: "integer", minimum: 0, maximum: 100 },
          },
        },
        Milestone: {
          type: "object",
          properties: {
            id: { type: "string" },
            goalId: { type: "string" },
            title: { type: "string" },
            isCompleted: { type: "boolean" },
            completedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string" },
            conversationId: { type: "string" },
            senderId: { type: "string" },
            content: { type: "string" },
            isRead: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string" },
            mentorId: { type: "string" },
            menteeId: { type: "string" },
            bookingId: { type: "string" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            title: { type: "string", nullable: true },
            content: { type: "string" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User management" },
      { name: "Mentors", description: "Public mentor directory" },
      { name: "Mentor Profile", description: "Mentor profile management" },
      { name: "Programs", description: "Mentoring programs" },
      { name: "Bookings", description: "Booking management" },
      { name: "Sessions", description: "Mentoring sessions" },
      { name: "Goals", description: "Goal tracking" },
      { name: "Messages", description: "Messaging system" },
      { name: "Reviews", description: "Mentor reviews" },
      { name: "AI", description: "AI-powered features" },
      { name: "Admin", description: "Admin operations" },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
