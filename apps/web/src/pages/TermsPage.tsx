import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-2xl wf-prose">
        <Link to="/" className="text-link wf-text-sm mb-8 inline-block">← Back to home</Link>

        <h1 className="wf-h1 mb-2">Terms of Service</h1>
        <p className="wf-text-sm mb-8" style={{ color: "var(--color-ink-3)" }}>Last updated April 2026</p>

        <div className="space-y-8" style={{ color: "var(--color-ink-2)", lineHeight: 1.8 }}>
          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Using MentorHub</h2>
            <p className="wf-text">
              MentorHub provides a platform connecting mentors and mentees. By creating an account
              you agree to use the service honestly and respectfully. You are responsible for the
              accuracy of your profile information.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Bookings and payments</h2>
            <p className="wf-text">
              Session fees are charged at the time of booking. Cancellations made more than 24 hours
              before a scheduled session are eligible for a full refund. Late cancellations may be
              subject to the mentor's individual cancellation policy.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Mentor responsibilities</h2>
            <p className="wf-text">
              Mentors agree to attend scheduled sessions, maintain professional conduct, and provide
              accurate information about their experience and expertise. MentorHub may remove mentors
              who receive consistent negative feedback or who violate platform conduct standards.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Prohibited conduct</h2>
            <p className="wf-text">
              You may not use MentorHub to harass others, post false credentials, solicit payments
              outside the platform, or share another user's private information without consent.
              Violations may result in immediate account termination.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Limitation of liability</h2>
            <p className="wf-text">
              MentorHub facilitates introductions and bookings between independent mentors and mentees.
              We are not liable for the outcomes of mentoring relationships or the accuracy of advice
              provided by mentors.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Changes to these terms</h2>
            <p className="wf-text">
              We may update these terms from time to time. Continued use of MentorHub after changes
              are posted constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="wf-h3 mb-3" style={{ color: "var(--color-ink)" }}>Contact</h2>
            <p className="wf-text">
              Questions about these terms? Contact us at{" "}
              <a href="mailto:legal@mentorhub.com" className="text-link">legal@mentorhub.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
