import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type RequestResetValues = z.infer<typeof requestResetSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// Profile schemas
export const profileSetupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional(),
});

export const mentorProfileSchema = z.object({
  headline: z.string().min(10, "Headline must be at least 10 characters").max(200),
  expertise: z.array(z.string()).min(1, "Add at least one area of expertise"),
  hourlyRate: z.number().positive("Hourly rate must be positive").optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
});

export const menteeProfileSchema = z.object({
  goals: z.string().max(1000).optional(),
  interests: z.array(z.string()).max(10).optional(),
  currentRole: z.string().max(100).optional(),
  targetRole: z.string().max(100).optional(),
});

export type ProfileSetupValues = z.infer<typeof profileSetupSchema>;
export type MentorProfileValues = z.infer<typeof mentorProfileSchema>;
export type MenteeProfileValues = z.infer<typeof menteeProfileSchema>;
