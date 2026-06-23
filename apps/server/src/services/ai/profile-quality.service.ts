import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../lib/errors.js";
import type { ProfileQualityResult, Skill } from "./types.js";

export async function getProfileQuality(userId: string): Promise<ProfileQualityResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { mentorProfile: true, menteeProfile: true },
  });

  if (!user) throw new NotFoundError("User not found");

  let score = 0;
  const suggestions: string[] = [];

  if (user.bio) {
    score += 15;
    if (user.bio.length >= 100) score += 5;
    else suggestions.push("Expand your bio to at least 100 characters");
  } else {
    suggestions.push("Add a bio to your profile");
  }

  if (user.avatarUrl) score += 10;
  else suggestions.push("Upload a profile photo");

  if (user.timezone) score += 5;
  else suggestions.push("Set your timezone");

  if (user.role === "MENTOR" && user.mentorProfile) {
    const count = user.mentorProfile.expertise.length;
    if (count >= 3) score += 25;
    else {
      const missing = 3 - count;
      suggestions.push(`Add at least ${missing} more expertise area${missing > 1 ? "s" : ""}`);
      score += Math.round((count / 3) * 25);
    }
  } else if (user.role === "MENTEE" && user.menteeProfile) {
    const p = user.menteeProfile;

    // Core role fields (25 pts)
    const filled = [p.currentRole, p.targetRole].filter(Boolean).length;
    score += Math.round((filled / 2) * 25);
    if (!p.currentRole) suggestions.push("Add your current role");
    if (!p.targetRole) suggestions.push("Set your target role");

    // Skills (20 pts)
    const skills = (p.skills ?? []) as Skill[];
    if (skills.length >= 5) score += 20;
    else if (skills.length > 0) {
      score += Math.round((skills.length / 5) * 20);
      suggestions.push(`Add ${5 - skills.length} more skill${5 - skills.length > 1 ? "s" : ""} to improve your matches`);
    } else {
      suggestions.push("Add your skills — this is the biggest factor in mentor matching");
    }

    // Blocker (10 pts)
    if (p.currentBlocker) score += 10;
    else suggestions.push("Tell us your biggest challenge to get better session agendas");

    // Industry (5 pts)
    if (p.targetIndustry) score += 5;
    else suggestions.push("Set your target industry");
  } else {
    suggestions.push(user.role === "MENTOR" ? "Complete your mentor profile" : "Complete your mentee profile");
  }

  return { score: Math.min(score, 100), suggestions };
}
