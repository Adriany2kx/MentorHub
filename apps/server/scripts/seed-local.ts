import dotenv from "dotenv";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/hash.js";

dotenv.config();

type SeedProfileName = "small" | "medium" | "large";

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
};

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

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
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
  const profile = PROFILES[requestedProfile] ?? PROFILES.small;
  const includeGoals = hasFlag("--include-goals");
  const includePayments = hasFlag("--include-payments");

  if (!PROFILES[requestedProfile]) {
    console.warn(`Unknown profile '${requestedProfile}', defaulting to 'small'.`);
  }

  console.log("\nSeeding local fake data");
  console.log(`Profile: ${requestedProfile in PROFILES ? requestedProfile : "small"}`);
  console.log(`Include goals/milestones: ${includeGoals ? "yes" : "no"}`);
  console.log(`Include payments: ${includePayments ? "yes" : "no"}`);

  console.log("\nResetting existing data...");
  await resetDatabase();
  console.log("Reset complete.");

  const passwordHash = await hashPassword(TEST_ACCOUNT.password);

  const mentors: Array<{ userId: string; mentorProfileId: string; expertise: string[] }> = [];
  const mentees: Array<{ userId: string }> = [];

  console.log("\nCreating mentors and mentor skills...");
  for (let i = 0; i < profile.mentors; i++) {
    const archetype = MENTOR_ARCHETYPES[i % MENTOR_ARCHETYPES.length];
    const expertise = pickMentorExpertise(archetype.expertisePool, i);
    const firstName = pick(FIRST_NAMES, i);
    const lastName = pick(LAST_NAMES, i + 2);
    const email = `mentor.local.${i + 1}@mentorhub.test`;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "MENTOR",
        isVerified: true,
        firstName,
        lastName,
        bio: `${firstName} mentors professionals aiming for structured career progress.`,
        timezone: "Europe/London",
      },
    });

    const mentorProfile = await prisma.mentorProfile.create({
      data: {
        userId: user.id,
        headline: archetype.headline,
        expertise,
        hourlyRate: 90 + i * 5,
        yearsExperience: 6 + (i % 11),
        isApproved: true,
      },
    });

    mentors.push({ userId: user.id, mentorProfileId: mentorProfile.id, expertise });
  }

  console.log("Creating mentees...");
  for (let i = 0; i < profile.mentees; i++) {
    const firstName = pick(FIRST_NAMES, i + 5);
    const lastName = pick(LAST_NAMES, i + 7);
    const email = `mentee.local.${i + 1}@mentorhub.test`;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "MENTEE",
        isVerified: true,
        firstName,
        lastName,
        bio: `${firstName} is preparing for a meaningful next career step.`,
        timezone: "Europe/London",
      },
    });

    await prisma.menteeProfile.create({
      data: {
        userId: user.id,
        goals: pick(GOAL_TEMPLATES, i),
        interests: [pick(EXPERTISE_POOL, i + 1), pick(EXPERTISE_POOL, i + 6)],
        currentRole: "Early-career professional",
        targetRole: "Mid-level specialist",
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
      timezone: "Europe/London",
    },
  });

  await prisma.menteeProfile.create({
    data: {
      userId: testMenteeUser.id,
      goals: "Land a mid-level role with a clear 90-day transition plan.",
      interests: ["Career Change", "Leadership"],
      currentRole: "Associate",
      targetRole: "Senior Associate",
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
      timezone: "Europe/London",
    },
  });

  mentors.push({
    userId: testMentorUser.id,
    mentorProfileId: testMentorProfile.id,
    expertise: ["Career Change", "Leadership", "Stakeholder Management"],
  });
  mentees.push({ userId: testMenteeUser.id });

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
      const scheduledAt = new Date(Date.now() + (i + 2) * 36 * 60 * 60 * 1000);
      const sessionStatus = status === "COMPLETED" ? "COMPLETED" : "SCHEDULED";

      await prisma.mentoringSession.create({
        data: {
          bookingId: booking.id,
          scheduledAt,
          duration: 60,
          status: sessionStatus,
          mentorNotes: "Synthetic mentor notes for demo.",
          menteeFeedback: sessionStatus === "COMPLETED" ? "Helpful and actionable session." : null,
          rating: sessionStatus === "COMPLETED" ? 5 : null,
        },
      });
    }
  }

  console.log("Creating resources...");
  for (let i = 0; i < profile.resources; i++) {
    const mentor = mentors[i % mentors.length];

    await prisma.resource.create({
      data: {
        uploaderId: mentor.userId,
        title: `${pick(RESOURCE_TOPICS, i)} Resource ${i + 1}`,
        filePath: `/uploads/resources/fake-resource-${i + 1}.pdf`,
        fileSize: 120_000 + i * 1000,
        mimeType: "application/pdf",
        fileType: "DOCUMENT",
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
      const createdAt = new Date(Date.now() - ((profile.messagesPerConversation - j) * (i + 1)) * 60_000);

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          content: pick(MESSAGE_OPENERS, i + j),
          isRead: j < profile.messagesPerConversation - 1,
          readAt: j < profile.messagesPerConversation - 1 ? new Date(createdAt.getTime() + 30_000) : null,
          createdAt,
        },
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

  await prisma.message.create({
    data: {
      conversationId: testConversation.id,
      senderId: testMenteeUser.id,
      content: "Hi Taylor, I uploaded my prep notes for tomorrow's session.",
      isRead: true,
      readAt: new Date(testMessage1Time.getTime() + 5 * 60 * 1000),
      createdAt: testMessage1Time,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: testConversation.id,
      senderId: testMentorUser.id,
      content: "Great, I reviewed them and added comments. We'll cover them first.",
      isRead: true,
      readAt: new Date(testMessage2Time.getTime() + 5 * 60 * 1000),
      createdAt: testMessage2Time,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: testConversation.id,
      senderId: testMenteeUser.id,
      content: "Perfect, thank you. See you tomorrow.",
      isRead: false,
      createdAt: testMessage3Time,
    },
  });

  await prisma.conversation.update({
    where: { id: testConversation.id },
    data: { lastMessageAt: testMessage3Time },
  });

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

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: new Decimal(350 + ((i + 1) % 4) * 50),
          status: booking.status === "COMPLETED" ? "COMPLETED" : "PENDING",
          stripePaymentId: `fake_pi_${String(i + 1).padStart(5, "0")}`,
        },
      });
    }
  }

  const [
    mentorCount,
    menteeCount,
    resourceCount,
    conversationCount,
    messageCount,
    bookingCount,
    sessionCount,
    goalCount,
    paymentCount,
  ] = await Promise.all([
    prisma.mentorProfile.count(),
    prisma.menteeProfile.count(),
    prisma.resource.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.booking.count(),
    prisma.mentoringSession.count(),
    prisma.goal.count(),
    prisma.payment.count(),
  ]);

  console.log("\nSeed complete. Entity counts:");
  console.log(`  mentors: ${mentorCount}`);
  console.log(`  mentees: ${menteeCount}`);
  console.log(`  resources: ${resourceCount}`);
  console.log(`  conversations: ${conversationCount}`);
  console.log(`  messages: ${messageCount}`);
  console.log(`  bookings: ${bookingCount}`);
  console.log(`  sessions: ${sessionCount}`);
  console.log(`  goals: ${goalCount}`);
  console.log(`  payments: ${paymentCount}`);
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
