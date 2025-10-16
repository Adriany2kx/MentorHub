import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getGoal, updateGoal, deleteGoal, addMilestone, toggleMilestone } from "../lib/api";
import type { Goal, GoalStatus } from "../lib/api";
import GoalProgressBar from "../components/GoalProgressBar";
import { useToast } from "../context/ToastContext";
import LoadingState from "../components/LoadingState";

const STATUS_OPTIONS: { label: string; value: GoalStatus }[] = [
  { label: "Not Started", value: "NOT_STARTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "On Hold", value: "ON_HOLD" },
];

const STATUS_BADGE: Record<string, string> = {
  NOT_STARTED: "wf-badge wf-badge-neutral",
  IN_PROGRESS: "wf-badge wf-badge-warn",
  COMPLETED: "wf-badge wf-badge-success",
  ON_HOLD: "wf-badge wf-badge-warn",
};

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<GoalStatus>("NOT_STARTED");
  const [editProgress, setEditProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  // Milestone state
  const [newMilestone, setNewMilestone] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [poppedMilestone, setPoppedMilestone] = useState<string | null>(null);

  // Delight state
  const [showGoalCompleted, setShowGoalCompleted] = useState(false);
  const [deleteConfirmArmed, setDeleteConfirmArmed] = useState(false);

  useEffect(() => {
    if (!id) return;
    getGoal(id)
      .then((d) => {
        setGoal(d.goal);
        populateEdit(d.goal);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Goal not found"))
      .finally(() => setLoading(false));
  }, [id]);

  function populateEdit(g: Goal) {
    setEditTitle(g.title);
    setEditDesc(g.description ?? "");
    setEditDate(g.targetDate ? g.targetDate.slice(0, 10) : "");
    setEditStatus(g.status);
    setEditProgress(g.progress);
  }

  async function handleSave() {
    if (!goal) return;
    setSaving(true);
    try {
      const wasNotCompleted = goal.status !== "COMPLETED";
      const res = await updateGoal(goal.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        targetDate: editDate ? new Date(editDate).toISOString() : null,
        status: editStatus,
        progress: editProgress,
      });
      setGoal(res.goal);
      setEditing(false);
      if (wasNotCompleted && editStatus === "COMPLETED") {
        setShowGoalCompleted(true);
        setTimeout(() => setShowGoalCompleted(false), 5000);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!goal) return;

    if (!deleteConfirmArmed) {
      setDeleteConfirmArmed(true);
      toast("Press delete again to confirm goal removal", "warning");
      setTimeout(() => setDeleteConfirmArmed(false), 5000);
      return;
    }

    try {
      await deleteGoal(goal.id);
      toast("Goal deleted", "success");
      navigate("/goals");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete goal", "error");
    }
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!goal || !newMilestone.trim()) return;
    setAddingMilestone(true);
    try {
      const res = await addMilestone(goal.id, newMilestone.trim());
      setGoal((prev) => prev ? { ...prev, milestones: [...prev.milestones, res.milestone] } : prev);
      setNewMilestone("");
    } catch {
      toast("Failed to add milestone", "error");
    } finally {
      setAddingMilestone(false);
    }
  }

  async function handleToggleMilestone(milestoneId: string) {
    if (!goal) return;
    try {
      const res = await toggleMilestone(goal.id, milestoneId);
      setGoal((prev) =>
        prev
          ? {
              ...prev,
              progress: res.progress,
              milestones: prev.milestones.map((m) => (m.id === milestoneId ? res.milestone : m)),
            }
          : prev
      );
      if (res.milestone.isCompleted) {
        setPoppedMilestone(milestoneId);
        setTimeout(() => setPoppedMilestone(null), 350);
      }
    } catch {
      toast("Failed to update milestone", "error");
    }
  }

  if (loading) {
    return <LoadingState title="Loading goal" message="Checking milestones and progress signals." maxWidthClassName="max-w-160" />;
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page max-w-160 text-center">
          <p className="wf-text mb-4" style={{ color: "var(--color-error)" }}>{error || "Goal not found"}</p>
          <Link to="/goals" className="text-link wf-text-sm">← Back to goals</Link>
        </div>
      </div>
    );
  }

  const completedCount = goal.milestones.filter((m) => m.isCompleted).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-160">
        <Link to="/goals" className="text-link wf-text-sm mb-6 inline-block">
          ← Back to goals
        </Link>

        {/* Goal completed celebration */}
        {showGoalCompleted && (
          <div
            className="wf-goal-completed mb-5 rounded-xl px-5 py-4 flex items-center gap-3"
            style={{ background: "var(--color-blue)", color: "#fff" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="10" fill="rgba(255,255,255,0.18)" />
              <path d="M6.5 11.5 L9.5 14.5 L15.5 8.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold" style={{ fontSize: 15 }}>Goal completed — great work.</p>
              <p style={{ fontSize: 13, opacity: 0.85 }}>Mark it as a win and set your next one.</p>
            </div>
            <button
              onClick={() => setShowGoalCompleted(false)}
              aria-label="Dismiss"
              style={{ opacity: 0.7, fontSize: 18, lineHeight: 1, cursor: "pointer", background: "none", border: "none", color: "#fff", padding: 0 }}
            >
              ×
            </button>
          </div>
        )}

        {/* Header card */}
        <div className="wf-card mb-4">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="wf-label">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="wf-input font-semibold"
                />
              </div>
              <div>
                <label className="wf-label">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  placeholder="Description (optional)"
                  className="wf-textarea"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="wf-label">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as GoalStatus)}
                    className="wf-select"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="wf-label">Target Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="wf-input"
                  />
                </div>
              </div>
              <div>
                <label className="wf-label">Manual Progress: {editProgress}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editProgress}
                  onChange={(e) => setEditProgress(parseInt(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="wf-btn wf-btn-primary">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => { setEditing(false); populateEdit(goal); }} className="wf-btn wf-btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="wf-h2">{goal.title}</h1>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={STATUS_BADGE[goal.status]}>
                    {STATUS_OPTIONS.find((o) => o.value === goal.status)?.label}
                  </span>
                  <button onClick={() => setEditing(true)} className="wf-btn wf-btn-secondary px-3 py-1">
                    Edit
                  </button>
                  <button onClick={handleDelete} className="wf-btn wf-btn-danger px-3 py-1">
                    Delete
                  </button>
                </div>
              </div>

              {goal.description && (
                <p className="wf-text mb-4 whitespace-pre-wrap" style={{ color: "var(--color-ink-2)" }}>{goal.description}</p>
              )}

              <GoalProgressBar progress={goal.progress} />

              <div className="flex flex-wrap gap-4 mt-3">
                {goal.targetDate && (
                  <span className="wf-text-xs">
                    Due: {new Date(goal.targetDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {goal.booking && (
                  <Link to={`/bookings/${goal.booking.id}`} className="text-link wf-text-xs">
                    {goal.booking.program.title}
                  </Link>
                )}
                <span className="wf-text-xs">Created {new Date(goal.createdAt).toLocaleDateString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Milestones */}
        <div className="wf-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="wf-h3">
              Milestones
              {goal.milestones.length > 0 && (
                <span className="ml-2 font-normal" style={{ color: "var(--color-ink-3)", textTransform: "none", letterSpacing: "normal", fontSize: "11px" }}>
                  {completedCount}/{goal.milestones.length}
                </span>
              )}
            </h2>
          </div>

          {/* All-milestones complete celebration */}
          {goal.milestones.length > 0 && completedCount === goal.milestones.length && (
            <div
              className="wf-completion-banner flex items-center gap-2 mb-4 px-3 py-2"
              style={{
                background: "rgba(45,106,79,0.07)",
                border: "1px solid rgba(45,106,79,0.20)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <svg className="w-4 h-4 shrink-0" style={{ color: "var(--color-success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="wf-text-sm font-medium" style={{ color: "var(--color-success)" }}>
                All milestones reached — well done.
              </span>
            </div>
          )}

          {goal.milestones.length === 0 ? (
            <p className="wf-text-sm mb-4">No milestones yet.</p>
          ) : (
            <ul className="space-y-3 mb-4">
              {goal.milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleMilestone(m.id)}
                    className={`w-5 h-5 border-2 shrink-0 flex items-center justify-center transition-colors ${poppedMilestone === m.id ? "milestone-pop" : ""}`}
                    style={
                      m.isCompleted
                        ? { background: "var(--color-blue)", borderColor: "var(--color-blue)" }
                        : { borderColor: "var(--color-border)" }
                    }
                  >
                    {m.isCompleted && (
                      <svg className="w-3 h-3" style={{ color: "#FFFFFF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`wf-text ${m.isCompleted ? "line-through" : ""}`} style={{ color: m.isCompleted ? "var(--color-ink-3)" : "var(--color-ink)" }}>
                    {m.title}
                  </span>
                  {m.completedAt && (
                    <span className="wf-text-xs ml-auto">
                      {new Date(m.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Add milestone form */}
          <form onSubmit={handleAddMilestone} className="flex gap-2 mt-2">
            <input
              type="text"
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              placeholder="Add a milestone..."
              maxLength={300}
              className="flex-1 wf-input"
            />
            <button
              type="submit"
              disabled={!newMilestone.trim() || addingMilestone}
              className="wf-btn wf-btn-primary"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
