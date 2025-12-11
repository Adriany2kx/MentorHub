import type { Response } from "express";

// Returns false and sends 400 if id is missing or empty.
// Accepts string | string[] because Express types params that way;
// route params are always plain strings at runtime.
export function requireId(id: string | string[] | undefined, res: Response): boolean {
  const val = Array.isArray(id) ? id[0] : id;
  if (!val || val.trim() === "") {
    res.status(400).json({ error: "Invalid ID" });
    return false;
  }
  return true;
}
