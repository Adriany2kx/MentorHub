import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   TERMS PAGE — MentorHub
   Clean typography, collapsible sections
   ════════════════════════════════════════════════════════════════ */

const SECTIONS = [
  {
    title: "Using MentorHub",
    content: `MentorHub provides a platform connecting mentors and mentees. By creating an account
you agree to use the service honestly and respectfully. You are responsible for the
accuracy of your profile information.

You must be at least 18 years old to use MentorHub. By using the platform, you confirm
that you meet this requirement.`,
  },
  {
    title: "Bookings and payments",
    content: `Session fees are charged at the time of booking. Cancellations made more than 24 hours
before a scheduled session are eligible for a full refund. Late cancellations may be
subject to the mentor's individual cancellation policy.

All payments are processed securely through Stripe. MentorHub does not store your
payment card details directly.`,
  },
  {
    title: "Mentor responsibilities",
    content: `Mentors agree to attend scheduled sessions, maintain professional conduct, and provide
accurate information about their experience and expertise.

MentorHub may remove mentors who receive consistent negative feedback or who violate
platform conduct standards. Mentors are independent contractors, not employees of MentorHub.`,
  },
  {
    title: "Mentee responsibilities",
    content: `Mentees agree to attend scheduled sessions on time and engage respectfully with mentors.
Repeated no-shows may result in account restrictions.

While mentors provide guidance and advice, you are ultimately responsible for your own
career decisions. Mentorship is not a guarantee of specific outcomes.`,
  },
  {
    title: "Prohibited conduct",
    content: `You may not use MentorHub to:
• Harass, threaten, or abuse other users
• Post false credentials or misleading information
• Solicit payments outside the platform
• Share another user's private information without consent
• Engage in any illegal activity

Violations may result in immediate account termination without refund.`,
  },
  {
    title: "Intellectual property",
    content: `Content you create (profile, messages, session notes) remains yours. You grant MentorHub
a license to display this content as needed to operate the platform.

The MentorHub name, logo, and platform design are our trademarks. You may not use them
without written permission.`,
  },
  {
    title: "Limitation of liability",
    content: `MentorHub facilitates introductions and bookings between independent mentors and mentees.
We are not liable for the outcomes of mentoring relationships or the accuracy of advice
provided by mentors.

Our total liability for any claims is limited to the amount you paid us in the 12 months
preceding the claim.`,
  },
  {
    title: "Dispute resolution",
    content: `If you have a dispute with a mentor or another user, contact us first. We'll work to
mediate the issue informally.

Any legal disputes will be resolved through binding arbitration in accordance with the
AAA rules, rather than in court. You waive your right to participate in class actions.`,
  },
  {
    title: "Changes to these terms",
    content: `We may update these terms from time to time. We'll notify you of material changes via
email or a prominent notice on the platform.

Continued use of MentorHub after changes are posted constitutes acceptance of the new
terms. If you disagree, you may close your account.`,
  },
];

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="wf-text-sm" style={{ color: "var(--color-muted)" }}>
            Last updated August 2026
          </p>
        </header>

        <p className="wf-text" style={{ color: "var(--color-ink-2)", marginBottom: 32, lineHeight: 1.7 }}>
          These terms govern your use of MentorHub. By creating an account, you agree to them.
          Please read them carefully — they affect your rights and obligations.
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
            Questions about these terms?
          </h3>
          <p style={{ fontSize: 14, color: "var(--color-ink-2)", margin: 0 }}>
            Contact us at{" "}
            <a
              href="mailto:legal@mentorhub.com"
              style={{ color: "var(--color-teal)", fontWeight: 500 }}
            >
              legal@mentorhub.com
            </a>
            . We're happy to clarify anything.
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
