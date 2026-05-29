import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listGoals, deleteGoal, createGoal, listMyBookings } from "../lib/api";
import type { Goal, GoalStatus, Booking } from "../lib/api";
import GoalCard from "../components/GoalCard";
import GoalProgressBar from "../components/GoalProgressBar";
import { useToast } from "../context/ToastContext";

const STATUS_FILTERS: { label: string; value: GoalStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Not Started", value: "NOT_STARTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "On Hold", value: "ON_HOLD" },
];

export default function Goals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<GoalStatus | "ALL">("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listGoals(filter === "ALL" ? undefined : filter)
      .then((d) => setGoals(d.goals))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (!showCreateModal) return;
    setLoadingBookings(true);
    listMyBookings()
      .then((d) => {
        setBookings(d.bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED" || b.status === "COMPLETED"));
      })
      .catch(() => {
        setBookings([]);
      })
      .finally(() => setLoadingBookings(false));
  }, [showCreateModal]);

  useEffect(() => {
    if (!showCreateModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCreateModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showCreateModal]);

  function openCreateModal() {
    setCreateError("");
    setTitle("");
    setDescription("");
    setTargetDate("");
    setBookingId("");
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (submitting) return;
    setShowCreateModal(false);
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setCreateError("");
    try {
      const res = await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        bookingId: bookingId || undefined,
      });
      setShowCreateModal(false);
      toast("Goal created.", "success");
      navigate(`/goals/${res.goal.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      toast("Press delete again to confirm", "warning");
      setTimeout(() => {
        setDeleteConfirmId((current) => (current === id ? null : current));
      }, 5000);
      return;
    }

    try {
      await deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setDeleteConfirmId(null);
      toast("Goal deleted", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete goal", "error");
    }
  }

  // Stats
  const total = goals.length;
  const completed = goals.filter((g) => g.status === "COMPLETED").length;
  const inProgress = goals.filter((g) => g.status === "IN_PROGRESS").length;
  const avgProgress = total > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / total) : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="wf-h1">My Goals</h1>
          <button type="button" onClick={openCreateModal} className="wf-btn wf-btn-primary min-h-11">
            + New Goal
          </button>
        </div>

        {/* Stats */}
        {total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="wf-stat">
              <div className="wf-stat-label">Total Goals</div>
              <div className="wf-stat-value">{total}</div>
            </div>
            <div className="wf-stat">
              <div className="wf-stat-label">In Progress</div>
              <div className="wf-stat-value">{inProgress}</div>
            </div>
            <div className="wf-stat">
              <div className="wf-stat-label">Completed</div>
              <div className="wf-stat-value">{completed}</div>
            </div>
            <div className="wf-stat">
              <div className="wf-stat-label">Avg Progress</div>
              <div className="wf-stat-value">{avgProgress}%</div>
              <div className="mt-2">
                <GoalProgressBar progress={avgProgress} showLabel={false} size="sm" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="wf-card-flush p-4 mb-6">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <p className="wf-eyebrow">Filter goals</p>
            <p className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
              {total > 0 ? `${total} goal${total !== 1 ? "s" : ""}` : "No goals yet"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`wf-tag ${filter === f.value ? "wf-tag-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Goal list */}
        {loading ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
              <span className="wf-loading-spinner" aria-hidden="true" />
              <span>Loading goals...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="wf-card p-5 space-y-3">
                  <div className="wf-skeleton h-4 w-1/2" />
                  <div className="wf-skeleton h-2.5 w-full" />
                  <div className="wf-skeleton h-2.5 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ) : goals.length === 0 ? (
          <div className="wf-empty">
            <p className="wf-empty-title">
              {filter === "ALL" ? "No goals yet" : `No ${filter.toLowerCase().replace("_", " ")} goals`}
            </p>
            {filter === "ALL" ? (
              <>
                <p className="wf-empty-text">
                  Goals help you stay accountable and track your progress with your mentor. Set your first milestone — even something small.
                </p>
                <button type="button" onClick={openCreateModal} className="wf-btn wf-btn-secondary mt-4 min-h-11">
                  Set a goal
                </button>
              </>
            ) : (
              <p className="wf-empty-text">
                No goals with this status. <button className="text-link" onClick={() => setFilter("ALL")}>View all goals</button>
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {showCreateModal && (
          <div
            className="wf-modal-overlay"
            onClick={closeCreateModal}
            role="presentation"
          >
            <div
              className="wf-card wf-modal-panel max-w-3xl max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Create new goal"
            >
              <div className="flex items-start sm:items-center justify-between gap-4 pb-4 mb-5 border-b" style={{ borderBottomColor: "var(--color-border)" }}>
                <div>
                  <h2 className="wf-h2">Create Goal</h2>
                  <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
                    Set one clear outcome and track momentum over time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="wf-btn wf-btn-secondary min-h-11"
                  aria-label="Close create goal modal"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-5">
                <div>
                  <label htmlFor="goal-title" className="wf-label mb-2 block">Title</label>
                  <input
                    id="goal-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Example: Lead my first architecture review confidently"
                    maxLength={200}
                    required
                    className="wf-input w-full min-h-11"
                  />
                  <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>{title.length}/200</p>
                </div>

                <div>
                  <label htmlFor="goal-description" className="wf-label mb-2 block">Description (optional)</label>
                  <textarea
                    id="goal-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what success looks like and how you'll measure it."
                    rows={4}
                    maxLength={2000}
                    className="wf-textarea w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="goal-target-date" className="wf-label mb-2 block">Target Date (optional)</label>
                    <input
                      id="goal-target-date"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="wf-input w-full min-h-11"
                    />
                  </div>

                  <div>
                    <label htmlFor="goal-booking" className="wf-label mb-2 block">Link to Session (optional)</label>
                    <select
                      id="goal-booking"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                      className="wf-select w-full min-h-11"
                      disabled={loadingBookings}
                    >
                      <option value="">No linked session</option>
                      {bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.program.title} — {b.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {createError && <p className="wf-error-text">{createError}</p>}

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t" style={{ borderTopColor: "var(--color-border)" }}>
                  <button
                    type="submit"
                    disabled={submitting || !title.trim()}
                    className="wf-btn wf-btn-primary w-full sm:w-auto min-h-11"
                  >
                    {submitting ? "Creating..." : "Create Goal"}
                  </button>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="wf-btn wf-btn-secondary w-full sm:w-auto min-h-11"
                    disabled={submitting}
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
