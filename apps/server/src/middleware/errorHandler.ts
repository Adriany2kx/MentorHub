import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  void _next;

  logger.error({
    type: "unhandled_error",
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl,
  });

  res.status(500).json({ error: "Internal server error" });
}
