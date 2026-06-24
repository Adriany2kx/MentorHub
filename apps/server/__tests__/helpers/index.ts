// Test database utilities
export { prisma, cleanupDatabase, disconnectDatabase } from "./testDb.js";

// User factories
export {
  createUser,
  createMentee,
  createMentor,
  createAdmin,
  createSession,
} from "./factories/user.factory.js";

// Booking/Program factories
export {
  createProgram,
  createBooking,
  createMentoringSession,
  createGoal,
  createMilestone,
  createPayment,
} from "./factories/booking.factory.js";

// Mocks - vi.mock calls are in setup.ts, these are helper functions
export {
  mockGeminiResponse,
  resetGeminiMock,
  createGeminiMock,
} from "./mocks/gemini.mock.js";

export {
  mockStripePaymentIntent,
  setWebhookSignatureValid,
  resetStripeMock,
  createStripeMock,
} from "./mocks/stripe.mock.js";

export {
  mockResendFailure,
  getSentEmails,
  getLastEmail,
  resetResendMock,
  createResendMock,
} from "./mocks/resend.mock.js";
