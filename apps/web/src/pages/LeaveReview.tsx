import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Check } from "lucide-react";
import { getBooking, createReview } from "../lib/api";
import type { Booking } from "../lib/api";
import StarRating from "../components/StarRating";
import LoadingState from "../components/LoadingState";

export default function LeaveReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBooking(id)
      .then((d) => setBooking(d.booking))
      .catch((err) => setError(err instanceof Error ? err.message : "Booking not found"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!booking || rating === 0) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await createReview({
        bookingId: booking.id,
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      setSubmitted(true);
      setTimeout(() => navigate(`/bookings/${booking.id}`, { replace: true }), 1800);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState title="Loading booking review" message="Pulling session details before you leave feedback." maxWidthClassName="max-w-160" />;
  }

  if (error || !booking) {
    return (
      <div className="wf-page max-w-160 text-center">
        <p className="wf-text mb-4" style={{ color: "var(--color-error)" }}>{error || "Booking not found"}</p>
        <Link to="/bookings" className="text-link wf-text-sm">← Back to bookings</Link>
      </div>
    );
  }

  if (booking.status !== "COMPLETED") {
    return (
      <div className="wf-page max-w-160 text-center">
        <p className="wf-text-sm mb-4">Reviews can only be left after a booking is completed.</p>
        <Link to={`/bookings/${booking.id}`} className="text-link wf-text-sm">← Back to booking</Link>
      </div>
    );
  }

  const mentorName =
    [booking.mentor.user.firstName, booking.mentor.user.lastName].filter(Boolean).join(" ") || "Mentor";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-160">
        <Link to={`/bookings/${id}`} className="text-link wf-text-sm mb-6 inline-block">
          ← Back to booking
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="wf-h1">Leave a Review</h1>
        </div>

        <p className="wf-text-sm mb-6">
          Share your experience with <span className="font-semibold" style={{ color: "var(--color-ink)" }}>{mentorName}</span> for{" "}
          <span className="font-semibold" style={{ color: "var(--color-ink)" }}>{booking.program.title}</span>
        </p>

        <form onSubmit={handleSubmit} className="wf-card space-y-5">
          {/* Star rating */}
          <div>
            <label className="wf-label">Your Rating</label>
            <div className="flex items-center gap-3 mt-1">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <span
                className="wf-text-sm transition-opacity"
                style={{
                  color: "var(--color-ink-2)",
                  opacity: rating > 0 ? 1 : 0.5,
                  minWidth: 120,
                }}
              >
                {rating === 0 && "Tap a star to rate"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Below average"}
                {rating === 3 && "Good"}
                {rating === 4 && "Great"}
                {rating === 5 && "Outstanding"}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="wf-label">
              Title <span className="normal-case" style={{ letterSpacing: "normal", textTransform: "none", fontSize: "9px", color: "var(--color-ink-3)" }}>(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={200}
              className="wf-input"
            />
          </div>

          {/* Content */}
          <div>
            <label className="wf-label">Review</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What was your experience like? What did you learn?"
              rows={5}
              maxLength={2000}
              required
              className="wf-textarea"
            />
            <p className="wf-text-xs text-right mt-1">{content.length}/2000</p>
          </div>

          {submitError && <p className="wf-error-text">{submitError}</p>}

          {submitted ? (
            <div
              className="wf-success-banner flex items-center gap-3 rounded-xl px-5 py-4"
              style={{ background: "var(--color-blue)", color: "#fff" }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.18)" }}>
                <Check size={14} style={{ color: "#fff" }} />
              </div>
              <div>
                <p className="font-semibold" style={{ fontSize: 15 }}>Review submitted — thank you.</p>
                <p style={{ fontSize: 13, opacity: 0.85 }}>Your feedback helps future mentees make better decisions.</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || rating === 0 || !content.trim()}
                className="wf-btn wf-btn-primary"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
              <Link
                to={`/bookings/${id}`}
                className="wf-btn wf-btn-secondary"
              >
                Cancel
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
