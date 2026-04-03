import nodemailer from "nodemailer";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

let transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
});

// Auto-create Ethereal test account in dev mode for email preview
if (env.NODE_ENV !== "production" && env.SMTP_HOST === "localhost") {
  nodemailer.createTestAccount().then((testAccount) => {
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(
      { testUser: testAccount.user },
      "Email transport configured with Ethereal test account"
    );
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Verify your email",
    html: `<p>Click <a href="${link}">here</a> to verify your email.</p>
           <p>This link expires in 24 hours.</p>`,
  });

  if (env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info({ previewUrl }, "Verification email sent (preview available)");
    }
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Reset your password",
    html: `<p>Click <a href="${link}">here</a> to reset your password.</p>
           <p>This link expires in 1 hour.</p>`,
  });

  if (env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info({ previewUrl }, "Password reset email sent (preview available)");
    }
  }
}
