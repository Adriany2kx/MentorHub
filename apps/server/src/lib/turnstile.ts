import { env } from "../config/env.js";

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    ...(ip ? { remoteip: ip } : {}),
  });

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });

    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    return data.success;
  } catch (error) {
    return false;
  }
}
