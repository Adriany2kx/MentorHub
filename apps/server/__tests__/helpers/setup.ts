import "dotenv/config";
import { vi } from "vitest";

// Set test environment variables BEFORE any imports
// DATABASE_URL is loaded from .env via dotenv/config above
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-min-32-chars-long";
process.env.NODE_ENV = "test";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test_key";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";

// Mock Resend - must be a constructor function
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

// Mock Google GenAI
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
