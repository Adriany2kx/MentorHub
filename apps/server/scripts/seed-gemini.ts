import { prisma } from "../src/lib/prisma.js";
import dotenv from "dotenv";
import { hashPassword } from "../src/lib/hash.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

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
    const content = fs.readFileSync(filePath, { encoding: 'utf8' }).trim();
  return JSON.parse(content);
}

async function seed() {
  console.log("🌱 Seeding database with Gemini-generated test data...\n");

  try {
    // Load data from JSON files
    console.log("📂 Loading data from generated JSON files...");
    const mentorsData = loadJsonFile<MentorData>("data-mentors.json");
    const menteesData = loadJsonFile<MenteeData>("data-mentees.json");
    const resourcesData = loadJsonFile<ResourceData>("data-resources.json");
    const sessionsData = loadJsonFile<SessionData>("data-sessions.json");

    console.log(`  ✓ Loaded ${mentorsData.length} mentors`);
    console.log(`  ✓ Loaded ${menteesData.length} mentees`);
    console.log(`  ✓ Loaded ${resourcesData.length} resources`);
    console.log(`  ✓ Loaded ${sessionsData.length} session templates\n`);

    // Create mentor accounts and profiles
    console.log("👨‍🏫 Creating mentor accounts...");
    const mentorUsers: { id: string; email: string }[] = [];
    
    for (const data of mentorsData) {
      const user = await prisma.user.upsert({
        where: { email: data.email },
        update: {},
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
        update: {},
        create: {
          userId: user.id,
          headline: data.headline,
          expertise: data.expertise,
          hourlyRate: data.hourlyRate,
          yearsExperience: data.yearsExperience,
          isApproved: true,
        },
      });

      mentorUsers.push(user);
      console.log(`  ✓ ${data.firstName} ${data.lastName}`);
    }

    // Create mentee accounts and profiles
    console.log("\n👥 Creating mentee accounts...");
    const menteeUsers: { id: string; email: string }[] = [];
    
    for (const data of menteesData) {
      const user = await prisma.user.upsert({
        where: { email: data.email },
        update: {},
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
        update: {},
        create: {
          userId: user.id,
          goals: data.goals,
          interests: data.interests,
          currentRole: data.currentRole,
          targetRole: data.targetRole,
        },
      });

      menteeUsers.push(user);
      console.log(`  ✓ ${data.firstName} ${data.lastName}`);
    }

    // Create resources
    console.log("\n📚 Creating resources...");
    let resourceCount = 0;
    
    for (let i = 0; i < resourcesData.length; i++) {
      const data = resourcesData[i];
      const uploader = mentorUsers[i % mentorUsers.length];
      
      await prisma.resource.create({
        data: {
          title: data.title,
          fileType: data.fileType,
          fileSize: Math.floor(Math.random() * 50000000),
          filePath: `/uploads/resources/${data.topic.toLowerCase().replace(/\s+/g, '-')}-${i}.pdf`,
          uploaderId: uploader.id,
          isPublic: Math.random() > 0.3, // 70% public
        },
      });
      resourceCount++;
    }
    console.log(`  ✓ Created ${resourceCount} resources`);

    // Create bookings and sessions
    console.log("\n📅 Creating bookings and sessions...");
    let bookingCount = 0;
    
    for (let i = 0; i < 20; i++) {
      const mentee = menteeUsers[i % menteeUsers.length];
      const mentor = mentorUsers[i % mentorUsers.length];
      
      const startTime = new Date(Date.now() + (Math.floor(Math.random() * 60) + 1) * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      const booking = await prisma.booking.create({
        data: {
          menteeId: mentee.id,
          mentorId: mentor.id,
          startTime,
          endTime,
          status: ["CONFIRMED", "PENDING", "CANCELLED"][Math.floor(Math.random() * 3)],
          notes: sessionsData[i % sessionsData.length].notes,
        },
      });

      if (booking.status === "CONFIRMED") {
        await prisma.session.create({
          data: {
            bookingId: booking.id,
            menteeId: mentee.id,
            mentorId: mentor.id,
            scheduledStart: startTime,
            scheduledEnd: endTime,
            status: ["SCHEDULED", "COMPLETED"][Math.floor(Math.random() * 2)],
            notes: sessionsData[i % sessionsData.length].notes,
          },
        });
      }

      bookingCount++;
    }
    console.log(`  ✓ Created ${bookingCount} bookings and sessions`);

    // Create reviews from completed sessions
    console.log("\n⭐ Creating reviews from completed sessions...");
    const completedSessions = await prisma.session.findMany({
      where: { status: "COMPLETED" },
    });

    let reviewCount = 0;
    for (const session of completedSessions.slice(0, 8)) {
      await prisma.review.create({
        data: {
          mentorId: session.mentorId,
          menteeId: session.menteeId,
          sessionId: session.id,
          rating: 4 + Math.random(), // 4-5 stars
          comment: [
            "Great mentor! Very knowledgeable and helpful.",
            "Excellent guidance and support throughout.",
            "Learned a lot from this session.",
            "Highly recommend as a mentor.",
            "Professional, approachable, and insightful.",
          ][Math.floor(Math.random() * 5)],
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
    console.log(`  • ${bookingCount} bookings/sessions`);
    console.log(`  • ${reviewCount} reviews`);

    console.log("\n📧 Test Accounts:");
    console.log("  All generated mentor and mentee accounts");
    console.log("  Password: TestPassword123!");
    console.log("\n💡 Data generated by Google Gemini CLI using gemini -p 'prompt'\n");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
