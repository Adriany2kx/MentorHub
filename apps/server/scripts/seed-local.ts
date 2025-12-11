import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/hash.js";

dotenv.config();

type SeedProfileName = "small" | "medium" | "large" | "stress";

interface SeedProfile {
  mentors: number;
  mentees: number;
  resources: number;
  conversations: number;
  messagesPerConversation: number;
  bookings: number;
}

const PROFILES: Record<SeedProfileName, SeedProfile> = {
  small: {
    mentors: 8,
    mentees: 12,
    resources: 16,
    conversations: 14,
    messagesPerConversation: 5,
    bookings: 16,
  },
  medium: {
    mentors: 20,
    mentees: 40,
    resources: 70,
    conversations: 50,
    messagesPerConversation: 7,
    bookings: 80,
  },
  large: {
    mentors: 60,
    mentees: 140,
    resources: 260,
    conversations: 220,
    messagesPerConversation: 9,
    bookings: 420,
  },
  stress: {
    mentors: 350,
    mentees: 650,
    resources: 900,
    conversations: 700,
    messagesPerConversation: 10,
    bookings: 1400,
  },
};

const STRICT_COVERAGE_PROFILES: SeedProfileName[] = ["medium", "large", "stress"];
const WEEKLY_CONVERSATION_TARGET: Record<SeedProfileName, number> = {
  small: 5,
  medium: 10,
  large: 20,
  stress: 40,
};

const TIMEZONE_POOL = [
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "Asia/Dubai",
  "Asia/Singapore",
  "Africa/Nairobi",
];

const FIRST_NAMES = [
  "Amara",
  "James",
  "Priya",
  "Noah",
  "Aisha",
  "Daniel",
  "Lina",
  "Marcus",
  "Sofia",
  "Omar",
  "Rita",
  "Kai",
  "Elena",
  "Yusuf",
  "Mina",
  "Leo",
  "Hannah",
  "Theo",
  "Zara",
  "Niko",
];

const LAST_NAMES = [
  "Patel",
  "Morgan",
  "Sharma",
  "Walker",
  "Bennett",
  "Ali",
  "Khan",
  "Chen",
  "Edwards",
  "Singh",
  "Nolan",
  "Grant",
  "Rossi",
  "Owens",
  "King",
  "Ahmed",
  "Taylor",
  "Lewis",
  "Wright",
  "Diaz",
];

const MENTOR_ARCHETYPES = [
  {
    headline: "Senior Solicitor and Legal Mentor",
    expertisePool: ["Litigation", "Contract Law", "Regulatory Compliance", "Legal Drafting", "Case Strategy"],
  },
  {
    headline: "NHS Consultant and Career Coach",
    expertisePool: ["Clinical Practice", "Medical Training", "Patient Safety", "NHS Career Pathways", "Healthcare Leadership"],
  },
  {
    headline: "Chartered Accountant and Finance Mentor",
    expertisePool: ["IFRS", "Audit", "Tax Planning", "Financial Reporting", "Risk Management"],
  },
  {
    headline: "Staff Software Engineer and Tech Mentor",
    expertisePool: ["React", "TypeScript", "Node.js", "System Design", "API Architecture"],
  },
  {
    headline: "Senior Lecturer and Education Mentor",
    expertisePool: ["Teaching Strategy", "Curriculum Design", "Assessment Design", "Academic Leadership", "Student Mentoring"],
  },
  {
    headline: "Product Marketing Lead and Comms Mentor",
    expertisePool: ["Digital Marketing", "PR Strategy", "Brand Positioning", "Campaign Strategy", "Content Planning"],
  },
  {
    headline: "Mechanical Engineer and Industry Mentor",
    expertisePool: ["Civil Engineering", "Project Delivery", "Design Validation", "Technical Operations", "Engineering Management"],
  },
  {
    headline: "Sustainability Scientist and Research Mentor",
    expertisePool: ["Sustainability", "Data Analysis", "Research Methods", "Environmental Strategy", "Policy Insight"],
  },
  {
    headline: "Design Director and Creative Mentor",
    expertisePool: ["UX Design", "Portfolio Development", "Design Systems", "Creative Direction", "User Research"],
  },
  {
    headline: "Operations Strategist and Career Mentor",
    expertisePool: ["Leadership", "Stakeholder Management", "Career Change", "Operational Excellence", "Change Management"],
  },
];

const EXPERTISE_POOL = [
  "Litigation",
  "Contract Law",
  "Clinical Practice",
  "Medical Training",
  "IFRS",
  "Audit",
  "Tax Planning",
  "React",
  "TypeScript",
  "Node.js",
  "System Design",
  "Teaching Strategy",
  "Curriculum Design",
  "Digital Marketing",
  "PR Strategy",
  "Civil Engineering",
  "Project Delivery",
  "Sustainability",
  "Data Analysis",
  "UX Design",
  "Portfolio Development",
  "Leadership",
  "Stakeholder Management",
  "Career Change",
];

const GOAL_TEMPLATES = [
  "Move into a higher-impact role",
  "Build confidence for interviews",
  "Create a practical growth plan",
  "Improve industry-specific technical depth",
  "Strengthen communication with stakeholders",
  "Progress toward chartership or certification",
];

const RESOURCE_TOPICS = [
  "Interview Preparation",
  "Career Planning",
  "Portfolio Development",
  "Networking Strategy",
  "Role Transition",
  "Industry Fundamentals",
  "Leadership Basics",
  "Communication",
];

const MESSAGE_OPENERS = [
  "Thanks for taking the time. I wanted your feedback on my current plan.",
  "Could we review my CV before the next session?",
  "I have two paths in mind and would like your perspective.",
  "I made progress on the goals from our last call.",
  "Can we focus on interview prep this week?",
  "I applied your advice and got positive feedback from my manager.",
];

const TEST_ACCOUNT = {
  password: "TestPassword123!",
  mentorEmail: "test.mentor@mentorhub.test",
  menteeEmail: "test.mentee@mentorhub.test",
  adminEmail: "test.admin@mentorhub.test",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type LearningStyle = "structured" | "exploratory" | "project-based";
type DataMode = "clean" | "mixed" | "adversarial";

interface GeneratedMentor {
  firstName?: string;
  lastName?: string;
  email?: string;
  headline?: string;
  expertise?: string[];
  hourlyRate?: number;
  yearsExperience?: number;
  bio?: string;
}

interface GeneratedMenteeSkill {
  skill: string;
  level: "beginner" | "intermediate" | "advanced";
}

interface GeneratedMentee {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentRole?: string;
  targetRole?: string;
  goals?: string;
  interests?: string[];
  skills?: GeneratedMenteeSkill[];
  targetIndustry?: string;
  currentBlocker?: string;
  learningStyle?: LearningStyle;
  analysisTags?: string[];
}

interface GeneratedResource {
  title?: string;
  description?: string;
  fileType?: string;
  topic?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  skillsCovered?: string[];
  summary?: string;
}

interface GeneratedSessionTemplate {
  sessionType?: string;
  notes?: string;
  keyTakeaways?: string[];
  nextSteps?: string[];
  aiSummary?: {
    keyPoints?: string[];
    decisions?: string[];
    actionItems?: string[];
    followUpQuestions?: string[];
  };
}

interface GeneratedSeedData {
  mentors: GeneratedMentor[];
  mentees: GeneratedMentee[];
  resources: GeneratedResource[];
  sessions: GeneratedSessionTemplate[];
}

function argValue(flag: string): string | undefined {
  const prefixed = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (prefixed) {
    const [, value] = prefixed.split("=");
    return value;
  }

  const index = process.argv.findIndex((arg) => arg === flag);
  if (index >= 0) {
    return process.argv[index + 1];
  }

  return undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag) || process.argv.some((arg) => arg.startsWith(`${flag}=`));
}

function readJsonArrayFile<T>(fileName: string): T[] {
  const filePath = path.join(__dirname, fileName);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function loadGeneratedSeedData(): GeneratedSeedData {
  return {
    mentors: readJsonArrayFile<GeneratedMentor>("data-mentors.json"),
    mentees: readJsonArrayFile<GeneratedMentee>("data-mentees.json"),
    resources: readJsonArrayFile<GeneratedResource>("data-resources.json"),
    sessions: readJsonArrayFile<GeneratedSessionTemplate>("data-sessions.json"),
  };
}

function sanitizeText(value: string | undefined, fallback: string): string {
  if (!value || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

function uniqueSeedEmail(sourceEmail: string | undefined, localPrefix: "mentor" | "mentee", sequence: number, sourceSize: number): string {
  const fallback = `${localPrefix}.local.${sequence}@mentorhub.test`;

  if (!sourceEmail || !sourceEmail.includes("@")) {
    return fallback;
  }

  if (sequence <= sourceSize) {
    return sourceEmail.toLowerCase();
  }

  const [local, domain] = sourceEmail.toLowerCase().split("@");
  return `${local}.${sequence}@${domain}`;
}

function normalizeExpertise(expertise: string[] | undefined, seed: number): string[] {
  if (Array.isArray(expertise)) {
    const cleaned = expertise
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));

    if (cleaned.length >= 2) {
      return cleaned.slice(0, 5);
    }
  }

  return pickExpertise(seed);
}

function normalizeInterests(interests: string[] | undefined, seed: number): string[] {
  if (Array.isArray(interests)) {
    const cleaned = interests
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));

    if (cleaned.length >= 2) {
      return cleaned.slice(0, 5);
    }
  }

  return [pick(EXPERTISE_POOL, seed + 1), pick(EXPERTISE_POOL, seed + 6)];
}

function normalizeLearningStyle(value: string | undefined): LearningStyle {
  if (value === "structured" || value === "exploratory" || value === "project-based") {
    return value;
  }

  return "structured";
}

function normalizeFileType(value: string | undefined): "DOCUMENT" | "VIDEO" | "LINK" | "IMAGE" {
  if (value === "VIDEO" || value === "LINK" || value === "IMAGE") {
    return value;
  }

  return "DOCUMENT";
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "resource";
}

function pickSessionTemplate(templates: GeneratedSessionTemplate[], seed: number): GeneratedSessionTemplate | null {
  if (!templates.length) {
    return null;
  }

  return templates[seed % templates.length] ?? null;
}

function buildConversationMessage(template: GeneratedSessionTemplate | null, seed: number): string {
  if (!template) {
    return pick(MESSAGE_OPENERS, seed);
  }

  const notes = template.notes?.trim();
  const takeaway = template.keyTakeaways?.[seed % (template.keyTakeaways.length || 1)]?.trim();
  const nextStep = template.nextSteps?.[seed % (template.nextSteps.length || 1)]?.trim();

  return notes || takeaway || nextStep || pick(MESSAGE_OPENERS, seed);
}

function buildReportDescription(seed: number, mode: DataMode): string {
  if (mode === "clean") {
    return "Neutral moderation sample: user reported off-topic and repetitive promotional messaging in thread.";
  }

  if (mode === "adversarial" || seed % 2 === 0) {
    return "User reported repeated hostile phrasing and personal attacks in mentor chat context for moderation review.";
  }

  return "Neutral moderation sample: user reported off-topic and repetitive promotional messaging in thread.";
}

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function pickTimezone(seed: number): string {
  return pick(TIMEZONE_POOL, seed);
}

function pickExpertise(seed: number): string[] {
  const start = seed % EXPERTISE_POOL.length;
  return [
    EXPERTISE_POOL[start],
    EXPERTISE_POOL[(start + 3) % EXPERTISE_POOL.length],
    EXPERTISE_POOL[(start + 7) % EXPERTISE_POOL.length],
  ];
}

function pickMentorExpertise(expertisePool: string[], seed: number): string[] {
  const start = seed % expertisePool.length;
  return [
    expertisePool[start],
    expertisePool[(start + 1) % expertisePool.length],
    expertisePool[(start + 2) % expertisePool.length],
  ];
}

function ensureLocalGuard(): void {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const allowInCi = process.env.ALLOW_FAKE_DATA_IN_CI === "true";

  if (nodeEnv === "production") {
    throw new Error("Refusing to seed fake data in NODE_ENV=production");
  }

  if (process.env.CI === "true" && !allowInCi) {
    throw new Error("Refusing to seed fake data in CI without ALLOW_FAKE_DATA_IN_CI=true");
  }
}

async function resetDatabase(): Promise<void> {
  await prisma.report.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.mentoringSession.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.program.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.menteeProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

async function run(): Promise<void> {
  ensureLocalGuard();

  const requestedProfile = (argValue("--profile") ?? "small") as SeedProfileName;
  const requestedDataMode = (argValue("--data-mode") ?? "mixed") as DataMode;
  const profile = PROFILES[requestedProfile] ?? PROFILES.small;
  const activeProfile = requestedProfile in PROFILES ? requestedProfile : "small";
  const strictCoverageEnabled = STRICT_COVERAGE_PROFILES.includes(activeProfile);
  const weeklyConversationTarget = WEEKLY_CONVERSATION_TARGET[activeProfile];
  const includeGoals = hasFlag("--include-goals");
  const includePayments = hasFlag("--include-payments");
  const dataMode: DataMode = requestedDataMode === "clean" || requestedDataMode === "adversarial" ? requestedDataMode : "mixed";
  const generatedData = loadGeneratedSeedData();

  if (!PROFILES[requestedProfile]) {
    console.warn(`Unknown profile '${requestedProfile}', defaulting to 'small'.`);
  }

  console.log("\nSeeding local fake data");
  console.log(`Profile: ${activeProfile}`);
  console.log(`Strict model coverage checks: ${strictCoverageEnabled ? "enabled" : "disabled"}`);
  console.log(`Weekly conversation target: ${weeklyConversationTarget}`);
  console.log(`Data mode: ${dataMode}`);
  console.log(`Include goals/milestones: ${includeGoals ? "yes" : "no"}`);
  console.log(`Include payments: ${includePayments ? "yes" : "no"}`);
  console.log(`Gemini seed files: mentors=${generatedData.mentors.length}, mentees=${generatedData.mentees.length}, resources=${generatedData.resources.length}, sessions=${generatedData.sessions.length}`);

  console.log("\nResetting existing data...");
  await resetDatabase();
  console.log("Reset complete.");

  const passwordHash = await hashPassword(TEST_ACCOUNT.password);

  const mentors: Array<{ userId: string; mentorProfileId: string; expertise: string[] }> = [];
  const mentees: Array<{ userId: string }> = [];
  const seededUserIds: string[] = [];
  const reportableMessages: Array<{ messageId: string; reporterId: string; reportedId: string }> = [];
  let lowAiTierProfiles = 0;
  let highAiTierProfiles = 0;

  console.log("\nCreating mentors and mentor skills...");
  for (let i = 0; i < profile.mentors; i++) {
    const source = generatedData.mentors[i % Math.max(generatedData.mentors.length, 1)];
    const archetype = MENTOR_ARCHETYPES[i % MENTOR_ARCHETYPES.length];
    const firstName = sanitizeText(source?.firstName, pick(FIRST_NAMES, i));
    const lastName = sanitizeText(source?.lastName, pick(LAST_NAMES, i + 2));
    const email = uniqueSeedEmail(source?.email, "mentor", i + 1, generatedData.mentors.length);
    const expertise = normalizeExpertise(source?.expertise, i);
    const hourlyRate = typeof source?.hourlyRate === "number" ? source.hourlyRate : 90 + i * 5;
    const yearsExperience = typeof source?.yearsExperience === "number" ? source.yearsExperience : 6 + (i % 11);
    const headline = sanitizeText(source?.headline, archetype.headline);
    const bio = sanitizeText(source?.bio, `${firstName} mentors professionals aiming for structured career progress.`);
    const timezone = pickTimezone(i);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "MENTOR",
        isVerified: true,
        firstName,
        lastName,
        bio,
        timezone,
      },
    });
    seededUserIds.push(user.id);

    const mentorProfile = await prisma.mentorProfile.create({
      data: {
        userId: user.id,
        headline,
        expertise,
        hourlyRate,
        yearsExperience,
        isApproved: true,
      },
    });

    await prisma.availability.createMany({
      data: [
        {
          mentorId: mentorProfile.id,
          dayOfWeek: i % 5,
          startTime: "09:00",
          endTime: "12:00",
          timezone,
        },
        {
          mentorId: mentorProfile.id,
          dayOfWeek: (i + 2) % 7,
          startTime: "14:00",
          endTime: "17:00",
          timezone,
        },
      ],
    });

    mentors.push({ userId: user.id, mentorProfileId: mentorProfile.id, expertise });
  }

  console.log("Creating mentees...");
  for (let i = 0; i < profile.mentees; i++) {
    const source = generatedData.mentees[i % Math.max(generatedData.mentees.length, 1)];
    const firstName = sanitizeText(source?.firstName, pick(FIRST_NAMES, i + 5));
    const lastName = sanitizeText(source?.lastName, pick(LAST_NAMES, i + 7));
    const email = uniqueSeedEmail(source?.email, "mentee", i + 1, generatedData.mentees.length);
    const goals = sanitizeText(source?.goals, pick(GOAL_TEMPLATES, i));
    const interests = normalizeInterests(source?.interests, i);
    const currentRole = sanitizeText(source?.currentRole, "Early-career professional");
    const targetRole = sanitizeText(source?.targetRole, "Mid-level specialist");
    const targetIndustry = sanitizeText(source?.targetIndustry, "Technology");
    const currentBlocker = sanitizeText(source?.currentBlocker, "Needs structured interview and portfolio feedback.");
    const learningStyle = normalizeLearningStyle(source?.learningStyle);
    const timezone = pickTimezone(i + 3);
    const aiQualityTier = dataMode === "clean"
      ? (i % 8 === 0 ? "low" : "high")
      : dataMode === "adversarial"
        ? (i % 2 === 0 ? "low" : "high")
        : (i % 4 === 0 ? "low" : "high");
    if (aiQualityTier === "low") {
      lowAiTierProfiles += 1;
    } else {
      highAiTierProfiles += 1;
    }
    const analysisTags = Array.isArray(source?.analysisTags)
      ? source.analysisTags.map((tag) => sanitizeText(tag, "career-growth")).slice(0, 5)
      : ["career-transition", "skill-gap", "confidence-building"];
    const skills = Array.isArray(source?.skills) && source.skills.length
      ? source.skills
          .map((entry) => ({ skill: sanitizeText(entry?.skill, "Communication"), level: entry?.level === "advanced" || entry?.level === "intermediate" ? entry.level : "beginner" }))
          .slice(0, 8)
      : [
          { skill: interests[0] ?? "Communication", level: "beginner" as const },
          { skill: interests[1] ?? "Leadership", level: "intermediate" as const },
        ];

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "MENTEE",
        isVerified: true,
        firstName,
        lastName,
        bio: `${firstName} is preparing for a meaningful next career step in ${targetIndustry}.`,
        timezone,
      },
    });
    seededUserIds.push(user.id);

    await prisma.menteeProfile.create({
      data: {
        userId: user.id,
        goals,
        interests,
        currentRole,
        targetRole,
        skills,
        targetIndustry,
        currentBlocker,
        learningStyle,
        insightsCache: {
          qualityTier: aiQualityTier,
          highlights: [goals, `${targetRole} in ${targetIndustry}`],
          stalledAreas: aiQualityTier === "low" ? [currentBlocker] : [currentBlocker, "Needs sharper prioritization of weekly actions."],
          recommendations: aiQualityTier === "low" ? analysisTags.slice(0, 2) : analysisTags,
          riskFlags: aiQualityTier === "low" ? ["low-confidence", "incomplete-context"] : ["balanced-readiness"],
          sessionFrequency: i % 2 === 0 ? "weekly" : "biweekly",
        },
        insightsCachedAt: new Date(),
      },
    });

    mentees.push({ userId: user.id });
  }

  console.log("\nCreating deterministic test accounts...");

  const testMentorUser = await prisma.user.create({
    data: {
      email: TEST_ACCOUNT.mentorEmail,
      passwordHash,
      role: "MENTOR",
      isVerified: true,
      firstName: "Taylor",
      lastName: "Mentor",
      bio: "Deterministic mentor account for QA and end-to-end testing.",
      timezone: "Europe/London",
    },
  });
  seededUserIds.push(testMentorUser.id);

  const testMentorProfile = await prisma.mentorProfile.create({
    data: {
      userId: testMentorUser.id,
      headline: "Principal Career Mentor (Test Fixture)",
      expertise: ["Career Change", "Leadership", "Stakeholder Management"],
      hourlyRate: 120,
      yearsExperience: 12,
      isApproved: true,
    },
  });

  const testMenteeUser = await prisma.user.create({
    data: {
      email: TEST_ACCOUNT.menteeEmail,
      passwordHash,
      role: "MENTEE",
      isVerified: true,
      firstName: "Casey",
      lastName: "Mentee",
      bio: "Deterministic mentee account for QA and end-to-end testing.",
      timezone: "America/New_York",
    },
  });
  seededUserIds.push(testMenteeUser.id);

  await prisma.menteeProfile.create({
    data: {
      userId: testMenteeUser.id,
      goals: "Land a mid-level role with a clear 90-day transition plan.",
      interests: ["Career Change", "Leadership"],
      currentRole: "Associate",
      targetRole: "Senior Associate",
      skills: [
        { skill: "Stakeholder Communication", level: "intermediate" },
        { skill: "Business Writing", level: "beginner" },
      ],
      targetIndustry: "Professional Services",
      currentBlocker: "Needs stronger quantified achievements for promotion case.",
      learningStyle: "structured",
      insightsCache: {
        qualityTier: "high",
        highlights: ["Strong collaboration feedback", "Consistent delivery"],
        stalledAreas: ["Promotion narrative not yet evidence-backed"],
        recommendations: ["Build quantified impact stories", "Practice panel Q&A"],
        riskFlags: ["promotion-timeline-risk"],
        sessionFrequency: "weekly",
      },
      insightsCachedAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      email: TEST_ACCOUNT.adminEmail,
      passwordHash,
      role: "ADMIN",
      isVerified: true,
      firstName: "Alex",
      lastName: "Admin",
      bio: "Deterministic admin account for QA and role-based checks.",
      timezone: "Asia/Singapore",
    },
  });

  await prisma.availability.createMany({
    data: [
      {
        mentorId: testMentorProfile.id,
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "13:00",
        timezone: "Europe/London",
      },
      {
        mentorId: testMentorProfile.id,
        dayOfWeek: 4,
        startTime: "15:00",
        endTime: "18:00",
        timezone: "Europe/London",
      },
    ],
  });

  mentors.push({
    userId: testMentorUser.id,
    mentorProfileId: testMentorProfile.id,
    expertise: ["Career Change", "Leadership", "Stakeholder Management"],
  });
  mentees.push({ userId: testMenteeUser.id });

  await prisma.session.createMany({
    data: seededUserIds.map((userId, index) => ({
      userId,
      sessionTokenHash: `seed_token_${userId}_${index + 1}`,
      expiresAt: new Date(Date.now() + (index + 7) * 24 * 60 * 60 * 1000),
      revokedAt: index % 9 === 0 ? new Date(Date.now() - 2 * 60 * 60 * 1000) : null,
    })),
  });

  console.log("\nCreating programs and bookings...");
  const programs: Array<{ id: string; mentorProfileId: string }> = [];
  for (let i = 0; i < mentors.length; i++) {
    const mentor = mentors[i];
    const program = await prisma.program.create({
      data: {
        mentorId: mentor.mentorProfileId,
        title: `${mentor.expertise[0]} Career Accelerator`,
        description: "Structured sessions with practical actions between meetings.",
        duration: 60,
        sessionCount: 4,
        price: new Decimal(350 + (i % 4) * 50),
        maxParticipants: 1,
        topics: [mentor.expertise[0], mentor.expertise[1]],
        isPublished: true,
      },
    });
    programs.push({ id: program.id, mentorProfileId: mentor.mentorProfileId });
  }

  const bookingStatuses: Array<"CONFIRMED" | "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED"> = [
    "CONFIRMED",
    "PENDING",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
  ];

  const bookings: Array<{ id: string; status: (typeof bookingStatuses)[number] }> = [];
  for (let i = 0; i < profile.bookings; i++) {
    const mentee = mentees[i % mentees.length];
    const program = programs[i % programs.length];
    const status = bookingStatuses[i % bookingStatuses.length];

    const booking = await prisma.booking.create({
      data: {
        programId: program.id,
        menteeId: mentee.userId,
        mentorId: program.mentorProfileId,
        status,
        totalPrice: new Decimal(350 + ((i + 1) % 4) * 50),
        note: "Synthetic booking for pre-deployment demo validation.",
      },
    });

    bookings.push({ id: booking.id, status });

    if (status === "CONFIRMED" || status === "ACTIVE" || status === "COMPLETED") {
      const template = pickSessionTemplate(generatedData.sessions, i);
      const scheduledAt = new Date(Date.now() + (i + 2) * 36 * 60 * 60 * 1000);
      const sessionStatus = status === "COMPLETED" ? "COMPLETED" : "SCHEDULED";

      await prisma.mentoringSession.create({
        data: {
          bookingId: booking.id,
          scheduledAt,
          duration: 60,
          status: sessionStatus,
          mentorNotes: template?.notes ?? "Synthetic mentor notes for demo.",
          menteeFeedback: sessionStatus === "COMPLETED"
            ? (template?.keyTakeaways?.join(" | ") ?? "Helpful and actionable session.")
            : null,
          rating: sessionStatus === "COMPLETED" ? 5 : null,
          aiSummary: template?.aiSummary,
        },
      });
    }
  }

  console.log("Creating resources...");
  for (let i = 0; i < profile.resources; i++) {
    const mentor = mentors[i % mentors.length];
    const source = generatedData.resources[i % Math.max(generatedData.resources.length, 1)];
    const topic = sanitizeText(source?.topic, pick(RESOURCE_TOPICS, i));
    const title = sanitizeText(source?.title, `${topic} Resource ${i + 1}`);
    const description = sanitizeText(source?.description, "Practical reference material for mentorship progression.");
    const summary = sanitizeText(source?.summary, description);
    const fileType = normalizeFileType(source?.fileType);
    const extension = fileType === "VIDEO" ? "mp4" : fileType === "IMAGE" ? "png" : fileType === "LINK" ? "url" : "pdf";
    const difficulty = sanitizeText(source?.difficulty, "intermediate");
    const estimatedMinutes = typeof source?.estimatedMinutes === "number" ? source.estimatedMinutes : 45;
    const skillsCovered = Array.isArray(source?.skillsCovered) && source.skillsCovered.length
      ? source.skillsCovered.slice(0, 4).join(", ")
      : "career progression, communication";
    const titleMetadata = `[${topic} | ${difficulty} | ${estimatedMinutes}m | ${skillsCovered}]`;
    const enrichedTitle = `${title} ${titleMetadata}`.slice(0, 250);

    await prisma.resource.create({
      data: {
        uploaderId: mentor.userId,
        title: enrichedTitle,
        filePath: `/uploads/resources/${toSlug(topic)}-${i + 1}.${extension}`,
        fileSize: 120_000 + i * 1000,
        mimeType: fileType === "VIDEO" ? "video/mp4" : fileType === "IMAGE" ? "image/png" : fileType === "LINK" ? "text/uri-list" : "application/pdf",
        fileType,
        isPublic: i % 3 !== 0,
      },
    });
  }

  console.log("\nCreating conversations and messages...");
  for (let i = 0; i < profile.conversations; i++) {
    const mentor = mentors[i % mentors.length].userId;
    const mentee = mentees[(i * 2) % mentees.length].userId;
    const [participant1Id, participant2Id] = [mentor, mentee].sort();

    const conversation = await prisma.conversation.create({
      data: {
        participant1Id,
        participant2Id,
      },
    });

    for (let j = 0; j < profile.messagesPerConversation; j++) {
      const senderId = j % 2 === 0 ? participant2Id : participant1Id;
      const weeklyConversation = i < weeklyConversationTarget;
      const createdAt = weeklyConversation
        ? new Date(Date.now() - ((profile.messagesPerConversation - 1 - j) * 2 + i) * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - ((profile.messagesPerConversation - j) * (i + 1)) * 60_000);
      const template = pickSessionTemplate(generatedData.sessions, i + j);
      const content = buildConversationMessage(template, i + j);

      const createdMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          content,
          isRead: j < profile.messagesPerConversation - 1,
          readAt: j < profile.messagesPerConversation - 1 ? new Date(createdAt.getTime() + 30_000) : null,
          createdAt,
        },
      });

      reportableMessages.push({
        messageId: createdMessage.id,
        reporterId: senderId === participant1Id ? participant2Id : participant1Id,
        reportedId: senderId,
      });

      if (j === profile.messagesPerConversation - 1) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: createdAt },
        });
      }
    }
  }

  console.log("Creating deterministic cross-feature fixtures for test accounts...");

  const testProgram = await prisma.program.create({
    data: {
      mentorId: testMentorProfile.id,
      title: "Full Platform Test Program",
      description: "Deterministic program used to validate end-to-end product flows.",
      duration: 60,
      sessionCount: 3,
      price: new Decimal(299),
      maxParticipants: 1,
      topics: ["Career Change", "Leadership", "Interview Preparation"],
      isPublished: true,
    },
  });

  const testBookingActive = await prisma.booking.create({
    data: {
      programId: testProgram.id,
      menteeId: testMenteeUser.id,
      mentorId: testMentorProfile.id,
      status: "ACTIVE",
      totalPrice: new Decimal(299),
      note: "Deterministic booking for active-flow testing.",
    },
  });

  await prisma.mentoringSession.create({
    data: {
      bookingId: testBookingActive.id,
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      duration: 60,
      status: "SCHEDULED",
      meetingUrl: "https://example.test/meeting/active",
      mentorNotes: "Agenda prepared for upcoming test session.",
      aiSummary: {
        keyPoints: ["Promotion panel prep", "STAR framing"],
        decisions: ["Focus on measurable impact evidence"],
        actionItems: ["Draft 3 quantified achievements", "Practice 2 mock answers"],
        followUpQuestions: ["What metrics matter most to the panel?", "How to handle weak evidence areas?"],
      },
    },
  });

  const testBookingCompleted = await prisma.booking.create({
    data: {
      programId: testProgram.id,
      menteeId: testMenteeUser.id,
      mentorId: testMentorProfile.id,
      status: "COMPLETED",
      totalPrice: new Decimal(299),
      note: "Deterministic booking for completed-flow testing.",
    },
  });

  await prisma.mentoringSession.create({
    data: {
      bookingId: testBookingCompleted.id,
      scheduledAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      duration: 60,
      status: "COMPLETED",
      mentorNotes: "Completed session notes for regression tests.",
      menteeFeedback: "Very useful session with practical next actions.",
      rating: 5,
      aiSummary: {
        keyPoints: ["Panel expectations clarified", "Narrative improved"],
        decisions: ["Use two-case storytelling format"],
        actionItems: ["Refine results language", "Collect manager validation"],
        followUpQuestions: ["Which case is strongest for opening?", "What objections are likely?"],
      },
    },
  });

  await prisma.review.create({
    data: {
      mentorId: testMentorProfile.id,
      menteeId: testMenteeUser.id,
      bookingId: testBookingCompleted.id,
      rating: 5,
      title: "Excellent guidance",
      content: "Clear, practical and confidence-building advice.",
      response: "Glad this helped. Keep me posted on your interview outcomes.",
    },
  });

  const testGoal = await prisma.goal.create({
    data: {
      menteeId: testMenteeUser.id,
      bookingId: testBookingActive.id,
      title: "Secure promotion-ready evidence",
      description: "Build and present a measurable impact story for promotion review.",
      status: "IN_PROGRESS",
      progress: 50,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.milestone.createMany({
    data: [
      {
        goalId: testGoal.id,
        title: "Complete impact case outline",
        isCompleted: true,
        completedAt: new Date(),
      },
      {
        goalId: testGoal.id,
        title: "Run mock promotion panel",
        isCompleted: false,
      },
    ],
  });

  await prisma.payment.create({
    data: {
      bookingId: testBookingCompleted.id,
      amount: new Decimal(299),
      status: "COMPLETED",
      stripePaymentId: "fake_pi_test_completed",
    },
  });

  await prisma.resource.create({
    data: {
      uploaderId: testMentorUser.id,
      programId: testProgram.id,
      bookingId: testBookingActive.id,
      title: "Promotion Storytelling Worksheet (Test Fixture)",
      filePath: "/uploads/resources/test-promotion-worksheet.pdf",
      fileSize: 184_320,
      mimeType: "application/pdf",
      fileType: "DOCUMENT",
      isPublic: false,
    },
  });

  const [participant1Id, participant2Id] = [testMentorUser.id, testMenteeUser.id].sort();
  const testConversation = await prisma.conversation.create({
    data: {
      participant1Id,
      participant2Id,
    },
  });

  const testMessage1Time = new Date(Date.now() - 90 * 60 * 1000);
  const testMessage2Time = new Date(Date.now() - 45 * 60 * 1000);
  const testMessage3Time = new Date(Date.now() - 10 * 60 * 1000);

  const testMessage1 = await prisma.message.create({
    data: {
      conversationId: testConversation.id,
      senderId: testMenteeUser.id,
      content: "Hi Taylor, I uploaded my prep notes for tomorrow's session.",
      isRead: true,
      readAt: new Date(testMessage1Time.getTime() + 5 * 60 * 1000),
      createdAt: testMessage1Time,
    },
  });
  reportableMessages.push({ messageId: testMessage1.id, reporterId: testMentorUser.id, reportedId: testMenteeUser.id });

  const testMessage2 = await prisma.message.create({
    data: {
      conversationId: testConversation.id,
      senderId: testMentorUser.id,
      content: "Great, I reviewed them and added comments. We'll cover them first.",
      isRead: true,
      readAt: new Date(testMessage2Time.getTime() + 5 * 60 * 1000),
      createdAt: testMessage2Time,
    },
  });
  reportableMessages.push({ messageId: testMessage2.id, reporterId: testMenteeUser.id, reportedId: testMentorUser.id });

  const testMessage3 = await prisma.message.create({
    data: {
      conversationId: testConversation.id,
      senderId: testMenteeUser.id,
      content: "Perfect, thank you. See you tomorrow.",
      isRead: false,
      createdAt: testMessage3Time,
    },
  });
  reportableMessages.push({ messageId: testMessage3.id, reporterId: testMentorUser.id, reportedId: testMenteeUser.id });

  await prisma.conversation.update({
    where: { id: testConversation.id },
    data: { lastMessageAt: testMessage3Time },
  });

  const reportReasons: Array<"HARASSMENT" | "SPAM" | "INAPPROPRIATE_CONTENT" | "FAKE_PROFILE" | "OTHER"> = [
    "SPAM",
    "INAPPROPRIATE_CONTENT",
    "OTHER",
  ];
  const reportStatuses: Array<"PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED"> = [
    "PENDING",
    "REVIEWED",
    "RESOLVED",
    "DISMISSED",
  ];

  const reportTarget = Math.min(Math.max(4, Math.floor(profile.conversations / 2)), reportableMessages.length);
  for (let i = 0; i < reportTarget; i++) {
    const source = reportableMessages[i];

    await prisma.report.create({
      data: {
        reporterId: source.reporterId,
        reportedId: source.reportedId,
        messageId: source.messageId,
        reason: reportReasons[i % reportReasons.length],
        description: buildReportDescription(i, dataMode),
        status: reportStatuses[i % reportStatuses.length],
        adminNotes: i % 2 === 0 ? "Auto-seeded moderation note." : null,
      },
    });
  }

  if (includeGoals) {
    console.log("\nCreating optional goals and milestones...");

    for (let i = 0; i < mentees.length; i++) {
      const mentee = mentees[i];
      const linkedBooking = bookings[i % bookings.length];

      const goal = await prisma.goal.create({
        data: {
          menteeId: mentee.userId,
          bookingId: linkedBooking?.id,
          title: `Career objective ${i + 1}`,
          description: "Synthetic goal to support feature walkthroughs.",
          status: i % 3 === 0 ? "IN_PROGRESS" : "NOT_STARTED",
          progress: i % 3 === 0 ? 40 : 0,
          targetDate: new Date(Date.now() + (i + 14) * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.milestone.createMany({
        data: [
          {
            goalId: goal.id,
            title: "Milestone A",
            isCompleted: i % 3 === 0,
            completedAt: i % 3 === 0 ? new Date() : null,
          },
          {
            goalId: goal.id,
            title: "Milestone B",
            isCompleted: false,
          },
        ],
      });
    }
  }

  if (includePayments) {
    console.log("Creating optional payments...");

    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      if (booking.status === "CANCELLED") {
        continue;
      }

      let paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
      if (booking.status === "COMPLETED") {
        paymentStatus = i % 6 === 0 ? "REFUNDED" : "COMPLETED";
      } else if (booking.status === "ACTIVE" || booking.status === "CONFIRMED") {
        paymentStatus = i % 5 === 0 ? "FAILED" : "PENDING";
      } else {
        paymentStatus = "PENDING";
      }

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: new Decimal(350 + ((i + 1) % 4) * 50),
          status: paymentStatus,
          stripePaymentId: paymentStatus === "FAILED"
            ? `fake_pi_${String(i + 1).padStart(5, "0")}_retry2`
            : `fake_pi_${String(i + 1).padStart(5, "0")}`,
        },
      });
    }
  }

  const [
    mentorCount,
    menteeCount,
    availabilityCount,
    resourceCount,
    conversationCount,
    messageCount,
    bookingCount,
    mentoringSessionCount,
    authSessionCount,
    reportCount,
    goalCount,
    paymentCount,
  ] = await Promise.all([
    prisma.mentorProfile.count(),
    prisma.menteeProfile.count(),
    prisma.availability.count(),
    prisma.resource.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.booking.count(),
    prisma.mentoringSession.count(),
    prisma.session.count(),
    prisma.report.count(),
    prisma.goal.count(),
    prisma.payment.count(),
  ]);

  if (strictCoverageEnabled) {
    const missingModels: string[] = [];
    if (mentorCount === 0) missingModels.push("mentor_profiles");
    if (menteeCount === 0) missingModels.push("mentee_profiles");
    if (availabilityCount === 0) missingModels.push("availability");
    if (resourceCount === 0) missingModels.push("resources");
    if (conversationCount === 0) missingModels.push("conversations");
    if (messageCount === 0) missingModels.push("messages");
    if (bookingCount === 0) missingModels.push("bookings");
    if (mentoringSessionCount === 0) missingModels.push("mentoring_sessions");
    if (authSessionCount === 0) missingModels.push("sessions");
    if (reportCount === 0) missingModels.push("reports");

    if (missingModels.length) {
      throw new Error(`Strict model coverage failed for profile '${activeProfile}'. Missing models: ${missingModels.join(", ")}`);
    }
  }

  console.log("\nSeed complete. Entity counts:");
  console.log(`  mentors: ${mentorCount}`);
  console.log(`  mentees: ${menteeCount}`);
  console.log(`  availability slots: ${availabilityCount}`);
  console.log(`  resources: ${resourceCount}`);
  console.log(`  conversations: ${conversationCount}`);
  console.log(`  messages: ${messageCount}`);
  console.log(`  bookings: ${bookingCount}`);
  console.log(`  mentoring sessions: ${mentoringSessionCount}`);
  console.log(`  auth sessions: ${authSessionCount}`);
  console.log(`  reports: ${reportCount}`);
  console.log(`  goals: ${goalCount}`);
  console.log(`  payments: ${paymentCount}`);
  console.log(`  AI quality tiers: high=${highAiTierProfiles + 1}, low=${lowAiTierProfiles}`);
  console.log("\nDeterministic test accounts:");
  console.log(`  mentor: ${TEST_ACCOUNT.mentorEmail}`);
  console.log(`  mentee: ${TEST_ACCOUNT.menteeEmail}`);
  console.log(`  admin:  ${TEST_ACCOUNT.adminEmail}`);
  console.log(`  password: ${TEST_ACCOUNT.password}`);
}

run()
  .catch((error) => {
    console.error("Failed to seed local fake data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
