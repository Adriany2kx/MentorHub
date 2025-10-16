import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/hash.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MentorData {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  expertise: string[];
  hourlyRate: number;
  yearsExperience: number;
  bio: string;
}

interface MenteeData {
  firstName: string;
  lastName: string;
  email: string;
  currentRole: string;
  targetRole: string;
  goals: string;
  interests: string[];
}

interface ResourceData {
  title: string;
  description: string;
  fileType: string;
  topic: string;
}

interface SessionData {
  sessionType: string;
  notes: string;
  keyTakeaways: string[];
  nextSteps: string[];
}

function loadJsonFile<T>(filename: string): T[] {
  const filePath = path.join(__dirname, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const content = raw.replace(/^\uFEFF/, "");
  const start = content.indexOf("[");
  const end = content.lastIndexOf("]");

  if (start === -1 || end <= start) {
    throw new Error(`Invalid JSON array in ${filename}`);
  }

  return JSON.parse(content.slice(start, end + 1)) as T[];
}

async function seed() {
  console.log("🌱 Seeding database with Gemini-generated test data...\n");

  try {
    console.log("📂 Loading data from generated JSON files...");
    const mentorsData = loadJsonFile<MentorData>("data-mentors.json");
    const menteesData = loadJsonFile<MenteeData>("data-mentees.json");
    const resourcesData = loadJsonFile<ResourceData>("data-resources.json");
    const sessionsData = loadJsonFile<SessionData>("data-sessions.json");

    console.log(`  ✓ Loaded ${mentorsData.length} mentors`);
    console.log(`  ✓ Loaded ${menteesData.length} mentees`);
    console.log(`  ✓ Loaded ${resourcesData.length} resources`);
    console.log(`  ✓ Loaded ${sessionsData.length} session templates\n`);

    console.log("👨‍🏫 Creating mentor accounts...");
    const mentorUsers: { id: string }[] = [];

    for (const data of mentorsData) {
      const user = await prisma.user.upsert({
        where: { email: data.email },
        update: {
          firstName: data.firstName,
          lastName: data.lastName,
          bio: data.bio,
          role: "MENTOR",
          isVerified: true,
        },
        create: {
          email: data.email,
          passwordHash: await hashPassword("TestPassword123!"),
          firstName: data.firstName,
          lastName: data.lastName,
          role: "MENTOR",
          isVerified: true,
          bio: data.bio,
          timezone: "Europe/London",
        },
      });

      await prisma.mentorProfile.upsert({
        where: { userId: user.id },
        update: {
          headline: data.headline,
          expertise: data.expertise,
          hourlyRate: data.hourlyRate,
          yearsExperience: data.yearsExperience,
          isApproved: true,
        },
        create: {
          userId: user.id,
          headline: data.headline,
          expertise: data.expertise,
          hourlyRate: data.hourlyRate,
          yearsExperience: data.yearsExperience,
          isApproved: true,
        },
      });

      mentorUsers.push({ id: user.id });
      console.log(`  ✓ ${data.firstName} ${data.lastName}`);
    }

    console.log("\n👥 Creating mentee accounts...");
    const menteeUsers: { id: string }[] = [];

    for (const data of menteesData) {
      const user = await prisma.user.upsert({
        where: { email: data.email },
        update: {
          firstName: data.firstName,
          lastName: data.lastName,
          bio: `${data.firstName} is a ${data.currentRole} looking to become a ${data.targetRole}.`,
          role: "MENTEE",
          isVerified: true,
        },
        create: {
          email: data.email,
          passwordHash: await hashPassword("TestPassword123!"),
          firstName: data.firstName,
          lastName: data.lastName,
          role: "MENTEE",
          isVerified: true,
          bio: `${data.firstName} is a ${data.currentRole} looking to become a ${data.targetRole}.`,
          timezone: "Europe/London",
        },
      });

      await prisma.menteeProfile.upsert({
        where: { userId: user.id },
        update: {
          goals: data.goals,
          interests: data.interests,
          currentRole: data.currentRole,
          targetRole: data.targetRole,
        },
        create: {
          userId: user.id,
          goals: data.goals,
          interests: data.interests,
          currentRole: data.currentRole,
          targetRole: data.targetRole,
        },
      });

      menteeUsers.push({ id: user.id });
      console.log(`  ✓ ${data.firstName} ${data.lastName}`);
    }

    const mentorProfiles = await Promise.all(
      mentorUsers.map((u) => prisma.mentorProfile.findUnique({ where: { userId: u.id } })),
    );
    const usableMentorProfiles = mentorProfiles.filter((p): p is NonNullable<typeof p> => Boolean(p));

    console.log("\n📚 Creating resources...");
    let resourceCount = 0;

    for (let i = 0; i < resourcesData.length; i++) {
      const data = resourcesData[i];
      const uploader = mentorUsers[i % mentorUsers.length];

      await prisma.resource.create({
        data: {
          title: data.title,
          fileType: data.fileType,
          fileSize: Math.floor(Math.random() * 50_000_000),
          filePath: `/uploads/resources/${data.topic.toLowerCase().replace(/\s+/g, "-")}-${i}.pdf`,
          uploaderId: uploader.id,
          isPublic: Math.random() > 0.3,
        },
      });

      resourceCount++;
    }
    console.log(`  ✓ Created ${resourceCount} resources`);

    console.log("\n🎓 Creating programs...");
    const programBlueprints = [
      {
        title: "Full Stack Development",
        description: "Master modern full-stack development with React and Node.js",
        duration: 60,
        price: new Decimal(120),
        topics: ["React", "Node.js", "TypeScript"],
      },
      {
        title: "System Design Mastery",
        description: "Learn scalable system design patterns and architecture",
        duration: 90,
        price: new Decimal(150),
        topics: ["System Design", "Architecture", "Scalability"],
      },
      {
        title: "Leadership and Career Growth",
        description: "Transition to leadership roles with technical depth",
        duration: 60,
        price: new Decimal(130),
        topics: ["Leadership", "Career", "Communication"],
      },
    ];

    const programs = await Promise.all(
      programBlueprints.map((program, index) =>
        prisma.program.create({
          data: {
            mentorId: usableMentorProfiles[index % usableMentorProfiles.length].id,
            title: program.title,
            description: program.description,
            duration: program.duration,
            sessionCount: 1,
            price: program.price,
            maxParticipants: 1,
            topics: program.topics,
            isPublished: true,
          },
        }),
      ),
    );
    console.log(`  ✓ Created ${programs.length} programs`);

    console.log("\n📅 Creating bookings and sessions...");
    let bookingCount = 0;
    const completedBookingIds: string[] = [];

    for (let i = 0; i < 20; i++) {
      const mentee = menteeUsers[i % menteeUsers.length];
      const mentorProfile = usableMentorProfiles[i % usableMentorProfiles.length];
      const program = programs[i % programs.length];
      const totalPrice = new Decimal(mentorProfile.hourlyRate?.toString() ?? "100");
      const isConfirmed = Math.random() > 0.25;

      const booking = await prisma.booking.create({
        data: {
          programId: program.id,
          menteeId: mentee.id,
          mentorId: mentorProfile.id,
          totalPrice,
          status: isConfirmed ? "CONFIRMED" : "PENDING",
          note: sessionsData[i % sessionsData.length].notes,
        },
      });

      if (isConfirmed) {
        const scheduledAt = new Date(Date.now() + (Math.floor(Math.random() * 45) + 1) * 24 * 60 * 60 * 1000);
        const sessionStatus = Math.random() > 0.5 ? "COMPLETED" : "SCHEDULED";

        await prisma.mentoringSession.create({
          data: {
            bookingId: booking.id,
            scheduledAt,
            duration: 60,
            status: sessionStatus,
            mentorNotes: sessionsData[i % sessionsData.length].notes,
          },
        });

        if (sessionStatus === "COMPLETED") {
          completedBookingIds.push(booking.id);
        }
      }

      bookingCount++;
    }
    console.log(`  ✓ Created ${bookingCount} bookings and sessions`);

    console.log("\n⭐ Creating reviews from completed sessions...");
    let reviewCount = 0;

    for (const bookingId of completedBookingIds.slice(0, 8)) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) continue;

      await prisma.review.upsert({
        where: { bookingId },
        update: {
          rating: Math.random() > 0.4 ? 5 : 4,
          content: "Great mentoring session with clear actionable guidance.",
          title: "Helpful and practical",
        },
        create: {
          mentorId: booking.mentorId,
          menteeId: booking.menteeId,
          bookingId,
          rating: Math.random() > 0.4 ? 5 : 4,
          title: "Helpful and practical",
          content: "Great mentoring session with clear actionable guidance.",
        },
      });
      reviewCount++;
    }

    console.log(`  ✓ Created ${reviewCount} reviews`);

    console.log("\n✅ Seed complete!\n");
    console.log("📊 Data Summary:");
    console.log(`  • ${mentorUsers.length} mentors`);
    console.log(`  • ${menteeUsers.length} mentees`);
    console.log(`  • ${resourceCount} resources`);
    console.log(`  • ${programs.length} programs`);
    console.log(`  • ${bookingCount} bookings/sessions`);
    console.log(`  • ${reviewCount} reviews`);

    console.log("\n📧 Test Accounts:");
    console.log("  Mentors: mentor+1@mentorship.test through mentor+15@mentorship.test");
    console.log("  Mentees: mentee+1@mentorship.test through mentee+20@mentorship.test");
    console.log("  Password: TestPassword123!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
