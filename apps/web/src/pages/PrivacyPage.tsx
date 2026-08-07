import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   PRIVACY PAGE — MentorHub
   Clean typography, collapsible sections
   ════════════════════════════════════════════════════════════════ */

const SECTIONS = [
  {
    title: "What we collect",
    content: `We collect your name, email address, and profile information you choose to provide.
For mentors, this includes professional background and areas of expertise. We also
collect session and booking data to provide the service.

We use cookies to keep you logged in and remember your preferences. We do not use
tracking cookies for advertising purposes.`,
  },
  {
    title: "How we use it",
    content: `Your data is used to operate the platform — matching you with mentors, facilitating
bookings, and tracking goals. We do not sell your personal data to third parties.
We do not use it for advertising.

We may use anonymized, aggregated data to improve our matching algorithms and
understand platform usage patterns.`,
  },
  {
    title: "Session privacy",
    content: `Message content between mentors and mentees is private. Your goals, milestones,
and session notes are visible only to you and the mentor you are working with.

Platform administrators may access content only where required to resolve a dispute
or investigate a safety issue. We will notify you if this occurs unless prohibited by law.`,
  },
  {
    title: "Data security",
    content: `We use industry-standard encryption to protect your data in transit and at rest.
Our infrastructure is hosted on secure cloud providers with SOC 2 compliance.

We regularly review our security practices and conduct vulnerability assessments.
In the event of a data breach, we will notify affected users within 72 hours.`,
  },
  {
    title: "Your rights",
    content: `You can request deletion of your account and associated data at any time by
contacting us. We will process deletion requests within 30 days.

You have the right to:
• Access your personal data
• Correct inaccurate data
• Export your data in a portable format
• Object to certain processing activities`,
  },
  {
    title: "Third parties",
    content: `We use the following third-party services:
• Auth0 for authentication
• Stripe for payment processing
• Resend for transactional emails
• Sentry for error monitoring

These providers have their own privacy policies and are contractually bound to
protect your data according to applicable regulations.`,
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      <div className="wf-page" style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
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

        <header style={{ marginBottom: 40 }}>
          <h1 className="wf-h1" style={{ margin: "0 0 8px" }}>
            Privacy Policy
          </h1>
          <p className="wf-text-sm" style={{ color: "var(--color-muted)" }}>
            Last updated August 2026
          </p>
        </header>

        <p className="wf-text" style={{ color: "var(--color-ink-2)", marginBottom: 32, lineHeight: 1.7 }}>
          Your privacy matters. This policy explains what data we collect, how we use it, and your
          rights. We've tried to keep it readable — no legal jargon where plain English works.
        </p>

        {/* Collapsible sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SECTIONS.map((section) => (
            <details
              key={section.title}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  listStyle: "none",
                }}
              >
                {section.title}
                <ChevronDown
                  size={18}
                  style={{
                    color: "var(--color-muted)",
                    transition: "transform 200ms ease",
                  }}
                  className="summary-chevron"
                />
              </summary>
              <div
                style={{
                  padding: "0 20px 20px",
                  color: "var(--color-ink-2)",
                  fontSize: 15,
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                }}
              >
                {section.content}
              </div>
            </details>
          ))}
        </div>

        {/* Contact */}
        <div
          style={{
            marginTop: 48,
            padding: 24,
            background: "var(--color-teal-bg)",
            border: "1px solid var(--color-success-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)", margin: "0 0 8px" }}>
            Questions about privacy?
          </h3>
          <p style={{ fontSize: 14, color: "var(--color-ink-2)", margin: 0 }}>
            Reach us at{" "}
            <a
              href="mailto:privacy@mentorhub.com"
              style={{ color: "var(--color-teal)", fontWeight: 500 }}
            >
              privacy@mentorhub.com
            </a>
            . We'll respond within 48 hours.
          </p>
        </div>
      </div>

      {/* Chevron rotation on open */}
      <style>{`
        details[open] .summary-chevron {
          transform: rotate(180deg);
        }
        details summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </main>
  );
}
