import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createGoal, listMyBookings } from "../lib/api";
import type { Booking } from "../lib/api";

export default function GoalNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listMyBookings()
      .then((d) => setBookings(d.bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED" || b.status === "COMPLETED")))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        bookingId: bookingId || undefined,
      });
      navigate(`/goals/${res.goal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-160">
        <Link to="/goals" className="text-link wf-text-sm mb-6 inline-block">
          ← Back to goals
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="wf-h1">New Goal</h1>
        </div>

        <form onSubmit={handleSubmit} className="wf-card space-y-5">
          <div>
            <label className="wf-label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master React hooks"
              maxLength={200}
              required
              className="wf-input"
            />
          </div>

          <div>
            <label className="wf-label">
              Description{" "}
              <span style={{ color: "var(--color-ink-3)", textTransform: "none", letterSpacing: "normal", fontSize: "9px" }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you want to achieve?"
              rows={4}
              maxLength={2000}
              className="wf-textarea"
            />
          </div>

          <div>
            <label className="wf-label">
              Target Date{" "}
              <span style={{ color: "var(--color-ink-3)", textTransform: "none", letterSpacing: "normal", fontSize: "9px" }}>(optional)</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="wf-input"
            />
          </div>

          {bookings.length > 0 && (
            <div>
              <label className="wf-label">
                Link to Booking{" "}
                <span style={{ color: "var(--color-ink-3)", textTransform: "none", letterSpacing: "normal", fontSize: "9px" }}>(optional)</span>
              </label>
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="wf-select"
              >
                <option value="">None</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.program.title} — {b.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="wf-error-text">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="wf-btn wf-btn-primary"
            >
              {submitting ? "Creating..." : "Create Goal"}
            </button>
            <Link to="/goals" className="wf-btn wf-btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
