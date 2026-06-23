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

// Mocks
export {
  mockGeminiResponse,
  resetGeminiMock,
  setupGeminiMock,
} from "./mocks/gemini.mock.js";

export {
  mockStripePaymentIntent,
  setWebhookSignatureValid,
  resetStripeMock,
  setupStripeMock,
} from "./mocks/stripe.mock.js";

export {
  mockResendFailure,
  getSentEmails,
  getLastEmail,
  resetResendMock,
  setupResendMock,
} from "./mocks/resend.mock.js";
