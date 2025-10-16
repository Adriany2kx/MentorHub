import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-2xl wf-prose">
        <Link to="/" className="text-link wf-text-sm mb-8 inline-block">← Back to home</Link>

        <h1 className="wf-h1 mb-4">About MentorHub</h1>
        <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)", lineHeight: 1.8 }}>
          MentorHub connects early-career professionals with experienced mentors who have
          walked the path they're trying to walk. We believe the fastest way to grow is to
          learn from someone who has already been there.
        </p>
        <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)", lineHeight: 1.8 }}>
          Every mentor on the platform is reviewed before they can accept bookings. We don't
          auto-approve. We read profiles, check credentials, and assess communication quality —
          because your time and trust matter.
        </p>
        <p className="wf-text mb-10" style={{ color: "var(--color-ink-2)", lineHeight: 1.8 }}>
          Sessions are private. Your goals stay between you and your mentor. There's no
          minimum commitment — book once, or build a long-term relationship. Either is fine.
        </p>

        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: 32,
            display: "flex",
            gap: 12,
          }}
        >
          <Link to="/mentors" className="wf-btn wf-btn-primary">Browse mentors</Link>
          <Link to="/register" className="wf-btn wf-btn-secondary">Get started free</Link>
        </div>
      </div>
    </div>
  );
}
