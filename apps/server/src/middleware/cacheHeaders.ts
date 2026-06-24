import type { Request, Response, NextFunction } from "express";

/**
 * Middleware to set cache control headers.
 * - API responses: no-store (prevent caching of dynamic data)
 * - Static assets: configurable max-age
 */
export function noCache(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
}

/**
 * Set cache headers for static assets (avatars, resources)
 */
export function cacheStatic(maxAge: number = 86400) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAge}, immutable`);
    next();
  };
}
