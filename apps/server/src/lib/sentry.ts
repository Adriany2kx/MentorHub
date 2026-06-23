import * as Sentry from "@sentry/node";
import { env } from "../config/env.js";

const dsn = env.SENTRY_DSN;

export function initSentry(): void {
  if (!dsn) {
    console.warn("[Sentry] SENTRY_DSN not set, error reporting disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    release: env.APP_VERSION,
    sampleRate: 1.0,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
    beforeSend(event, hint) {
      const err = hint.originalException;
      // Don't send operational errors (400-level) to Sentry
      if (err && typeof err === "object" && "isOperational" in err && err.isOperational) {
        return null;
      }
      return event;
    },
  });
}

export function captureError(err: Error, context?: Record<string, unknown>): void {
  if (!dsn) {
    return;
  }
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(err);
}

export function setUser(id: string, email?: string): void {
  if (!dsn) return;
  Sentry.setUser({ id, email });
}

export function clearUser(): void {
  if (!dsn) return;
  Sentry.setUser(null);
}

export { Sentry };
