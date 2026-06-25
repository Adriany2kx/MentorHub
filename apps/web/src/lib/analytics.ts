/**
 * Plausible Analytics Service
 *
 * Privacy-focused analytics with custom event tracking.
 * No cookies, no personal data collection.
 *
 * Setup:
 * 1. Create account at plausible.io
 * 2. Add your domain
 * 3. Set VITE_PLAUSIBLE_DOMAIN env var
 */

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;

let initialized = false;

/**
 * Initialize Plausible analytics
 * Call this once in main.tsx after Sentry
 */
export function initAnalytics(): void {
  if (initialized || !domain) {
    if (!domain) {
      console.warn("[Analytics] VITE_PLAUSIBLE_DOMAIN not set, analytics disabled");
    }
    return;
  }

  // Add Plausible script
  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = domain;
  script.src = "https://plausible.io/js/script.js";
  document.head.appendChild(script);

  // Create plausible function for custom events
  window.plausible =
    window.plausible ||
    function (...args: Parameters<NonNullable<typeof window.plausible>>) {
      (window as unknown as { plausible: { q: unknown[] } }).plausible = {
        q: [args],
      };
    };

  initialized = true;
}

/**
 * Track a custom event
 */
export function track(
  event: string,
  props?: Record<string, string | number | boolean>
): void {
  if (!domain || !window.plausible) return;
  window.plausible(event, props ? { props } : undefined);
}

// ============================================================
// Event Taxonomy (from Technical Roadmap)
// ============================================================

// User lifecycle events
export const analytics = {
  // User Lifecycle
  userSignedUp: (method: "email" | "google" | "github") =>
    track("User Signed Up", { method }),

  profileCompleted: (role: "mentee" | "mentor") =>
    track("Profile Completed", { role }),

  onboardingFinished: (stepsCompleted: number) =>
    track("Onboarding Finished", { steps_completed: stepsCompleted }),

  // Core Actions
  mentorViewed: (mentorId: string, source: "search" | "recommendation" | "direct") =>
    track("Mentor Viewed", { mentor_id: mentorId, source }),

  programBooked: (programId: string, price: number, mentorId: string) =>
    track("Program Booked", { program_id: programId, price, mentor_id: mentorId }),

  sessionCompleted: (bookingId: string, durationMinutes: number) =>
    track("Session Completed", { booking_id: bookingId, duration_minutes: durationMinutes }),

  goalCreated: (bookingId: string) =>
    track("Goal Created", { booking_id: bookingId }),

  messageSent: (conversationId: string, isFirst: boolean) =>
    track("Message Sent", { conversation_id: conversationId, is_first: isFirst }),

  // Engagement
  searchPerformed: (query: string, resultsCount: number) =>
    track("Search Performed", { query, results_count: resultsCount }),

  filterApplied: (filterType: string, filterValue: string) =>
    track("Filter Applied", { filter_type: filterType, filter_value: filterValue }),

  // Conversions
  checkoutStarted: (programId: string, price: number) =>
    track("Checkout Started", { program_id: programId, price }),

  paymentCompleted: (programId: string, price: number) =>
    track("Payment Completed", { program_id: programId, price }),

  reviewSubmitted: (mentorId: string, rating: number) =>
    track("Review Submitted", { mentor_id: mentorId, rating }),
};
