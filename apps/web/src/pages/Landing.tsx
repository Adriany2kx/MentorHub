import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Star,
  Clock,
  Users,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Zap,
} from "lucide-react";
import { listMentors } from "../lib/api";
import type { MentorListItem } from "../lib/api";
import { AnimatedCounter } from "../components/animations";

/* ════════════════════════════════════════════════════════════════
   LANDING PAGE — MentorHub
   Design: Sanctuary — warm paper, teal accents, editorial typography
   ════════════════════════════════════════════════════════════════ */

// Scroll reveal hook
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Animated section wrapper
function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// AI Demo animation component
function AIDemoAnimation() {
  const [step, setStep] = useState(0);
  const steps = [
    { label: "Analyzing your goals...", icon: Target },
    { label: "Finding compatible mentors...", icon: Users },
    { label: "Generating recommendations...", icon: Sparkles },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 3);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[step].icon;

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: 32,
        maxWidth: 400,
        margin: "0 auto",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* Fake chat interface */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* User message */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              background: "var(--color-teal)",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: "16px 16px 4px 16px",
              maxWidth: "80%",
              fontSize: 14,
            }}
          >
            I want to transition from senior engineer to staff level
          </div>
        </div>

        {/* AI response */}
        <div style={{ display: "flex", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-teal) 0%, var(--color-success) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Brain size={18} style={{ color: "#fff" }} />
          </div>
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              padding: "12px 16px",
              borderRadius: "4px 16px 16px 16px",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "var(--color-teal)",
                fontWeight: 500,
              }}
            >
              <CurrentIcon
                size={16}
                style={{
                  animation: "pulse 1.5s infinite",
                }}
              />
              <span
                key={step}
                style={{
                  animation: "fadeSlideUp 400ms ease-out",
                }}
              >
                {steps[step].label}
              </span>
            </div>
          </div>
        </div>

        {/* Result preview */}
        <div
          style={{
            marginTop: 8,
            padding: 16,
            background: "var(--color-teal-bg)",
            border: "1px solid var(--color-success-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-teal)",
              marginBottom: 10,
            }}
          >
            Top Match
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--color-teal-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--color-teal)",
              }}
            >
              SK
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)" }}>
                Sarah Kim
              </div>
              <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
                Staff Engineer at Stripe
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-success)",
              }}
            >
              <CheckCircle2 size={14} />
              98% match
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Editorial mentor card
function MentorCard({ mentor }: { mentor: MentorListItem }) {
  const name = `${mentor.user.firstName || ""} ${mentor.user.lastName || ""}`.trim() || "Mentor";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={`/mentors/${mentor.id}`}
      style={{
        display: "block",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHovered ? "var(--shadow-lg)" : "var(--shadow-card)",
        borderColor: isHovered ? "var(--color-teal)" : "var(--color-border)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Large photo area */}
      <div
        style={{
          aspectRatio: "4/3",
          background: "linear-gradient(135deg, var(--color-teal-soft) 0%, var(--color-bg) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {mentor.user.avatarUrl ? (
          <img
            src={mentor.user.avatarUrl}
            alt={name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 400ms ease",
              transform: isHovered ? "scale(1.05)" : "scale(1)",
            }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "var(--color-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            {initials}
          </div>
        )}

        {/* Available badge */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.95)",
            padding: "6px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-success)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-success)",
              animation: "pulse 2s infinite",
            }}
          />
          Available
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: 20 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--color-ink)",
            margin: 0,
            fontFamily: "var(--font-display)",
          }}
        >
          {name}
        </h3>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-muted)",
            margin: "4px 0 0",
          }}
        >
          {mentor.headline || mentor.expertise[0] || "Experienced Mentor"}
        </p>

        {/* Hover reveal content */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: isHovered ? 100 : 0,
            opacity: isHovered ? 1 : 0,
            transition: "max-height 300ms ease, opacity 300ms ease, margin-top 300ms ease",
            marginTop: isHovered ? 12 : 0,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--color-ink-2)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {mentor.user.bio?.slice(0, 90) || "Expert guidance for your career journey"}...
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--color-border-soft)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Star
              size={14}
              style={{ color: "var(--color-gold)", fill: "var(--color-gold)" }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-ink)" }}>
              5.0
            </span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>
            ${mentor.hourlyRate || 75}
            <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-muted)" }}>
              /session
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

// Pricing card
function PricingCard({
  title,
  sessions,
  price,
  perSession,
  features,
  popular = false,
}: {
  title: string;
  sessions: number;
  price: number;
  perSession: number;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div
      style={{
        background: popular ? "var(--color-teal)" : "var(--color-surface)",
        border: popular ? "none" : "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: 28,
        position: "relative",
        boxShadow: popular ? "var(--shadow-lg)" : "var(--shadow-card)",
        transform: popular ? "scale(1.02)" : "scale(1)",
      }}
    >
      {popular && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-gold)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "5px 14px",
            borderRadius: "var(--radius-full)",
          }}
        >
          Most Popular
        </div>
      )}

      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: popular ? "rgba(255,255,255,0.7)" : "var(--color-muted)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 40,
            fontWeight: 400,
            color: popular ? "#fff" : "var(--color-ink)",
          }}
        >
          ${price}
        </span>
        <span
          style={{
            fontSize: 14,
            color: popular ? "rgba(255,255,255,0.7)" : "var(--color-muted)",
          }}
        >
          total
        </span>
      </div>

      <div
        style={{
          fontSize: 14,
          color: popular ? "rgba(255,255,255,0.85)" : "var(--color-ink-2)",
          marginBottom: 20,
        }}
      >
        {sessions} sessions · ${perSession}/each
      </div>

      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {features.map((f) => (
          <li
            key={f}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 14,
              color: popular ? "rgba(255,255,255,0.9)" : "var(--color-ink-2)",
              marginBottom: 10,
            }}
          >
            <CheckCircle2
              size={16}
              style={{
                color: popular ? "rgba(255,255,255,0.9)" : "var(--color-success)",
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            {f}
          </li>
        ))}
      </ul>

      <Link
        to="/programs"
        style={{
          display: "block",
          textAlign: "center",
          marginTop: 20,
          padding: "12px 20px",
          borderRadius: "var(--radius-sm)",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          background: popular ? "#fff" : "var(--color-teal)",
          color: popular ? "var(--color-teal)" : "#fff",
          transition: "transform 150ms ease, box-shadow 150ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        View Programs
      </Link>
    </div>
  );
}

export default function Landing() {
  const [mentors, setMentors] = useState<MentorListItem[]>([]);

  useEffect(() => {
    listMentors({ limit: 4 })
      .then((d) => setMentors(d.mentors))
      .catch(() => {});
  }, []);

  return (
    <main style={{ background: "var(--color-bg)" }}>
      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: "85vh",
          display: "flex",
          alignItems: "center",
          paddingTop: 40,
          paddingBottom: 80,
        }}
      >
        <div className="wf-page" style={{ width: "100%" }}>
          <div
            style={{
              maxWidth: 800,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            {/* Eyebrow */}
            <div
              className="hero-enter"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--color-teal-bg)",
                border: "1px solid var(--color-success-border)",
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                marginBottom: 28,
                animationDelay: "100ms",
              }}
            >
              <Sparkles size={14} style={{ color: "var(--color-teal)" }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-teal)" }}>
                AI-powered mentor matching
              </span>
            </div>

            {/* Main headline */}
            <h1
              className="hero-enter"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.75rem, 6vw, 4.25rem)",
                fontWeight: 400,
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                color: "var(--color-ink)",
                margin: 0,
                animationDelay: "200ms",
              }}
            >
              Feeling stuck?
              <br />
              <span style={{ fontStyle: "italic", color: "var(--color-teal)" }}>
                Talk to someone who&apos;s been there.
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="hero-enter"
              style={{
                fontSize: 19,
                lineHeight: 1.6,
                color: "var(--color-ink-2)",
                margin: "24px auto 0",
                maxWidth: 540,
                animationDelay: "300ms",
              }}
            >
              Book 1:1 sessions with industry leaders. Get the clarity, accountability, and insider
              knowledge that moves your career forward.
            </p>

            {/* CTA buttons */}
            <div
              className="hero-enter"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 14,
                marginTop: 36,
                flexWrap: "wrap",
                animationDelay: "400ms",
              }}
            >
              <Link
                to="/mentors"
                className="wf-btn wf-btn-primary"
                style={{
                  padding: "14px 28px",
                  fontSize: 15,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Find Your Mentor
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/register?role=mentor"
                className="wf-btn wf-btn-secondary"
                style={{ padding: "14px 28px", fontSize: 15 }}
              >
                Become a Mentor
              </Link>
            </div>

            {/* Social proof */}
            <div
              className="hero-enter"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                marginTop: 48,
                flexWrap: "wrap",
                animationDelay: "500ms",
              }}
            >
              {/* Avatar stack */}
              <div style={{ display: "flex" }}>
                {["JL", "SK", "MC", "AP", "RK"].map((initials, i) => (
                  <div
                    key={initials}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background:
                        i % 2 === 0 ? "var(--color-teal-soft)" : "var(--color-border-soft)",
                      border: "2.5px solid var(--color-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                      color: i % 2 === 0 ? "var(--color-teal)" : "var(--color-ink-3)",
                      marginLeft: i > 0 ? -12 : 0,
                    }}
                  >
                    {initials}
                  </div>
                ))}
              </div>

              <div
                style={{
                  height: 32,
                  width: 1,
                  background: "var(--color-border)",
                }}
              />

              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--color-ink)",
                  }}
                >
                  <Star
                    size={15}
                    style={{ color: "var(--color-gold)", fill: "var(--color-gold)" }}
                  />
                  4.9 average rating
                </div>
                <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 2 }}>
                  from 38,000+ sessions
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TRUSTED BY LOGOS
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          padding: "32px 0",
          background: "var(--color-surface)",
        }}
      >
        <div className="wf-page">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 40,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-muted)",
              }}
            >
              Mentors from
            </span>
            {["Google", "Meta", "Stripe", "Airbnb", "Netflix", "Spotify"].map((co) => (
              <span
                key={co}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--color-muted)",
                  letterSpacing: "-0.01em",
                }}
              >
                {co}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          AI FEATURES SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          padding: "80px 0",
        }}
      >
        <div className="wf-page">
          <RevealSection>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-teal)",
                  marginBottom: 12,
                }}
              >
                <Zap size={14} />
                AI-Powered
              </div>
              <h2 className="wf-h1" style={{ margin: 0 }}>
                Smarter matching. Faster growth.
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: "var(--color-ink-2)",
                  marginTop: 16,
                  maxWidth: 560,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                Our AI analyzes your goals, experience, and learning style to find mentors who can
                actually help you get where you want to go.
              </p>
            </div>
          </RevealSection>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 48,
              alignItems: "center",
            }}
          >
            {/* Left: AI Demo */}
            <RevealSection delay={100}>
              <AIDemoAnimation />
            </RevealSection>

            {/* Right: Feature list */}
            <RevealSection delay={200}>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {[
                  {
                    icon: Brain,
                    title: "Smart Matching",
                    desc: "AI analyzes 50+ factors to find mentors aligned with your specific goals and career stage.",
                  },
                  {
                    icon: MessageSquare,
                    title: "Session Summaries",
                    desc: "Get AI-generated action items and key takeaways after every session.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Progress Insights",
                    desc: "Track your growth with AI-powered analysis of your goals and milestones.",
                  },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", gap: 16 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-teal-bg)",
                        border: "1px solid var(--color-success-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <f.icon size={22} style={{ color: "var(--color-teal)" }} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          color: "var(--color-ink)",
                          margin: 0,
                        }}
                      >
                        {f.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 14,
                          color: "var(--color-ink-2)",
                          margin: "6px 0 0",
                          lineHeight: 1.55,
                        }}
                      >
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 0" }}>
        <div className="wf-page">
          <RevealSection>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-teal)",
                  marginBottom: 12,
                }}
              >
                Simple Process
              </div>
              <h2 className="wf-h1" style={{ margin: 0 }}>
                How it works
              </h2>
            </div>
          </RevealSection>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 32,
              maxWidth: 1000,
              margin: "0 auto",
            }}
          >
            {[
              {
                step: "01",
                title: "Tell us your goals",
                desc: "Share where you are in your career and where you want to go. Our AI analyzes your profile to understand your unique needs.",
                icon: Target,
              },
              {
                step: "02",
                title: "Get matched",
                desc: "Browse AI-curated mentor recommendations or explore our full directory. Filter by industry, expertise, and availability.",
                icon: Users,
              },
              {
                step: "03",
                title: "Start growing",
                desc: "Book your first session. Get actionable advice, accountability, and a clear path forward from someone who's been there.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <RevealSection key={item.step} delay={i * 100}>
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 32,
                    position: "relative",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 48,
                      fontWeight: 400,
                      color: "var(--color-teal-soft)",
                      lineHeight: 1,
                      marginBottom: 20,
                    }}
                  >
                    {item.step}
                  </div>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-teal-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <item.icon size={22} style={{ color: "var(--color-teal)" }} />
                  </div>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      margin: "0 0 10px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-ink-2)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURED MENTORS
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          padding: "80px 0",
        }}
      >
        <div className="wf-page">
          <RevealSection>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: 40,
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--color-teal)",
                    marginBottom: 10,
                  }}
                >
                  Featured Mentors
                </div>
                <h2 className="wf-h1" style={{ margin: 0 }}>
                  Learn from the best
                </h2>
              </div>
              <Link
                to="/mentors"
                className="wf-btn wf-btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                View all mentors <ArrowRight size={16} />
              </Link>
            </div>
          </RevealSection>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {mentors.length > 0
              ? mentors.map((m, i) => (
                  <RevealSection key={m.id} delay={i * 80}>
                    <MentorCard mentor={m} />
                  </RevealSection>
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <RevealSection key={i} delay={i * 80}>
                    <div
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className="wf-skeleton"
                        style={{ aspectRatio: "4/3" }}
                      />
                      <div style={{ padding: 20 }}>
                        <div
                          className="wf-skeleton wf-skeleton-title"
                          style={{ width: "70%", marginBottom: 8 }}
                        />
                        <div
                          className="wf-skeleton wf-skeleton-text"
                          style={{ width: "50%" }}
                        />
                      </div>
                    </div>
                  </RevealSection>
                ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRICING SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          padding: "80px 0",
        }}
      >
        <div className="wf-page">
          <RevealSection>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-teal)",
                  marginBottom: 12,
                }}
              >
                <Calendar size={14} />
                Program Packages
              </div>
              <h2 className="wf-h1" style={{ margin: 0 }}>
                Invest in your growth
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: "var(--color-ink-2)",
                  marginTop: 16,
                  maxWidth: 540,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                Multi-session programs provide structured guidance and accountability to help you
                reach your goals faster.
              </p>
            </div>
          </RevealSection>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
              maxWidth: 960,
              margin: "0 auto",
            }}
          >
            <RevealSection delay={100}>
              <PricingCard
                title="Starter"
                sessions={2}
                price={150}
                perSession={75}
                features={[
                  "2 one-hour sessions",
                  "Goal setting workshop",
                  "Action plan document",
                  "Email follow-up",
                ]}
              />
            </RevealSection>

            <RevealSection delay={200}>
              <PricingCard
                title="Accelerator"
                sessions={4}
                price={280}
                perSession={70}
                popular
                features={[
                  "4 one-hour sessions",
                  "Bi-weekly check-ins",
                  "AI progress tracking",
                  "Priority scheduling",
                  "Resource library access",
                ]}
              />
            </RevealSection>

            <RevealSection delay={300}>
              <PricingCard
                title="Transformation"
                sessions={8}
                price={520}
                perSession={65}
                features={[
                  "8 one-hour sessions",
                  "Weekly check-ins",
                  "Unlimited messaging",
                  "Career roadmap document",
                  "Interview prep support",
                ]}
              />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--color-teal)", padding: "56px 0" }}>
        <div className="wf-page">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 40,
              textAlign: "center",
            }}
          >
            {[
              { icon: Users, value: 12000, label: "Mentees guided" },
              { icon: Star, value: 1400, label: "Active mentors" },
              { icon: Clock, value: 38000, label: "Sessions completed" },
              { icon: Target, value: 60, label: "Industries covered" },
            ].map((stat) => (
              <div key={stat.label}>
                <stat.icon
                  size={24}
                  style={{ color: "rgba(255,255,255,0.6)", marginBottom: 12 }}
                />
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 38,
                    fontWeight: 400,
                    color: "#fff",
                  }}
                >
                  <AnimatedCounter
                    end={stat.value}
                    duration={2000}
                    suffix="+"
                  />
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.75)",
                    marginTop: 4,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 0" }}>
        <div className="wf-page">
          <RevealSection>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-teal)",
                  marginBottom: 12,
                }}
              >
                <Star size={14} style={{ fill: "var(--color-gold)", color: "var(--color-gold)" }} />
                Success Stories
              </div>
              <h2 className="wf-h1" style={{ margin: 0 }}>
                What mentees are saying
              </h2>
            </div>
          </RevealSection>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
              maxWidth: 1100,
              margin: "0 auto",
            }}
          >
            {[
              {
                quote:
                  "My mentor helped me negotiate a 40% salary increase when switching jobs. The ROI on mentorship is insane.",
                name: "Marcus Chen",
                role: "Senior Engineer → Staff Engineer",
                company: "Stripe",
              },
              {
                quote:
                  "I was stuck at the same level for 3 years. After 4 sessions, I had a clear roadmap and got promoted within 6 months.",
                name: "Priya Sharma",
                role: "Product Manager",
                company: "Airbnb",
              },
              {
                quote:
                  "The AI matching was spot-on. My mentor understood exactly where I was coming from because she'd been there.",
                name: "James Wilson",
                role: "Career Changer → UX Designer",
                company: "Figma",
              },
            ].map((t, i) => (
              <RevealSection key={t.name} delay={i * 100}>
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 28,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Stars */}
                  <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        size={16}
                        style={{ color: "var(--color-gold)", fill: "var(--color-gold)" }}
                      />
                    ))}
                  </div>

                  <blockquote
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      fontStyle: "italic",
                      color: "var(--color-ink)",
                      lineHeight: 1.6,
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    "{t.quote}"
                  </blockquote>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 20,
                      paddingTop: 16,
                      borderTop: "1px solid var(--color-border-soft)",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "var(--color-teal-soft)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--color-teal)",
                      }}
                    >
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--color-ink)",
                        }}
                      >
                        {t.name}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
                        {t.role} · {t.company}
                      </div>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          padding: "80px 0",
        }}
      >
        <div className="wf-page">
          <RevealSection>
            <div
              style={{
                background: "linear-gradient(135deg, var(--color-teal) 0%, var(--color-teal-dark) 100%)",
                borderRadius: "var(--radius-lg)",
                padding: "64px 40px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative circles */}
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  right: -60,
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -40,
                  left: -40,
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.03)",
                }}
              />

              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 4vw, 2.75rem)",
                  fontWeight: 400,
                  color: "#fff",
                  margin: 0,
                  position: "relative",
                }}
              >
                Your next chapter starts
                <br />
                with the right guide.
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: "rgba(255,255,255,0.85)",
                  margin: "20px auto 0",
                  maxWidth: 420,
                  position: "relative",
                }}
              >
                Join free. Browse mentors. Book your first session in minutes.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 14,
                  marginTop: 32,
                  flexWrap: "wrap",
                  position: "relative",
                }}
              >
                <Link
                  to="/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--color-teal)",
                    background: "#fff",
                    padding: "14px 28px",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                    transition: "transform 150ms ease, box-shadow 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Find Your Mentor <ArrowRight size={18} />
                </Link>
                <Link
                  to="/register?role=mentor"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fff",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    padding: "14px 28px",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                  }}
                >
                  Become a Mentor
                </Link>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          padding: "40px 0 32px",
        }}
      >
        <div className="wf-page">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            {/* Logo */}
            <Link
              to="/"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 600,
                color: "var(--color-ink)",
                textDecoration: "none",
              }}
            >
              Mentor<span style={{ fontStyle: "italic", fontWeight: 400 }}>Hub</span>
            </Link>

            {/* Links */}
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { to: "/about", label: "About" },
                { to: "/terms", label: "Terms" },
                { to: "/privacy", label: "Privacy" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    fontSize: 14,
                    color: "var(--color-muted)",
                    textDecoration: "none",
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-ink)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-muted)";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid var(--color-border)",
              fontSize: 13,
              color: "var(--color-muted)",
            }}
          >
            © 2024 MentorHub. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}
