import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-2xl wf-prose">
        <Link to="/" className="text-link wf-text-sm mb-8 inline-block">← Back to home</Link>

        <h1 className="wf-h1 mb-2">Privacy Policy</h1>
        <p className="wf-text-sm mb-8" style={{ color: "var(--color-ink-3)" }}>Last updated April 2026</p>

        <div className="space-y-8" style={{ color: "var(--color-ink-2)", lineHeight: 1.8 }}>
          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>What we collect</h2>
            <p className="wf-text">
              We collect your name, email address, and profile information you choose to provide.
              For mentors, this includes professional background and areas of expertise. We also
              collect session and booking data to provide the service.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>How we use it</h2>
            <p className="wf-text">
              Your data is used to operate the platform — matching you with mentors, facilitating
              bookings, and tracking goals. We do not sell your personal data to third parties.
              We do not use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Session privacy</h2>
            <p className="wf-text">
              Message content between mentors and mentees is private. Your goals, milestones,
              and session notes are visible only to you and the mentor you are working with.
              Platform administrators may access content only where required to resolve a dispute
              or investigate a safety issue.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Your rights</h2>
            <p className="wf-text">
              You can request deletion of your account and associated data at any time by
              contacting us. We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Contact</h2>
            <p className="wf-text">
              Questions about privacy? Reach us at{" "}
              <a href="mailto:privacy@mentorhub.com" className="text-link">privacy@mentorhub.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
