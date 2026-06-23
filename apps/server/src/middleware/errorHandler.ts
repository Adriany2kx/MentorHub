import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";
import { AppError, ValidationError, isAppError } from "../lib/errors.js";
import { captureError } from "../lib/sentry.js";

interface ErrorResponse {
  error: string;
  requestId?: string;
  errors?: Record<string, string>;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  void _next;

  const requestId = req.requestId;

  if (isAppError(err)) {
    // Operational error — expected, log at warn level
    logger.warn({
      type: "operational_error",
      message: err.message,
      statusCode: err.statusCode,
      requestId,
      method: req.method,
      path: req.originalUrl,
      userId: req.userId,
    });

    const response: ErrorResponse = {
      error: err.message,
      requestId,
    };

    if (err instanceof ValidationError && Object.keys(err.errors).length > 0) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Programming error — unexpected, log at error level and report to Sentry
  logger.error({
    type: "unhandled_error",
    message: err.message,
    stack: err.stack,
    requestId,
    method: req.method,
    path: req.originalUrl,
    userId: req.userId,
  });

  captureError(err, {
    requestId,
    method: req.method,
    path: req.originalUrl,
    userId: req.userId,
  });

  res.status(500).json({
    error: "Internal server error",
    requestId,
  });
}
