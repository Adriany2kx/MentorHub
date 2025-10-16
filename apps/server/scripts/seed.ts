import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/hash.js";

// Faker-like data generation utilities
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSlice<T>(arr: T[], min: number, max: number): T[] {
  const count = randomInt(min, max);
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const firstNames = [
  "Alex", "Jordan", "Sam", "Casey", "Morgan", "Riley", "Taylor", "Avery",
  "Sarah", "John", "Emily", "Michael", "Jessica", "David", "Amanda", "Christopher",
  "Emma", "Daniel", "Olivia", "James", "Sophia", "Robert", "Isabella", "William"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson"
];

const expertise = [
  "React", "TypeScript", "Node.js", "Python", "Data Science", "UI/UX Design",
  "Product Management", "DevOps", "Cloud Architecture", "Machine Learning",
  "Mobile Development", "Full Stack", "Backend Engineering", "Frontend Development",
  "System Design", "Database Design", "SEO", "Content Strategy", "Growth Hacking",
  "Project Management", "Agile/Scrum", "Leadership", "Negotiation", "Public Speaking"
];

const goals = [
  "Learn React and TypeScript",
  "Transition to product management",
  "Build a full-stack application",
  "Master system design",
  "Launch my own startup",
  "Improve communication skills",
  "Learn cloud engineering",
  "Get promoted to senior engineer",
  "Build a personal brand",
  "Master data science fundamentals"
];

const interests = [
  "Web Development", "Mobile Development", "AI/ML", "DevOps", "Design",
  "Startups", "Product", "Leadership", "Entrepreneurship", "Teaching",
  "Open Source", "Remote Work", "Career Growth", "Networking", "Technology"
];

const bios = [
  "Passionate about building scalable web applications with modern technologies.",
  "Full-stack engineer with 5+ years of experience helping companies grow.",
  "Product-focused engineer interested in mentoring junior developers.",
  "I believe great software solves real problems for real people.",
  "Enthusiastic about open source and helping others learn to code.",
  "Data scientist by day, mentor by night. Let's build something great together!",
  "Love working on challenging problems and sharing knowledge with others.",
  "UX designer focused on creating delightful user experiences.",
  "Cloud architect helping teams scale their infrastructure.",
  "Engineering leader passionate about team growth and psychological safety."
];

const currentRoles = [
  "Junior Developer",
  "Mid-level Engineer",
  "Senior Developer",
  "Contractor",
  "Career Changer",
  "Freelancer",
  "Recent Graduate",
  "Bootcamp Graduate"
];

const targetRoles = [
  "Senior Engineer",
  "Tech Lead",
  "Product Manager",
  "Engineering Manager",
  "Staff Engineer",
  "Design System Lead",
  "Developer Advocate",
  "Founder"
];

const resourceTitles = [
  "React Hooks Cheatsheet",
  "System Design Interview Prep",
  "CSS Grid Guide",
  "REST API Best Practices",
  "TypeScript Advanced Patterns",
  "Product Management 101",
  "Negotiation Skills for Engineers",
  "Building Accessible UIs",
  "Database Indexing Strategies",
  "Docker & Kubernetes Guide",
  "Career Development Roadmap",
  "Remote Work Best Practices",
  "Technical Writing for Developers"
];

async function seed() {
  console.log("🌱 Seeding database with test data...\n");

  try {
    // Clear existing data (optional - comment out if you want to preserve existing data)
    // await prisma.resource.deleteMany({});
    // await prisma.review.deleteMany({});
    // await prisma.session.deleteMany({});
    // await prisma.booking.deleteMany({});
    // await prisma.availability.deleteMany({});
    // await prisma.menteeProfile.deleteMany({});
    // await prisma.mentorProfile.deleteMany({});
    // await prisma.user.deleteMany({});

    // Create 15 test mentors
    console.log("📝 Creating mentor accounts...");
    const mentors = [];
    for (let i = 0; i < 15; i++) {
      const firstName = randomChoice(firstNames);
      const lastName = randomChoice(lastNames);
      const email = `mentor${i + 1}@mentorship.test`;
      
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword("TestPassword123!"),
          firstName,
          lastName,
          role: "MENTOR",
          isVerified: true,
          bio: randomChoice(bios),
          timezone: "Europe/London",
        },
      });

      const mentorProfile = await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          headline: `${randomChoice(expertise)} Expert`,
          expertise: randomSlice(expertise, 2, 5),
          hourlyRate: randomInt(50, 150),
          yearsExperience: randomInt(3, 15),
          isApproved: Math.random() > 0.2, // 80% approved
        },
      });

      mentors.push(user);
      console.log(`  ✓ ${firstName} ${lastName} (mentor)`);
    }

    // Create 20 test mentees
    console.log("\n👥 Creating mentee accounts...");
    const mentees = [];
    for (let i = 0; i < 20; i++) {
      const firstName = randomChoice(firstNames);
      const lastName = randomChoice(lastNames);
      const email = `mentee${i + 1}@mentorship.test`;
      
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword("TestPassword123!"),
          firstName,
          lastName,
          role: "MENTEE",
          isVerified: Math.random() > 0.3, // 70% verified
          bio: randomChoice(bios),
          timezone: "Europe/London",
        },
      });

      const menteeProfile = await prisma.menteeProfile.create({
        data: {
          userId: user.id,
          goals: randomChoice(goals),
          interests: randomSlice(interests, 2, 4),
          currentRole: randomChoice(currentRoles),
          targetRole: randomChoice(targetRoles),
        },
      });

      mentees.push(user);
      console.log(`  ✓ ${firstName} ${lastName} (mentee)`);
    }

    // Create some resources
    console.log("\n📚 Creating resources...");
    let resourceCount = 0;
    for (let i = 0; i < 10; i++) {
      const uploader = randomChoice([...mentors, ...mentees]);
      await prisma.resource.create({
        data: {
          title: randomChoice(resourceTitles),
          fileType: randomChoice(["DOCUMENT", "VIDEO", "IMAGE", "LINK"]),
          fileSize: randomInt(1000, 50000000),
          filePath: `/uploads/resources/resource-${i}.pdf`,
          uploaderId: uploader.id,
          isPublic: Math.random() > 0.4, // 60% public
        },
      });
      resourceCount++;
    }
    console.log(`  ✓ Created ${resourceCount} resources`);

    // Create some bookings and sessions
    console.log("\n📅 Creating bookings and sessions...");
    let bookingCount = 0;
    for (let i = 0; i < 25; i++) {
      const mentee = randomChoice(mentees);
      const mentor = randomChoice(mentors);
      
      const startTime = new Date(Date.now() + randomInt(1, 60) * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      const booking = await prisma.booking.create({
        data: {
          menteeId: mentee.id,
          mentorId: mentor.id,
          startTime,
          endTime,
          status: randomChoice(["CONFIRMED", "PENDING", "CANCELLED"]),
          notes: "Test booking for mentorship session",
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
            status: randomChoice(["SCHEDULED", "COMPLETED", "CANCELLED"]),
            notes: "Test session notes",
          },
        });
      }

      bookingCount++;
    }
    console.log(`  ✓ Created ${bookingCount} bookings and sessions`);

    // Create some reviews
    console.log("\n⭐ Creating reviews...");
    let reviewCount = 0;
    const completedSessions = await prisma.session.findMany({
      where: { status: "COMPLETED" },
      take: 10,
    });

    for (const session of completedSessions) {
      await prisma.review.create({
        data: {
          mentorId: session.mentorId,
          menteeId: session.menteeId,
          sessionId: session.id,
          rating: randomInt(4, 5),
          comment: randomChoice([
            "Great mentor! Very knowledgeable and helpful.",
            "Excellent guidance and support.",
            "Learned a lot from this session.",
            "Highly recommend as a mentor.",
            "Professional and approachable.",
          ]),
        },
      });
      reviewCount++;
    }
    console.log(`  ✓ Created ${reviewCount} reviews`);

    console.log("\n✅ Seed complete!");
    console.log("\n📧 Test Accounts:");
    console.log("  Mentors: mentor1@mentorship.test - mentor15@mentorship.test");
    console.log("  Mentees: mentee1@mentorship.test - mentee20@mentorship.test");
    console.log("  Password: TestPassword123!");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
