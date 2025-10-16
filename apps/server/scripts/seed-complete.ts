import dotenv from "dotenv";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/hash.js";
import { Decimal } from "@prisma/client/runtime/library";

dotenv.config();

// Gemini-generated mentor data (truncated for brevity)
const mentorsData = [
  {"firstName":"Sarah","lastName":"Chen","email":"mentor1@mentorship.test","headline":"Senior Full Stack Architect @ FinTech","expertise":["React","Node.js","System Design","AWS"],"hourlyRate":150,"yearsExperience":12,"bio":"Sarah is a seasoned software architect with over a decade of experience building scalable financial systems."},
  {"firstName":"Marcus","lastName":"Rodriguez","email":"mentor2@mentorship.test","headline":"Engineering Manager & Backend Specialist","expertise":["Go","Kubernetes","PostgreSQL","Team Leadership"],"hourlyRate":175,"yearsExperience":15,"bio":"Marcus leads a team of engineers at a high-growth startup."},
  {"firstName":"Elena","lastName":"Petrova","email":"mentor3@mentorship.test","headline":"Lead Frontend Engineer","expertise":["TypeScript","Next.js","Tailwind CSS","Web Performance"],"hourlyRate":120,"yearsExperience":8,"bio":"Elena is a frontend enthusiast who obsesses over user experience."},
  {"firstName":"James","lastName":"Wilson","email":"mentor4@mentorship.test","headline":"DevOps & Cloud Infrastructure Expert","expertise":["Terraform","AWS","Docker","CI/CD"],"hourlyRate":160,"yearsExperience":10,"bio":"James specializes in building robust cloud infrastructure."},
  {"firstName":"Priya","lastName":"Sharma","email":"mentor5@mentorship.test","headline":"Mobile Dev Lead - iOS & Android","expertise":["Swift","Kotlin","Mobile Architecture","React Native"],"hourlyRate":130,"yearsExperience":11,"bio":"Priya has built apps for over 100 million users."},
  {"firstName":"David","lastName":"Thompson","email":"mentor6@mentorship.test","headline":"Machine Learning & Data Science Engineer","expertise":["Python","TensorFlow","Data Engineering","ML Ops"],"hourlyRate":180,"yearsExperience":9,"bio":"David builds production ML systems at scale."},
  {"firstName":"Lisa","lastName":"Anderson","email":"mentor7@mentorship.test","headline":"Platform Engineering & Scaling Expert","expertise":["System Design","Microservices","Database Optimization","Distributed Systems"],"hourlyRate":170,"yearsExperience":14,"bio":"Lisa has architected systems serving millions of requests per second."},
  {"firstName":"Ahmed","lastName":"Hassan","email":"mentor8@mentorship.test","headline":"Security & Compliance Specialist","expertise":["Cybersecurity","Cloud Security","OAuth/JWT","Secure Development"],"hourlyRate":155,"yearsExperience":12,"bio":"Ahmed helps companies build security into development."},
  {"firstName":"Rachel","lastName":"Green","email":"mentor9@mentorship.test","headline":"Product Engineer & Startup Founder","expertise":["Product Strategy","Startup Tech","Full Stack Development","Growth Engineering"],"hourlyRate":140,"yearsExperience":9,"bio":"Rachel has scaled two startups to successful exits."},
  {"firstName":"Chris","lastName":"Brown","email":"mentor10@mentorship.test","headline":"Open Source & Developer Advocate","expertise":["Go","Rust","Developer Community","Open Source"],"hourlyRate":125,"yearsExperience":13,"bio":"Chris maintains several popular open source projects."},
  {"firstName":"Nina","lastName":"Patel","email":"mentor11@mentorship.test","headline":"QA & Testing Strategy","expertise":["Automation Testing","Load Testing","QA Strategy","Test Engineering"],"hourlyRate":110,"yearsExperience":10,"bio":"Nina helps teams build quality into their process."},
  {"firstName":"Tom","lastName":"Miller","email":"mentor12@mentorship.test","headline":"Enterprise Architect","expertise":["J2EE","Enterprise Integration","Spring Framework","SOA"],"hourlyRate":165,"yearsExperience":18,"bio":"Tom brings Fortune 500 enterprise architecture experience."},
  {"firstName":"Sophia","lastName":"Garcia","email":"mentor13@mentorship.test","headline":"UX Engineering Lead","expertise":["React","Design Systems","Web Accessibility","User Experience"],"hourlyRate":135,"yearsExperience":8,"bio":"Sophia bridges the gap between design and engineering."},
  {"firstName":"Kevin","lastName":"Park","email":"mentor14@mentorship.test","headline":"Database Architect","expertise":["PostgreSQL","MongoDB","Database Design","Query Optimization"],"hourlyRate":145,"yearsExperience":11,"bio":"Kevin has optimized databases serving terabytes of data."},
  {"firstName":"Jasmine","lastName":"Kumar","email":"mentor15@mentorship.test","headline":"Staff Engineer & Technical Leadership","expertise":["Technical Strategy","Leadership","Code Architecture","Mentoring"],"hourlyRate":160,"yearsExperience":16,"bio":"Jasmine focuses on technical strategy and team building."}
];

// Gemini-generated mentee data
const menteesData = [
  {"firstName":"Alice","lastName":"Chen","email":"mentee1@mentorship.test","currentRole":"Junior Developer","targetRole":"Senior Engineer","goals":"Master full-stack","interests":["Web","Open Source","Design"]},
  {"firstName":"Bob","lastName":"Johnson","email":"mentee2@mentorship.test","currentRole":"Frontend Developer","targetRole":"Tech Lead","goals":"Learn leadership","interests":["React","Leadership","Performance"]},
  {"firstName":"Carmen","lastName":"Rodriguez","email":"mentee3@mentorship.test","currentRole":"QA Engineer","targetRole":"Quality Architect","goals":"Transition to automation","interests":["Testing","Automation","DevOps"]},
  {"firstName":"Daniel","lastName":"Lee","email":"mentee4@mentorship.test","currentRole":"Graduate Developer","targetRole":"Backend Engineer","goals":"Build APIs","interests":["Go","Microservices","Cloud"]},
  {"firstName":"Emily","lastName":"White","email":"mentee5@mentorship.test","currentRole":"Data Analyst","targetRole":"Data Engineer","goals":"Build pipelines","interests":["Python","Data","ETL"]},
  {"firstName":"Frank","lastName":"Miller","email":"mentee6@mentorship.test","currentRole":"Support Engineer","targetRole":"DevOps Engineer","goals":"Learn infrastructure","interests":["Kubernetes","AWS","Infrastructure"]},
  {"firstName":"Grace","lastName":"Taylor","email":"mentee7@mentorship.test","currentRole":"UI Developer","targetRole":"Full Stack Engineer","goals":"Expand backend","interests":["Node.js","Databases","Mobile"]},
  {"firstName":"Henry","lastName":"Anderson","email":"mentee8@mentorship.test","currentRole":"Technical Writer","targetRole":"Developer Advocate","goals":"Transition to engineering","interests":["Speaking","Product","Community"]},
  {"firstName":"Iris","lastName":"Wilson","email":"mentee9@mentorship.test","currentRole":"IT Support","targetRole":"Junior Developer","goals":"Career transition","interests":["JavaScript","Web","Career"]},
  {"firstName":"Jack","lastName":"Brown","email":"mentee10@mentorship.test","currentRole":"Bootcamp Graduate","targetRole":"Full Stack Developer","goals":"Get first job","interests":["React","Express","Practices"]},
  {"firstName":"Karen","lastName":"Davis","email":"mentee11@mentorship.test","currentRole":"Junior Software Engineer","targetRole":"ML Engineer","goals":"Transition to ML","interests":["Python","Machine Learning","AI"]},
  {"firstName":"Leo","lastName":"Martinez","email":"mentee12@mentorship.test","currentRole":"Mobile Developer","targetRole":"Platform Lead","goals":"Learn backend","interests":["Go","Database","Scalability"]},
  {"firstName":"Mia","lastName":"Garcia","email":"mentee13@mentorship.test","currentRole":"Junior Backend","targetRole":"Solutions Architect","goals":"Develop architecture skills","interests":["System Design","Enterprise","Tech"]},
  {"firstName":"Noah","lastName":"Thompson","email":"mentee14@mentorship.test","currentRole":"Frontend Engineer","targetRole":"Principal Engineer","goals":"Develop expertise","interests":["Architecture","Performance","Leadership"]},
  {"firstName":"Olivia","lastName":"Jackson","email":"mentee15@mentorship.test","currentRole":"Database Administrator","targetRole":"Backend Engineer","goals":"Build services","interests":["PostgreSQL","Backend","Design"]},
  {"firstName":"Paul","lastName":"Harris","email":"mentee16@mentorship.test","currentRole":"Junior DevOps","targetRole":"Site Reliability Engineer","goals":"Become SRE","interests":["Kubernetes","Observability","SRE"]},
  {"firstName":"Quinn","lastName":"Clark","email":"mentee17@mentorship.test","currentRole":"QA Automation","targetRole":"Test Engineering Lead","goals":"Build infrastructure","interests":["Automation","Testing","Leadership"]},
  {"firstName":"Rachel","lastName":"Lewis","email":"mentee18@mentorship.test","currentRole":"Junior Frontend","targetRole":"Full Stack Engineer","goals":"Gain backend","interests":["TypeScript","Node.js","Stack"]},
  {"firstName":"Sam","lastName":"Walker","email":"mentee19@mentorship.test","currentRole":"Support Engineer","targetRole":"Software Engineer","goals":"Transition to dev","interests":["Python","Web","Career"]},
  {"firstName":"Tina","lastName":"Hall","email":"mentee20@mentorship.test","currentRole":"Contract Developer","targetRole":"Permanent Staff Engineer","goals":"Build career","interests":["Design","Architecture","Growth"]}
];

const resourcesData = [
  {"title":"React 19 Advanced Patterns","description":"Master hooks and composition","fileType":"DOCUMENT","topic":"React"},
  {"title":"TypeScript Generics Deep Dive","description":"Advanced type patterns","fileType":"VIDEO","topic":"TypeScript"},
  {"title":"System Design Interview Guide","description":"Architecture principles","fileType":"DOCUMENT","topic":"System Design"},
  {"title":"Microservices Communication","description":"Event-driven architecture","fileType":"VIDEO","topic":"Microservices"},
  {"title":"Database Optimization Handbook","description":"Performance tuning","fileType":"DOCUMENT","topic":"Databases"},
  {"title":"Kubernetes in Production","description":"Container orchestration","fileType":"VIDEO","topic":"Kubernetes"},
  {"title":"Web Performance Optimization","description":"Optimization techniques","fileType":"DOCUMENT","topic":"Web Performance"},
  {"title":"Security Best Practices Guide","description":"Application security","fileType":"IMAGE","topic":"Security"},
  {"title":"Cloud Architecture Decisions","description":"Cloud patterns","fileType":"DOCUMENT","topic":"Cloud"},
  {"title":"Machine Learning Fundamentals","description":"ML implementation","fileType":"VIDEO","topic":"Machine Learning"},
  {"title":"Testing Strategies Guide","description":"Test automation","fileType":"DOCUMENT","topic":"Testing"},
  {"title":"Leadership & Communication","description":"Technical leadership","fileType":"VIDEO","topic":"Leadership"}
];

async function seed() {
  console.log("🌱 Seeding database with Gemini-generated test data...\n");

  try {
    console.log("👨‍🏫 Creating mentor accounts...");
    const mentorUsers: { id: string }[] = [];
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

    console.log("\n👥 Creating mentee accounts...");
    const menteeUsers: { id: string }[] = [];
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
          isPublic: Math.random() > 0.3,
        },
      });
      resourceCount++;
    }
    console.log(`  ✓ Created ${resourceCount} resources`);

    const mentorProfiles = await Promise.all(
      mentorUsers.map(m => prisma.mentorProfile.findUnique({ where: { userId: m.id } }))
    );
    const validMentorProfiles = mentorProfiles.filter(p => p !== null) as any[];

    console.log("\n🎓 Creating programs...");
    const programs = await Promise.all([
      prisma.program.create({
        data: {
          title: "Full Stack Development",
          description: "Master modern full-stack with React and Node.js",
          duration: 60,
          price: new Decimal(120),
          topics: ["React", "Node.js"],
          mentorId: validMentorProfiles[0]?.id || "",
        },
      }),
      prisma.program.create({
        data: {
          title: "System Design Mastery",
          description: "Learn scalable patterns",
          duration: 90,
          price: new Decimal(150),
          topics: ["System Design", "Architecture"],
          mentorId: validMentorProfiles[6]?.id || "",
        },
      }),
      prisma.program.create({
        data: {
          title: "Leadership & Career Growth",
          description: "Transition to leadership",
          duration: 60,
          price: new Decimal(130),
          topics: ["Leadership", "Career"],
          mentorId: validMentorProfiles[14]?.id || validMentorProfiles[0]?.id || "",
        },
      }),
    ]);
    console.log(`  ✓ Created ${programs.length} programs`);

    console.log("\n📅 Creating bookings and sessions...");
    let bookingCount = 0;
    for (let i = 0; i < 20; i++) {
      const mentee = menteeUsers[i % menteeUsers.length];
      const mentorProfile = validMentorProfiles[i % validMentorProfiles.length];
      const program = programs[i % programs.length];
      if (!mentorProfile) continue;
      
      const booking = await prisma.booking.create({
        data: {
          programId: program.id,
          menteeId: mentee.id,
          mentorId: mentorProfile.id,
          totalPrice: new Decimal(120),
          status: ["CONFIRMED", "PENDING", "CANCELLED"][Math.floor(Math.random() * 3)],
          note: "Scheduled mentoring session",
        },
      });

      if (booking.status === "CONFIRMED") {
        const startTime = new Date(Date.now() + (Math.floor(Math.random() * 60) + 1) * 24 * 60 * 60 * 1000);
        await prisma.mentoringSession.create({
          data: {
            bookingId: booking.id,
            scheduledAt: startTime,
            duration: 60,
            status: ["SCHEDULED", "COMPLETED"][Math.floor(Math.random() * 2)],
            mentorNotes: "Effective mentoring session",
          },
        });
      }
      bookingCount++;
    }
    console.log(`  ✓ Created ${bookingCount} bookings and sessions`);

    console.log("\n✅ Seed complete!\n");
    console.log("📊 Data Summary:");
    console.log(`  • ${mentorUsers.length} mentors`);
    console.log(`  • ${menteeUsers.length} mentees`);
    console.log(`  • ${resourceCount} resources`);
    console.log(`  • ${programs.length} programs`);
    console.log(`  • ${bookingCount} bookings/sessions`);
    console.log("\n📧 Test Accounts:");
    console.log("  Mentors: mentor1@mentorship.test - mentor15@mentorship.test");
    console.log("  Mentees: mentee1@mentorship.test - mentee20@mentorship.test");
    console.log("  Password: TestPassword123!");
    console.log("\n💡 Data generated by Google Gemini CLI + TypeScript seed\n");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
