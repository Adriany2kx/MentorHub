import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProgram } from "../lib/api";
import type { Program } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  function loadProgram() {
    if (!id) return;
    setIsLoading(true);
    setError("");
    getProgram(id)
      .then((d) => setProgram(d.program))
      .catch((err) => setError(err instanceof Error ? err.message : "Program not found"))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadProgram();
  }, [id]);

  if (isLoading) {
    return <LoadingState title="Loading program details" message="Getting curriculum, mentor info, and pricing." maxWidthClassName="max-w-xl" />;
  }

  if (error || !program) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page py-10 text-center">
          <h1 className="wf-h2 mb-4">Program Not Found</h1>
          <div className="flex flex-wrap justify-center gap-3">
            <button className="wf-btn wf-btn-primary" onClick={loadProgram}>Retry</button>
            <Link to="/programs" className="wf-btn wf-btn-secondary">← Back to programs</Link>
          </div>
        </div>
      </div>
    );
  }

  const price = parseFloat(program.price);
  const mentor = program.mentor;
  const mentorName = mentor
    ? [mentor.user.firstName, mentor.user.lastName].filter(Boolean).join(" ") || "Mentor"
    : "Mentor";
  const totalHours = Math.round(program.duration * program.sessionCount / 60 * 10) / 10;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page py-10">
        <Link to="/programs" className="text-link wf-text-sm mb-8 inline-block">
          ← Back to programs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Title + meta + description */}
            <div>
              <h1 className="wf-h1 mb-2" style={{ viewTransitionName: `program-title-${program.id}` }}>{program.title}</h1>

              {/* Inline meta */}
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-1 wf-text-sm mb-4"
                style={{ color: "var(--color-ink-2)" }}
              >
                <span>
                  <span style={{ fontWeight: 500, color: "var(--color-ink)" }}>
                    {program.sessionCount}
                  </span>{" "}
                  session{program.sessionCount !== 1 ? "s" : ""}
                </span>
                <span>
                  <span style={{ fontWeight: 500, color: "var(--color-ink)" }}>
                    {program.duration}
                  </span>{" "}
                  min each
                </span>
                <span>
                  <span style={{ fontWeight: 500, color: "var(--color-ink)" }}>
                    {totalHours}h
                  </span>{" "}
                  total
                </span>
                {program.maxParticipants && (
                  <span>up to {program.maxParticipants} participants</span>
                )}
              </div>

              {program.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {program.topics.map((topic) => (
                    <span key={topic} className="wf-tag">{topic}</span>
                  ))}
                </div>
              )}

              {program.description && (
                <p className="wf-text wf-copy whitespace-pre-wrap" style={{ color: "var(--color-ink-2)", lineHeight: 1.75 }}>
                  {program.description}
                </p>
              )}
            </div>

            {/* Mentor */}
            {mentor && (
              <section>
                <h2 className="wf-h2 mb-4">Your Mentor</h2>
                <Link
                  to={`/mentors/${mentor.id}`}
                  className="wf-card p-5 flex items-center gap-4 hover:opacity-90 transition-opacity"
                  style={{ textDecoration: "none" }}
                >
                  <div className="wf-avatar wf-avatar-md shrink-0 overflow-hidden">
                    {mentor.user.avatarUrl ? (
                      <img src={mentor.user.avatarUrl} alt={mentorName} className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ color: "var(--color-blue)", fontWeight: 700 }}>
                        {mentorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="wf-text font-semibold" style={{ color: "var(--color-ink)" }}>{mentorName}</p>
                    {mentor.headline && (
                      <p className="wf-text-sm mt-0.5" style={{ color: "var(--color-ink-2)" }}>{mentor.headline}</p>
                    )}
                  </div>
                </Link>
              </section>
            )}
          </div>

          {/* ── Booking sidebar ── */}
          <div>
            <div
              className="wf-card p-6"
              style={{ position: "sticky", top: "calc(var(--topnav-height) + 16px)" }}
            >
              <div className="text-center mb-6">
                {price === 0 ? (
                  <p className="wf-h1" style={{ color: "var(--color-success)" }}>Free</p>
                ) : (
                  <p className="wf-h1" style={{ viewTransitionName: `program-price-${program.id}` }}>${price}</p>
                )}
                <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
                  {program.sessionCount} session{program.sessionCount !== 1 ? "s" : ""} included
                </p>
              </div>

              {user ? (
                <Link
                  to={`/programs/${program.id}/book`}
                  className="wf-btn wf-btn-primary block w-full text-center"
                >
                  Book Program
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="wf-btn wf-btn-primary block w-full text-center"
                >
                  Sign Up to Book
                </Link>
              )}

              <p className="wf-text-xs text-center mt-3" style={{ color: "var(--color-ink-3)" }}>
                No commitment required
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
