import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;

export function initSentry(): void {
  if (!dsn) {
    console.warn("[Sentry] VITE_SENTRY_DSN not set, error reporting disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session replay for errors
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 0.5 : 1.0,
    // Filter out operational errors
    beforeSend(event, hint) {
      const error = hint.originalException;
      // Don't send 4xx client errors
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          return null;
        }
      }
      return event;
    },
  });
}

export function setUser(id: string, email?: string): void {
  if (!dsn) return;
  Sentry.setUser({ id, email });
}

export function clearUser(): void {
  if (!dsn) return;
  Sentry.setUser(null);
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!dsn) return;
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(error);
}

export { Sentry };
