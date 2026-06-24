import "dotenv/config";
import { vi } from "vitest";

// Set test environment variables BEFORE any imports
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-min-32-chars-long";
process.env.NODE_ENV = "test";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test_key";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_key";

// ============================================================================
// All vi.mock() calls MUST be at top level of this setup file
// ============================================================================

// Mock Resend
vi.mock("resend", () => {
  const mockSend = vi.fn().mockResolvedValue({ id: "email_test" });
  return {
    Resend: function () {
      return {
        emails: {
          send: mockSend,
        },
      };
    },
  };
});

// Mock Google Generative AI (old SDK)
vi.mock("@google/generative-ai", () => {
  const mockResponses: Record<string, unknown> = {
    "mentor-matching": [
      { mentorId: "test-mentor-1", score: 95, reason: "Strong expertise match" },
      { mentorId: "test-mentor-2", score: 85, reason: "Good goal alignment" },
    ],
    compatibility: { explanation: "Good match based on shared expertise areas." },
    milestone: [
      { title: "Setup development environment", description: "Install tools", order: 1, suggestedWeeks: 1 },
      { title: "Complete online course", description: "Learn basics", order: 2, suggestedWeeks: 2 },
      { title: "Build practice project", description: "Apply knowledge", order: 3, suggestedWeeks: 3 },
    ],
    "learning path": [
      { stage: "Foundation", focus: "Core concepts", resourceTypes: ["courses"], estimatedDuration: "2 weeks" },
      { stage: "Practice", focus: "Hands-on projects", resourceTypes: ["tutorials"], estimatedDuration: "3 weeks" },
    ],
    progress: {
      highlights: ["Completed 3 sessions this month"],
      stalledAreas: [],
      recommendations: ["Schedule more sessions"],
      sessionFrequency: "Weekly",
    },
    agenda: [
      { item: "Review progress", rationale: "Check on goals", estimatedMinutes: 10 },
      { item: "Deep dive into topic", rationale: "Focus on key area", estimatedMinutes: 40 },
    ],
    summar: {
      keyPoints: ["Discussed career goals", "Reviewed progress"],
      decisions: ["Focus on React"],
      actionItems: ["Complete tutorial", "Practice hooks"],
      followUpQuestions: ["How did the practice go?"],
    },
    resource: [
      { topic: "React", resourceType: "Tutorial", searchQuery: "React tutorial 2024", rationale: "Foundation" },
    ],
    "action": ["Complete the tutorial", "Practice hooks daily"],
  };

  return {
    GoogleGenerativeAI: function () {
      return {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockImplementation(({ systemInstruction }: { systemInstruction?: string }) => {
            let response: unknown = [];
            const instruction = (systemInstruction || "").toLowerCase();

            if (instruction.includes("30 words") || instruction.includes("good fit")) {
              // Compatibility endpoint - check this BEFORE mentor-matching
              response = mockResponses.compatibility;
            } else if (instruction.includes("mentor-matching") || instruction.includes("match the most relevant")) {
              response = mockResponses["mentor-matching"];
            } else if (instruction.includes("milestone")) {
              response = mockResponses.milestone;
            } else if (instruction.includes("learning path")) {
              response = mockResponses["learning path"];
            } else if (instruction.includes("progress")) {
              response = mockResponses.progress;
            } else if (instruction.includes("agenda")) {
              response = mockResponses.agenda;
            } else if (instruction.includes("summar")) {
              response = mockResponses.summar;
            } else if (instruction.includes("resource")) {
              response = mockResponses.resource;
            } else if (instruction.includes("action")) {
              response = mockResponses.action;
            }

            return {
              response: {
                text: () => JSON.stringify(response),
              },
            };
          }),
        }),
      };
    },
    SchemaType: {
      STRING: "STRING",
      NUMBER: "NUMBER",
      BOOLEAN: "BOOLEAN",
      ARRAY: "ARRAY",
      OBJECT: "OBJECT",
    },
  };
});

// Mock Google GenAI (new SDK)
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: function () {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: "Mock AI response",
          }),
        },
      };
    },
  };
});

// Mock Stripe
vi.mock("stripe", () => {
  return {
    default: function () {
      return {
        paymentIntents: {
          create: vi.fn().mockResolvedValue({
            id: "pi_test_123",
            client_secret: "pi_test_123_secret",
            status: "succeeded",
            amount: 10000,
            currency: "usd",
          }),
          retrieve: vi.fn().mockResolvedValue({
            id: "pi_test_123",
            status: "succeeded",
          }),
          cancel: vi.fn().mockResolvedValue({
            id: "pi_test_123",
            status: "canceled",
          }),
        },
        refunds: {
          create: vi.fn().mockResolvedValue({
            id: "re_test_123",
            status: "succeeded",
          }),
        },
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            id: "evt_test_123",
            type: "payment_intent.succeeded",
            data: {
              object: {
                id: "pi_test_123",
                status: "succeeded",
              },
            },
          }),
        },
      };
    },
  };
});

// Mock Sentry
vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setContext: vi.fn(),
  setTag: vi.fn(),
  startSpan: vi.fn((_, fn) => fn()),
  Handlers: {
    requestHandler: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    errorHandler: () => (_err: unknown, _req: unknown, _res: unknown, next: () => void) => next(),
  },
}));
