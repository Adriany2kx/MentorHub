import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getMentor, getMentorReviews, getCompatibilityScore } from "../lib/api";
import type { MentorDetail as MentorDetailType, Review, AiCompatibilityScore } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ProgramCard from "../components/ProgramCard";
import ReviewCard from "../components/ReviewCard";
import StarRating from "../components/StarRating";
import LoadingState from "../components/LoadingState";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function MentorDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<MentorDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [compatibility, setCompatibility] = useState<AiCompatibilityScore | null>(null);

  function loadMentor() {
    if (!id) return;
    setIsLoading(true);
    setError("");
    getMentor(id)
      .then((d) => setMentor(d.mentor))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load mentor"))
      .finally(() => setIsLoading(false));

    getMentorReviews(id)
      .then((d) => {
        setReviews(d.reviews);
        setAvgRating(d.averageRating);
        setTotalReviews(d.totalReviews);
      })
      .catch(() => {});

    if (user?.role === "MENTEE") {
      getCompatibilityScore(id).then(setCompatibility).catch(() => {});
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMentor();
  }, [id]);

  if (isLoading) {
    return <LoadingState title="Loading mentor profile" message="Pulling expertise, availability, and programs." maxWidthClassName="max-w-xl" />;
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page py-10 text-center">
          <h1 className="wf-h2 mb-3">Mentor not found</h1>
          <p className="wf-text mb-5" style={{ color: "var(--color-ink-2)" }}>{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button className="wf-btn wf-btn-primary" onClick={loadMentor}>Retry</button>
            <Link to="/mentors" className="wf-btn wf-btn-secondary">← Back to mentors</Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    [mentor.user.firstName, mentor.user.lastName].filter(Boolean).join(" ") || "Mentor";
  const firstName = displayName.split(" ")[0];
  const hourlyRate = mentor.hourlyRate ? parseFloat(mentor.hourlyRate) : null;

  const availByDay = DAYS.map((_day, i) =>
    mentor.availability.filter((a) => a.dayOfWeek === i)
  );
  const hasAvailability = mentor.availability.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page py-10">
        <Link
          to="/mentors"
          className="text-link wf-text-sm mb-8 inline-block"
        >
          ← Back to mentors
        </Link>

        {/* ── Profile card — ONE card, everything about the person ── */}
        <div className="wf-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="wf-avatar wf-avatar-lg shrink-0 overflow-hidden" style={{ viewTransitionName: `mentor-avatar-${mentor.id}` }}>
              {mentor.user.avatarUrl ? (
                <img
                  src={mentor.user.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span style={{ fontSize: 28, fontWeight: 700, color: "var(--color-blue)" }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Identity + meta + bio + skills */}
            <div className="flex-1 min-w-0">
              <h1 className="wf-h1 mb-1" style={{ viewTransitionName: `mentor-name-${mentor.id}` }}>{displayName}</h1>

              {mentor.headline && (
                <p className="wf-text mb-3" style={{ color: "var(--color-ink-2)" }}>
                  {mentor.headline}
                </p>
              )}

              {compatibility && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: compatibility.score >= 70 ? "var(--color-success-bg, #d1fae5)" : compatibility.score >= 45 ? "var(--color-warn-bg, #fef3c7)" : "var(--color-error-bg, #fee2e2)",
                      color: compatibility.score >= 70 ? "var(--color-success, #065f46)" : compatibility.score >= 45 ? "var(--color-warn, #92400e)" : "var(--color-error, #991b1b)",
                    }}
                  >
                    {compatibility.score}% compatibility
                  </span>
                  <span className="wf-text-xs" style={{ color: "var(--color-ink-2)" }} title={`Expertise: ${compatibility.breakdown.expertiseOverlap}% · Goals: ${compatibility.breakdown.goalAlignment}% · Same timezone: ${compatibility.breakdown.timezoneMatch ? "Yes" : "No"}`}>
                    {compatibility.explanation}
                  </span>
                </div>
              )}

              {/* Inline meta — no stat boxes */}
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-1 wf-text-sm"
                style={{ color: "var(--color-ink-2)" }}
              >
                {hourlyRate !== null && (
                  <span style={{ fontWeight: 500, color: "var(--color-ink)" }}>
                    ${hourlyRate}<span style={{ fontWeight: 400, color: "var(--color-ink-2)" }}>/hr</span>
                  </span>
                )}
                {mentor.yearsExperience !== null && (
                  <span>{mentor.yearsExperience} years experience</span>
                )}
                {totalReviews > 0 && avgRating !== null && (
                  <span className="flex items-center gap-1.5">
                    <StarRating value={Math.round(avgRating)} readonly size="sm" />
                    <span>
                      {avgRating.toFixed(1)}
                      <span style={{ color: "var(--color-ink-3)" }}>
                        {" "}({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    </span>
                  </span>
                )}
              </div>

              {/* Bio — inline, no separate card */}
              {mentor.user.bio && (
                <p className="wf-text wf-copy mt-4" style={{ color: "var(--color-ink-2)", lineHeight: 1.75 }}>
                  {mentor.user.bio}
                </p>
              )}

              {/* Expertise tags — inline below bio */}
              {mentor.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {mentor.expertise.map((skill) => (
                    <span key={skill} className="wf-tag">{skill}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: programs + reviews */}
          <div className="lg:col-span-2 space-y-12">

            {/* Programs */}
            {mentor.programs.length > 0 && (
              <section id="mentor-programs">
                <h2 className="wf-h2 mb-1">Programs</h2>
                <p
                  className="wf-text-sm mb-5"
                  style={{ color: "var(--color-ink-2)" }}
                >
                  Structured sessions with {firstName}, built around your goals.
                </p>
                <div className="space-y-3">
                  {mentor.programs.map((program) => (
                    <ProgramCard key={program.id} program={program} showMentor={false} />
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <div className="flex items-baseline gap-3 mb-5">
                <h2 className="wf-h2">Reviews</h2>
                {totalReviews > 0 && avgRating !== null && (
                  <span className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                    {avgRating.toFixed(1)} · {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                  </span>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
                  No reviews yet. Be the first to work with {firstName}.
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right rail: CTA + availability */}
          <div className="space-y-6">

            {/* Booking CTA */}
            <div
              className="wf-card p-5"
              style={{ position: "sticky", top: "calc(var(--topnav-height) + 16px)" }}
            >
              <p className="wf-text font-semibold mb-0.5">
                Work with {firstName}
              </p>
              {hourlyRate !== null && (
                <p className="wf-text-sm mb-4" style={{ color: "var(--color-ink-2)" }}>
                  ${hourlyRate} per hour
                </p>
              )}

              {mentor.programs.length > 0 ? (
                <a
                  href="#mentor-programs"
                  className="wf-btn wf-btn-primary w-full text-center block"
                >
                  View programs
                </a>
              ) : (
                <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
                  {firstName} hasn't posted any programs yet.{" "}
                  <Link to="/mentors" className="text-link">Browse other mentors</Link>.
                </p>
              )}

              {/* Availability inside CTA card — keeps the rail compact */}
              {hasAvailability && (
                <>
                  <div
                    style={{ borderTop: "1px solid var(--color-border)", margin: "16px 0 12px" }}
                  />
                  <p className="wf-text-xs font-medium mb-2" style={{ color: "var(--color-ink-3)" }}>
                    TYPICALLY AVAILABLE
                  </p>
                  <div className="space-y-1.5">
                    {availByDay.map((slots, dayIndex) =>
                      slots.length > 0 ? (
                        <div key={dayIndex} className="flex items-start gap-3">
                          <span
                            className="wf-text-xs font-medium shrink-0"
                            style={{ color: "var(--color-ink)", width: 28 }}
                          >
                            {DAYS[dayIndex].slice(0, 3)}
                          </span>
                          <div>
                            {slots.map((slot) => (
                              <div
                                key={slot.id}
                                className="wf-text-xs"
                                style={{ color: "var(--color-ink-2)" }}
                              >
                                {slot.startTime}–{slot.endTime}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
