import { useState } from "react";
import type { Review } from "../lib/api";
import { respondToReview } from "../lib/api";
import StarRating from "./StarRating";

interface ReviewCardProps {
  review: Review;
  isMentor?: boolean;
  onResponded?: (updated: Review) => void;
}

export default function ReviewCard({ review, isMentor = false, onResponded }: ReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const menteeName = [review.mentee.firstName, review.mentee.lastName].filter(Boolean).join(" ") || "Mentee";

  async function handleRespond(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await respondToReview(review.id, response.trim());
      onResponded?.(res.review);
      setShowResponseForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="wf-card">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="wf-avatar wf-avatar-sm">
          {review.mentee.avatarUrl ? (
            <img src={review.mentee.avatarUrl} alt={menteeName} className="w-full h-full object-cover" />
          ) : (
            <span>{menteeName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="wf-text font-semibold" style={{ color: "var(--color-ink)" }}>{menteeName}</p>
          <p className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>{new Date(review.createdAt).toLocaleDateString()}</p>
        </div>
        <StarRating value={review.rating} readonly size="sm" />
      </div>

      {review.title && <h3 className="wf-h3 mb-2">{review.title}</h3>}
      <p className="wf-text-sm whitespace-pre-wrap" style={{ color: "var(--color-ink-2)" }}>{review.content}</p>

      {/* Mentor Response */}
      {review.response && (
        <div className="mt-4 p-3 border-l-2" style={{ background: "var(--color-bg)", borderColor: "var(--color-ink)" }}>
          <p className="wf-eyebrow mb-1">Mentor response</p>
          <p className="wf-text-sm whitespace-pre-wrap" style={{ color: "var(--color-ink-2)" }}>{review.response}</p>
        </div>
      )}

      {/* Respond button (mentor only, no existing response) */}
      {isMentor && !review.response && !showResponseForm && (
        <button
          onClick={() => setShowResponseForm(true)}
          className="mt-3 wf-btn wf-btn-link"
        >
          Respond to this review
        </button>
      )}

      {showResponseForm && (
        <form onSubmit={handleRespond} className="mt-3 space-y-2">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your response..."
            rows={3}
            maxLength={2000}
            className="wf-textarea"
          />
          {error && <p className="wf-error-text">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !response.trim()}
              className="wf-btn wf-btn-primary"
            >
              {isSubmitting ? "Saving..." : "Post Response"}
            </button>
            <button
              type="button"
              onClick={() => setShowResponseForm(false)}
              className="wf-btn wf-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
