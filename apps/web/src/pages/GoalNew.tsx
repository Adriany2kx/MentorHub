import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createGoal, listMyBookings, generateMicroMilestones, addMilestone } from "../lib/api";
import type { Booking, AiMilestone } from "../lib/api";

export default function GoalNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // AI milestone state
  const [aiMilestones, setAiMilestones] = useState<AiMilestone[]>([]);
  const [selectedMilestones, setSelectedMilestones] = useState<Set<number>>(new Set());
  const [milestoneLoading, setMilestoneLoading] = useState(false);
  const [milestoneError, setMilestoneError] = useState("");

  useEffect(() => {
    listMyBookings()
      .then((d) => setBookings(d.bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED" || b.status === "COMPLETED")))
      .catch(() => {});
  }, []);

  async function handleGenerateMilestones() {
    if (!title.trim()) { setMilestoneError("Enter a goal title first"); return; }
    setMilestoneLoading(true);
    setMilestoneError("");
    try {
      const { milestones } = await generateMicroMilestones({ title: title.trim(), description: description.trim() || undefined });
      setAiMilestones(milestones);
      setSelectedMilestones(new Set(milestones.map((_, i) => i)));
    } catch {
      setMilestoneError("Could not generate milestones — you can add them manually after creating the goal");
    } finally {
      setMilestoneLoading(false);
    }
  }

  function toggleMilestone(index: number) {
    setSelectedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

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
      const goalId = res.goal.id;

      // Create selected AI milestones
      const toCreate = aiMilestones.filter((_, i) => selectedMilestones.has(i));
      if (toCreate.length > 0) {
        await Promise.all(toCreate.map((m) => addMilestone(goalId, m.title).catch(() => null)));
      }

      navigate(`/goals/${goalId}`);
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="wf-card space-y-5">
            <div>
              <label className="wf-label">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Become a Product Manager"
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
                rows={3}
                maxLength={2000}
                className="wf-textarea"
              />
            </div>

            <div>
              <label className="wf-label">
                Target Date{" "}
                <span style={{ color: "var(--color-ink-3)", textTransform: "none", letterSpacing: "normal", fontSize: "9px" }}>(optional)</span>
              </label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="wf-input" />
            </div>

            {bookings.length > 0 && (
              <div>
                <label className="wf-label">
                  Link to Booking{" "}
                  <span style={{ color: "var(--color-ink-3)", textTransform: "none", letterSpacing: "normal", fontSize: "9px" }}>(optional)</span>
                </label>
                <select value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="wf-select">
                  <option value="">None</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>{b.program.title} — {b.status}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* AI Milestones */}
          <div className="wf-card-flush">
            <div className="wf-card-header" style={{ justifyContent: "space-between" }}>
              <span>Milestones</span>
              {aiMilestones.length === 0 && (
                <button
                  type="button"
                  onClick={handleGenerateMilestones}
                  disabled={milestoneLoading || !title.trim()}
                  className="wf-btn wf-btn-secondary"
                  style={{ fontSize: 12, padding: "4px 12px" }}
                >
                  {milestoneLoading ? "Generating…" : "✦ Generate with AI"}
                </button>
              )}
              {aiMilestones.length > 0 && (
                <span className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
                  {selectedMilestones.size}/{aiMilestones.length} selected
                </span>
              )}
            </div>

            {milestoneError && (
              <div className="px-5 py-3">
                <p className="wf-text-xs" style={{ color: "var(--color-ink-2)" }}>{milestoneError}</p>
              </div>
            )}

            {milestoneLoading && (
              <div className="p-5 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
                Breaking your goal into milestones…
              </div>
            )}

            {aiMilestones.length === 0 && !milestoneLoading && !milestoneError && (
              <div className="p-5">
                <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Let AI break your goal into 5–8 specific, ordered milestones based on your skills and target role.
                </p>
              </div>
            )}

            {aiMilestones.length > 0 && (
              <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {aiMilestones.map((m, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors"
                    style={{ background: selectedMilestones.has(i) ? "color-mix(in srgb, var(--color-blue) 4%, transparent)" : "transparent" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMilestones.has(i)}
                      onChange={() => toggleMilestone(i)}
                      className="mt-1 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="wf-text-xs font-bold" style={{ color: "var(--color-ink-3)" }}>
                          Week {m.suggestedWeeks <= 1 ? "1" : `${m.suggestedWeeks}`}
                        </span>
                      </div>
                      <p className="wf-text-sm font-medium">{m.title}</p>
                      {m.description && (
                        <p className="wf-text-xs mt-0.5" style={{ color: "var(--color-ink-2)" }}>{m.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className="wf-error-text">{error}</p>}

          <div className="flex gap-3 pb-8">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="wf-btn wf-btn-primary"
            >
              {submitting ? "Creating…" : aiMilestones.length > 0 && selectedMilestones.size > 0
                ? `Create goal with ${selectedMilestones.size} milestone${selectedMilestones.size > 1 ? "s" : ""}`
                : "Create Goal"}
            </button>
            <Link to="/goals" className="wf-btn wf-btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
