import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
});

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Verify your email",
    html: `<p>Click <a href="${link}">here</a> to verify your email.</p>
           <p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Reset your password",
    html: `<p>Click <a href="${link}">here</a> to reset your password.</p>
           <p>This link expires in 1 hour.</p>`,
  });
}
