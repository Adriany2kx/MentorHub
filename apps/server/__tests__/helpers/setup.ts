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
  return {
    GoogleGenerativeAI: function () {
      return {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockImplementation(() => ({
            response: {
              text: () => JSON.stringify([]),
            },
          })),
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
