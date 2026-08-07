import { Link } from "react-router-dom";
import { Target, Heart, Shield, Zap, Users, Award } from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   ABOUT PAGE — MentorHub
   Mission statement, values, team grid
   ════════════════════════════════════════════════════════════════ */

const VALUES = [
  {
    icon: Target,
    title: "Purpose-Driven",
    desc: "Every feature exists to help someone grow. No vanity metrics, no engagement hacks.",
  },
  {
    icon: Heart,
    title: "Human First",
    desc: "Technology serves the relationship, not the other way around. Real mentorship, not automation.",
  },
  {
    icon: Shield,
    title: "Trust & Privacy",
    desc: "Your conversations are yours. We never sell data or share content with third parties.",
  },
  {
    icon: Zap,
    title: "Bias to Action",
    desc: "Insights without action are useless. We push for clarity, next steps, and accountability.",
  },
];

const TEAM = [
  { name: "Sarah Chen", role: "Founder & CEO", initials: "SC" },
  { name: "Marcus Williams", role: "CTO", initials: "MW" },
  { name: "Priya Sharma", role: "Head of Product", initials: "PS" },
  { name: "James Okonkwo", role: "Head of Mentor Success", initials: "JO" },
];

export default function AboutPage() {
  return (
    <main style={{ background: "var(--color-bg)" }}>
      {/* Hero */}
      <section
        style={{
          padding: "80px 0 64px",
          textAlign: "center",
        }}
      >
        <div className="wf-page" style={{ maxWidth: 800, margin: "0 auto" }}>
          <Link
            to="/"
            className="wf-text-sm"
            style={{
              color: "var(--color-teal)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 32,
            }}
          >
            ← Back to home
          </Link>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              fontWeight: 400,
              lineHeight: 1.1,
              color: "var(--color-ink)",
              margin: "0 0 24px",
            }}
          >
            We believe the best career advice
            <br />
            <span style={{ fontStyle: "italic", color: "var(--color-teal)" }}>
              comes from someone who's been there.
            </span>
          </h1>

          <p
            className="wf-text"
            style={{
              color: "var(--color-ink-2)",
              maxWidth: 560,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            MentorHub connects professionals with experienced mentors who understand their
            journey — because they've walked it themselves.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          padding: "64px 0",
        }}
      >
        <div className="wf-page" style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 48,
              alignItems: "center",
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
                  marginBottom: 12,
                }}
              >
                Our Mission
              </div>
              <h2 className="wf-h2" style={{ margin: "0 0 16px" }}>
                Make world-class mentorship accessible to everyone
              </h2>
              <p className="wf-text" style={{ color: "var(--color-ink-2)", lineHeight: 1.7 }}>
                Career success shouldn't depend on who you know or where you went to school.
                We're building a platform where anyone can access the guidance they need to
                reach their potential.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16,
              }}
            >
              {[
                { value: "12K+", label: "Mentees guided" },
                { value: "1,400+", label: "Active mentors" },
                { value: "60+", label: "Industries" },
                { value: "4.9", label: "Avg rating" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 400,
                      color: "var(--color-ink)",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: "80px 0" }}>
        <div className="wf-page">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
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
              What We Stand For
            </div>
            <h2 className="wf-h1" style={{ margin: 0 }}>
              Our values
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 24,
              maxWidth: 1000,
              margin: "0 auto",
            }}
          >
            {VALUES.map((v) => (
              <div
                key={v.title}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: 28,
                }}
              >
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
                  <v.icon size={22} style={{ color: "var(--color-teal)" }} />
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: "var(--color-ink)",
                    margin: "0 0 8px",
                  }}
                >
                  {v.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--color-ink-2)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          padding: "80px 0",
        }}
      >
        <div className="wf-page">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
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
              <Users size={14} />
              The Team
            </div>
            <h2 className="wf-h1" style={{ margin: 0 }}>
              Built by people who care
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 24,
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            {TEAM.map((t) => (
              <div key={t.name} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "var(--color-teal-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 600,
                    color: "var(--color-teal)",
                    margin: "0 auto 16px",
                    border: "2px solid var(--color-teal-bg)",
                  }}
                >
                  {t.initials}
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--color-ink)",
                    margin: "0 0 4px",
                  }}
                >
                  {t.name}
                </h3>
                <p style={{ fontSize: 13, color: "var(--color-muted)", margin: 0 }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 0" }}>
        <div className="wf-page" style={{ textAlign: "center" }}>
          <h2 className="wf-h2" style={{ margin: "0 0 16px" }}>
            Ready to start your journey?
          </h2>
          <p className="wf-text" style={{ color: "var(--color-ink-2)", marginBottom: 28 }}>
            Join thousands of professionals growing with MentorHub.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to="/mentors" className="wf-btn wf-btn-primary">
              Browse Mentors
            </Link>
            <Link to="/register" className="wf-btn wf-btn-secondary">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
