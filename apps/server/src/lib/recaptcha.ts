import { env } from "../config/env.js";

export async function verifyRecaptcha(token: string, ip?: string): Promise<boolean> {
  if (!env.RECAPTCHA_SECRET_KEY) return true;

  const body = new URLSearchParams({
    secret: env.RECAPTCHA_SECRET_KEY,
    response: token,
    ...(ip ? { remoteip: ip } : {}),
  });

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body,
    });

    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    return data.success;
  } catch {
    return false;
  }
}
