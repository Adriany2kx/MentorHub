import { Resend } from "resend";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

const resend = new Resend(env.RESEND_API_KEY);

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MentorHub</title>
</head>
<body style="margin:0;padding:0;background:#F3EEE6;font-family:'DM Sans',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3EEE6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

        <!-- Logo -->
        <tr><td style="padding-bottom:28px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:22px;font-weight:500;color:#1F1D1A;letter-spacing:-0.3px;">MentorHub</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#FFFCF7;border:1px solid #DDD3C6;border-radius:12px;padding:40px 36px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#736C63;">
            You received this email because you signed up for MentorHub.<br/>
            If you didn't, you can safely ignore this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:500;color:#1F1D1A;">Verify your email</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#4F4A44;line-height:1.6;">
      Thanks for joining MentorHub. Click the button below to activate your account. This link expires in 24 hours.
    </p>
    <a href="${link}" style="display:inline-block;background:#2E6A64;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:13px 28px;border-radius:8px;">
      Verify email
    </a>
    <p style="margin:28px 0 0;font-size:13px;color:#736C63;line-height:1.6;">
      Or copy this link into your browser:<br/>
      <span style="color:#2E6A64;word-break:break-all;">${link}</span>
    </p>
  `);

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Verify your MentorHub email",
    html,
  });

  if (error) {
    logger.error({ error, email: to }, "Failed to send verification email");
    throw new Error(error.message);
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:500;color:#1F1D1A;">Reset your password</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#4F4A44;line-height:1.6;">
      We received a request to reset your MentorHub password. Click the button below to choose a new one. This link expires in 1 hour.
    </p>
    <a href="${link}" style="display:inline-block;background:#2E6A64;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:13px 28px;border-radius:8px;">
      Reset password
    </a>
    <p style="margin:28px 0 0;font-size:13px;color:#736C63;line-height:1.6;">
      Or copy this link into your browser:<br/>
      <span style="color:#2E6A64;word-break:break-all;">${link}</span>
    </p>
  `);

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Reset your MentorHub password",
    html,
  });

  if (error) {
    logger.error({ error, email: to }, "Failed to send password reset email");
    throw new Error(error.message);
  }
}
