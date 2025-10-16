import dotenv from "dotenv";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/hash.js";

dotenv.config();

// Gemini-generated mentor data
const mentorsData = [
  {"firstName":"Sarah","lastName":"Chen","email":"mentor1@mentorship.test","headline":"Senior Full Stack Architect @ FinTech","expertise":["React","Node.js","System Design","AWS"],"hourlyRate":150,"yearsExperience":12,"bio":"Sarah is a seasoned software architect with over a decade of experience building scalable financial systems. She specializes in transitioning monolithic architectures to microservices."},
  {"firstName":"Marcus","lastName":"Rodriguez","email":"mentor2@mentorship.test","headline":"Engineering Manager & Backend Specialist","expertise":["Go","Kubernetes","PostgreSQL","Team Leadership"],"hourlyRate":175,"yearsExperience":15,"bio":"Marcus leads a team of engineers at a high-growth startup. Having spent his early career as a hands-on backend specialist in Go."},
  {"firstName":"Elena","lastName":"Petrova","email":"mentor3@mentorship.test","headline":"Lead Frontend Engineer","expertise":["TypeScript","Next.js","Tailwind CSS","Web Performance"],"hourlyRate":120,"yearsExperience":8,"bio":"Elena is a frontend enthusiast who obsesses over user experience and web performance. She has led several award-winning web applications."},
  {"firstName":"James","lastName":"Wilson","email":"mentor4@mentorship.test","headline":"DevOps & Cloud Infrastructure Expert","expertise":["Terraform","AWS","Docker","CI/CD"],"hourlyRate":160,"yearsExperience":10,"bio":"James specializes in building robust cloud infrastructure and CI/CD pipelines. He helps engineers understand infrastructure-as-code principles."},
  {"firstName":"Priya","lastName":"Sharma","email":"mentor5@mentorship.test","headline":"Mobile Dev Lead - iOS & Android","expertise":["Swift","Kotlin","Mobile Architecture","React Native"],"hourlyRate":130,"yearsExperience":11,"bio":"Priya has built apps for over 100 million users. She mentors developers on mobile best practices and native platform development."},
  {"firstName":"David","lastName":"Thompson","email":"mentor6@mentorship.test","headline":"Machine Learning & Data Science Engineer","expertise":["Python","TensorFlow","Data Engineering","ML Ops"],"hourlyRate":180,"yearsExperience":9,"bio":"David builds production ML systems at scale. His expertise spans from data pipeline engineering to model deployment."},
  {"firstName":"Lisa","lastName":"Anderson","email":"mentor7@mentorship.test","headline":"Platform Engineering & Scaling Expert","expertise":["System Design","Microservices","Database Optimization","Distributed Systems"],"hourlyRate":170,"yearsExperience":14,"bio":"Lisa has architected systems serving millions of requests per second. She focuses on scalability and reliability."},
  {"firstName":"Ahmed","lastName":"Hassan","email":"mentor8@mentorship.test","headline":"Security & Compliance Specialist","expertise":["Cybersecurity","Cloud Security","OAuth/JWT","Secure Development"],"hourlyRate":155,"yearsExperience":12,"bio":"Ahmed helps companies build security into their development from day one. His practical approach demystifies security best practices."},
  {"firstName":"Rachel","lastName":"Green","email":"mentor9@mentorship.test","headline":"Product Engineer & Startup Founder","expertise":["Product Strategy","Startup Tech","Full Stack Development","Growth Engineering"],"hourlyRate":140,"yearsExperience":9,"bio":"Rachel has scaled two startups to successful exits. She mentors engineers on building products that users love."},
  {"firstName":"Chris","lastName":"Brown","email":"mentor10@mentorship.test","headline":"Open Source & Developer Advocate","expertise":["Go","Rust","Developer Community","Open Source"],"hourlyRate":125,"yearsExperience":13,"bio":"Chris is passionate about open source software and building developer communities. He maintains several popular projects."},
  {"firstName":"Nina","lastName":"Patel","email":"mentor11@mentorship.test","headline":"QA & Testing Strategy","expertise":["Automation Testing","Load Testing","QA Strategy","Test Engineering"],"hourlyRate":110,"yearsExperience":10,"bio":"Nina helps teams build quality into their process. She's passionate about making testing accessible for all developers."},
  {"firstName":"Tom","lastName":"Miller","email":"mentor12@mentorship.test","headline":"Enterprise Architect","expertise":["J2EE","Enterprise Integration","Spring Framework","SOA"],"hourlyRate":165,"yearsExperience":18,"bio":"Tom brings enterprise architecture experience from Fortune 500 companies. He helps navigate complex organizational tech stacks."},
  {"firstName":"Sophia","lastName":"Garcia","email":"mentor13@mentorship.test","headline":"UX Engineering Lead","expertise":["React","Design Systems","Web Accessibility","User Experience"],"hourlyRate":135,"yearsExperience":8,"bio":"Sophia bridges the gap between design and engineering. She specializes in building accessible, performant user interfaces."},
  {"firstName":"Kevin","lastName":"Park","email":"mentor14@mentorship.test","headline":"Database Architect","expertise":["PostgreSQL","MongoDB","Database Design","Query Optimization"],"hourlyRate":145,"yearsExperience":11,"bio":"Kevin has optimized databases serving terabytes of data. He mentors on database design patterns and performance."},
  {"firstName":"Jasmine","lastName":"Kumar","email":"mentor15@mentorship.test","headline":"Staff Engineer & Technical Leadership","expertise":["Technical Strategy","Leadership","Code Architecture","Mentoring"],"hourlyRate":160,"yearsExperience":16,"bio":"Jasmine is a staff engineer focusing on technical strategy and building high-performing teams."}
];

// Gemini-generated mentee data
const menteesData = [
  {"firstName":"Alice","lastName":"Chen","email":"mentee1@mentorship.test","currentRole":"Junior Developer","targetRole":"Senior Engineer","goals":"Master full-stack development and system design","interests":["Web Development","Open Source","System Design"]},
  {"firstName":"Bob","lastName":"Johnson","email":"mentee2@mentorship.test","currentRole":"Frontend Developer","targetRole":"Tech Lead","goals":"Learn architecture and leadership skills","interests":["React","Leadership","Performance"]},
  {"firstName":"Carmen","lastName":"Rodriguez","email":"mentee3@mentorship.test","currentRole":"QA Engineer","targetRole":"Quality Architect","goals":"Transition to automation testing","interests":["Testing","Automation","DevOps"]},
  {"firstName":"Daniel","lastName":"Lee","email":"mentee4@mentorship.test","currentRole":"Graduate Developer","targetRole":"Backend Engineer","goals":"Build robust APIs and microservices","interests":["Go","Microservices","Cloud"]},
  {"firstName":"Emily","lastName":"White","email":"mentee5@mentorship.test","currentRole":"Data Analyst","targetRole":"Data Engineer","goals":"Build scalable data pipelines","interests":["Python","Data Engineering","ETL"]},
  {"firstName":"Frank","lastName":"Miller","email":"mentee6@mentorship.test","currentRole":"Support Engineer","targetRole":"DevOps Engineer","goals":"Learn infrastructure automation","interests":["Kubernetes","AWS","Infrastructure"]},
  {"firstName":"Grace","lastName":"Taylor","email":"mentee7@mentorship.test","currentRole":"UI Developer","targetRole":"Full Stack Engineer","goals":"Expand backend knowledge","interests":["Node.js","Databases","Mobile"]},
  {"firstName":"Henry","lastName":"Anderson","email":"mentee8@mentorship.test","currentRole":"Technical Writer","targetRole":"Developer Advocate","goals":"Transition into software engineering","interests":["Public Speaking","Product","Community"]},
  {"firstName":"Iris","lastName":"Wilson","email":"mentee9@mentorship.test","currentRole":"IT Support","targetRole":"Junior Developer","goals":"Career transition into software development","interests":["JavaScript","Web Development","Career Growth"]},
  {"firstName":"Jack","lastName":"Brown","email":"mentee10@mentorship.test","currentRole":"Bootcamp Graduate","targetRole":"Full Stack Developer","goals":"Get first software engineering job","interests":["React","Express","Best Practices"]},
  {"firstName":"Karen","lastName":"Davis","email":"mentee11@mentorship.test","currentRole":"Junior Software Engineer","targetRole":"ML Engineer","goals":"Transition towards machine learning","interests":["Python","Machine Learning","AI"]},
  {"firstName":"Leo","lastName":"Martinez","email":"mentee12@mentorship.test","currentRole":"Mobile Developer","targetRole":"Platform Lead","goals":"Learn backend and infrastructure","interests":["Go","Database Design","Scalability"]},
  {"firstName":"Mia","lastName":"Garcia","email":"mentee13@mentorship.test","currentRole":"Junior Backend","targetRole":"Solutions Architect","goals":"Develop architecture and consulting skills","interests":["System Design","Enterprise","Tech Consulting"]},
  {"firstName":"Noah","lastName":"Thompson","email":"mentee14@mentorship.test","currentRole":"Frontend Engineer","targetRole":"Principal Engineer","goals":"Develop deep expertise and guide technical direction","interests":["Architecture","Performance","Leadership"]},
  {"firstName":"Olivia","lastName":"Jackson","email":"mentee15@mentorship.test","currentRole":"Database Administrator","targetRole":"Backend Engineer","goals":"Build scalable backend services","interests":["PostgreSQL","Backend","System Design"]},
  {"firstName":"Paul","lastName":"Harris","email":"mentee16@mentorship.test","currentRole":"Junior DevOps","targetRole":"Site Reliability Engineer","goals":"Become an SRE and focus on reliability","interests":["Kubernetes","Observability","SRE"]},
  {"firstName":"Quinn","lastName":"Clark","email":"mentee17@mentorship.test","currentRole":"QA Automation","targetRole":"Test Engineering Lead","goals":"Build testing infrastructure","interests":["Automation","Testing","Leadership"]},
  {"firstName":"Rachel","lastName":"Lewis","email":"mentee18@mentorship.test","currentRole":"Junior Frontend","targetRole":"Full Stack Engineer","goals":"Gain backend skills","interests":["TypeScript","Node.js","Full Stack"]},
  {"firstName":"Sam","lastName":"Walker","email":"mentee19@mentorship.test","currentRole":"Support Engineer","targetRole":"Software Engineer","goals":"Transition to development","interests":["Python","Web Apps","Career Change"]},
  {"firstName":"Tina","lastName":"Hall","email":"mentee20@mentorship.test","currentRole":"Contract Developer","targetRole":"Permanent Staff Engineer","goals":"Build sustained career in architecture","interests":["Design Patterns","Architecture","Long-term Growth"]}
];

// Gemini-generated resource data
const resourcesData = [
  {"title":"React 19 Advanced Patterns","description":"Master hooks, composition, and state management in modern React applications","fileType":"DOCUMENT","topic":"React"},
  {"title":"TypeScript Generics Deep Dive","description":"Comprehensive guide to generic types, constraints, and advanced type patterns","fileType":"VIDEO","topic":"TypeScript"},
  {"title":"System Design Interview Guide","description":"Complete system design patterns and architecture principles for scalable systems","fileType":"DOCUMENT","topic":"System Design"},
  {"title":"Microservices Communication","description":"Best practices for service-to-service communication and event-driven architecture","fileType":"VIDEO","topic":"Microservices"},
  {"title":"Database Optimization Handbook","description":"Query optimization, indexing strategies, and performance tuning techniques","fileType":"DOCUMENT","topic":"Databases"},
  {"title":"Kubernetes in Production","description":"Deploying, scaling, and managing applications in Kubernetes environments","fileType":"VIDEO","topic":"Kubernetes"},
  {"title":"Web Performance Optimization","description":"Techniques for optimizing web application performance and user experience","fileType":"DOCUMENT","topic":"Web Performance"},
  {"title":"Security Best Practices Guide","description":"Application security, authentication, encryption, and secure development practices","fileType":"IMAGE","topic":"Security"},
  {"title":"Cloud Architecture Decisions","description":"Choosing between cloud providers and architectural patterns for cloud applications","fileType":"DOCUMENT","topic":"Cloud"},
  {"title":"Machine Learning Fundamentals","description":"Core ML concepts, algorithms, and practical implementation with Python","fileType":"VIDEO","topic":"Machine Learning"},
  {"title":"Testing Strategies Guide","description":"Unit testing, integration testing, and test automation Best practices","fileType":"DOCUMENT","topic":"Testing"},
  {"title":"Leadership & Communication","description":"Technical leadership skills for engineers transitioning to leadership roles","fileType":"VIDEO","topic":"Leadership"}
];

// Gemini-generated session data
const sessionsData = [
  {"sessionType":"INTRODUCTORY","notes":"First mentorship session covering career goals, current challenges, and mentoring approach","keyTakeaways":["Established rapport and goals","Discussed current tech stack","Planned next steps"],"nextSteps":["Schedule weekly meetings","Start React fundamentals review"]},
  {"sessionType":"TECHNICAL","notes":"Deep dive into system design principles for distributed systems and scalability patterns","keyTakeaways":["CAP theorem trade-offs","Load balancing strategies","Database partitioning"],"nextSteps":["Practice designing Uber-like system","Review case studies"]},
  {"sessionType":"CAREER_PLANNING","notes":"Discussed career path from Senior Engineer to Staff Engineer, focusing on impact and influence","keyTakeaways":["Impact over code output","Communication importance","Building influence"],"nextSteps":["Take on cross-team initiatives","Document learnings"]},
  {"sessionType":"CODE_REVIEW","notes":"Reviewed production code with focus on performance, security, and maintainability","keyTakeaways":["Redundant queries identified","Security vulnerability fixed","Refactoring suggestions"],"nextSteps":["Implement code review suggestions","Add monitoring"]},
  {"sessionType":"TECHNICAL","notes":"Exploring Kubernetes deployment strategies and best practices for containerized applications","keyTakeaways":["Helm chart patterns","Service mesh benefits","GitOps principles"],"nextSteps":["Deploy app to Kubernetes","Implement monitoring"]},
  {"sessionType":"INTRODUCTORY","notes":"Onboarding session for junior developer focusing on codebase, tools, and team culture","keyTakeaways":["Code structure overview","Development workflow","Team expectations"],"nextSteps":["Complete first task","Attend team meeting"]},
  {"sessionType":"CAREER_PLANNING","notes":"Transition plan from QA to development including skills to build and timeline","keyTakeaways":["Automation testing foundation","Backend fundamentals priority","3-month plan"],"nextSteps":["Complete backend course","Build portfolio project"]},
  {"sessionType":"TECHNICAL","notes":"Advanced TypeScript patterns including generics, utility types, and type-safe architecture","keyTakeaways":["Conditional types usage","Mapped types power","Type narrowing techniques"],"nextSteps":["Refactor project with types","Practice exercises"]},
  {"sessionType":"CODE_REVIEW","notes":"Reviewed API design and database schema for microservice architecture","keyTakeaways":["REST principles","Schema normalization","Versioning strategy"],"nextSteps":["Update documentation","Implement versioning"]},
  {"sessionType":"TECHNICAL","notes":"Machine learning model deployment and MLOps best practices for production systems","keyTakeaways":["Model versioning","A/B testing methods","Monitoring metrics"],"nextSteps":["Setup MLflow","Deploy first model"]},
  {"sessionType":"CAREER_PLANNING","notes":"Work-life balance and preventing burnout while growing technical career","keyTakeaways":["Setting boundaries","Saying no","Sustainable pace"],"nextSteps":["Document achievements","Plan sabbatical"]},
  {"sessionType":"TECHNICAL","notes":"Performance optimization focusing on critical path analysis and bottleneck identification","keyTakeaways":["Profiling tools","Caching strategies","Algorithm optimization"],"nextSteps":["Profile application","Implement improvements"]},
  {"sessionType":"INTRODUCTORY","notes":"Getting started with open source contribution and community involvement","keyTakeaways":["Project selection","PR process","Communication norms"],"nextSteps":["Find starter issue","Make first PR"]},
  {"sessionType":"CODE_REVIEW","notes":"Frontend performance and accessibility review of React application","keyTakeaways":["React optimization","WCAG compliance","Lighthouse scores"],"nextSteps":["Fix accessibility issues","Reduce bundle size"]},
  {"sessionType":"TECHNICAL","notes":"Event-driven architecture and message queue patterns for decoupled systems","keyTakeaways":["RabbitMQ basics","Event sourcing","CQRS pattern"],"nextSteps":["Design async system","Implement with Message Queue"]}
];

async function seed() {
  console.log("🌱 Seeding database with Gemini-generated test data...\n");

  try {
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
      // Create programs first
      console.log("\n🎓 Creating programs...");
      const programs = await Promise.all([
        prisma.program.create({
          data: {
            name: "Full Stack Development",
            description: "Master modern full-stack development with React and Node.js",
            duration: 12,
            level: "INTERMEDIATE",
            creatorId: mentorUsers[0].id,
          },
        }),
        prisma.program.create({
          data: {
            name: "System Design Mastery",
            description: "Learn scalable system design patterns and architecture",
            duration: 8,
            level: "ADVANCED",
            creatorId: mentorUsers[6].id,
          },
        }),
        prisma.program.create({
          data: {
            name: "Leadership & Career Growth",
            description: "Transition to leadership roles with technical depth",
            duration: 6,
            level: "INTERMEDIATE",
            creatorId: mentorUsers[14].id,
          },
        }),
      ]);
      console.log(`  ✓ Created ${programs.length} programs`);

      // Create bookings and sessions
      console.log("\n📅 Creating bookings and sessions...");
      let bookingCount = 0;
    
      for (let i = 0; i < 20; i++) {
        const mentee = menteeUsers[i % menteeUsers.length];
        const mentor = mentorUsers[i % mentorUsers.length];
        const program = programs[i % programs.length];
        const hourlyRate = mentorUsers.find(m => m.id === mentor.id) ? 120 : 100;
      
        const startTime = new Date(Date.now() + (Math.floor(Math.random() * 60) + 1) * 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        const totalPrice = hourlyRate; // 1 hour session
      
        const booking = await prisma.booking.create({
          data: {
            programId: program.id,
            menteeId: mentee.id,
            mentorId: mentor.id,
            totalPrice,
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
    console.log("\n💡 Data generated by Google Gemini CLI\n");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
