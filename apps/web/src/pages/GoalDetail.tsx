import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getGoal, updateGoal, deleteGoal, addMilestone, toggleMilestone, getGoalMentors, getMentor, getLearningPath, getGoalPrediction, getGoalResources } from "../lib/api";
import type { Goal, GoalStatus, AiMentorRecommendation, MentorDetail, AiLearningStage, AiPrediction, AiResource } from "../lib/api";
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

const TRAJECTORY_STYLE: Record<string, { bg: string; color: string }> = {
  "on-track":  { bg: "var(--color-success-bg, #d1fae5)", color: "var(--color-success, #065f46)" },
  "at-risk":   { bg: "var(--color-warn-bg, #fef3c7)",   color: "var(--color-warn, #92400e)" },
  "off-track": { bg: "var(--color-error-bg, #fee2e2)",  color: "var(--color-error, #991b1b)" },
  "completed": { bg: "var(--color-success-bg, #d1fae5)", color: "var(--color-success, #065f46)" },
};

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<GoalStatus>("NOT_STARTED");
  const [editProgress, setEditProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const [newMilestone, setNewMilestone] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [poppedMilestone, setPoppedMilestone] = useState<string | null>(null);

  const [showGoalCompleted, setShowGoalCompleted] = useState(false);
  const [deleteConfirmArmed, setDeleteConfirmArmed] = useState(false);

  const [goalMentors, setGoalMentors] = useState<AiMentorRecommendation[]>([]);
  const [goalMentorDetails, setGoalMentorDetails] = useState<Record<string, MentorDetail>>({});

  const [learningPath, setLearningPath] = useState<AiLearningStage[] | null>(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [prediction, setPrediction] = useState<AiPrediction | null>(null);
  const [resources, setResources] = useState<AiResource[] | null>(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getGoal(id)
      .then((d) => { setGoal(d.goal); populateEdit(d.goal); })
      .catch((err) => setError(err instanceof Error ? err.message : "Goal not found"))
      .finally(() => setLoading(false));

    getGoalPrediction(id).then(setPrediction).catch(() => {});

    getGoalMentors(id)
      .then(({ mentors: recs }) => {
        setGoalMentors(recs);
        return Promise.all(recs.map((r) => getMentor(r.mentorId).catch(() => null)));
      })
      .then((mentors: ({ mentor: MentorDetail } | null)[]) => {
        const map: Record<string, MentorDetail> = {};
        mentors.forEach((m) => { if (m) map[m.mentor.id] = m.mentor; });
        setGoalMentorDetails(map);
      })
      .catch(() => {});
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
        prev ? {
          ...prev,
          progress: res.progress,
          milestones: prev.milestones.map((m) => (m.id === milestoneId ? res.milestone : m)),
        } : prev
      );
      if (res.milestone.isCompleted) {
        setPoppedMilestone(milestoneId);
        setTimeout(() => setPoppedMilestone(null), 350);
      }
    } catch {
      toast("Failed to update milestone", "error");
    }
  }

  if (loading) return <LoadingState title="Loading goal" message="Checking milestones and progress signals." maxWidthClassName="max-w-4xl" />;

  if (error || !goal) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page max-w-4xl text-center">
          <p className="wf-text mb-4" style={{ color: "var(--color-error)" }}>{error || "Goal not found"}</p>
          <Link to="/goals" className="text-link wf-text-sm">← Back to goals</Link>
        </div>
      </div>
    );
  }

  const completedCount = goal.milestones.filter((m) => m.isCompleted).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-4xl">

        <Link to="/goals" className="text-link wf-text-sm mb-6 inline-block">← Back to goals</Link>

        {/* Goal completed banner */}
        {showGoalCompleted && (
          <div className="mb-5 rounded-xl px-5 py-4 flex items-center gap-3" style={{ background: "var(--color-blue)", color: "#fff" }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="10" fill="rgba(255,255,255,0.18)" />
              <path d="M6.5 11.5 L9.5 14.5 L15.5 8.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold" style={{ fontSize: 14 }}>Goal completed — great work.</p>
              <p style={{ fontSize: 12, opacity: 0.85 }}>Mark it as a win and set your next one.</p>
            </div>
            <button onClick={() => setShowGoalCompleted(false)} style={{ opacity: 0.7, fontSize: 18, lineHeight: 1, cursor: "pointer", background: "none", border: "none", color: "#fff", padding: 0 }}>×</button>
          </div>
        )}

        {/* Header card */}
        <div className="wf-card p-6 mb-6">
          {editing ? (
            <div className="space-y-5">
              <div>
                <label className="wf-label">Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="wf-input font-semibold" />
              </div>
              <div>
                <label className="wf-label">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} placeholder="Description (optional)" className="wf-textarea" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="wf-label">Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as GoalStatus)} className="wf-select">
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="wf-label">Target Date</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="wf-input" />
                </div>
              </div>
              <div>
                <label className="wf-label">Manual Progress: {editProgress}%</label>
                <input type="range" min={0} max={100} value={editProgress} onChange={(e) => setEditProgress(parseInt(e.target.value))} className="w-full mt-1" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="wf-btn wf-btn-primary">{saving ? "Saving…" : "Save"}</button>
                <button onClick={() => { setEditing(false); populateEdit(goal); }} className="wf-btn wf-btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="wf-h2 flex-1">{goal.title}</h1>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={STATUS_BADGE[goal.status]}>{STATUS_OPTIONS.find((o) => o.value === goal.status)?.label}</span>
                  <button onClick={() => setEditing(true)} className="wf-btn wf-btn-secondary px-3 py-1.5">Edit</button>
                  <button onClick={handleDelete} className="wf-btn wf-btn-danger px-3 py-1.5">Delete</button>
                </div>
              </div>

              {goal.description && (
                <p className="wf-text mb-4 whitespace-pre-wrap" style={{ color: "var(--color-ink-2)" }}>{goal.description}</p>
              )}

              <GoalProgressBar progress={goal.progress} />

              <div className="flex flex-wrap gap-4 mt-3">
                {goal.targetDate && (
                  <span className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
                    Due {new Date(goal.targetDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {goal.booking && (
                  <Link to={`/bookings/${goal.booking.id}`} className="text-link wf-text-xs">{goal.booking.program.title}</Link>
                )}
                <span className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
                  Created {new Date(goal.createdAt).toLocaleDateString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Two-column grid: milestones + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Milestones — takes 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <div className="wf-card p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <h2 className="wf-h3">
                  Milestones
                  {goal.milestones.length > 0 && (
                    <span className="ml-2 font-normal" style={{ color: "var(--color-ink-3)", fontSize: "12px" }}>
                      {completedCount}/{goal.milestones.length}
                    </span>
                  )}
                </h2>
              </div>

              {goal.milestones.length > 0 && completedCount === goal.milestones.length && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg" style={{ background: "rgba(45,106,79,0.07)", border: "1px solid rgba(45,106,79,0.20)" }}>
                  <svg className="w-4 h-4 shrink-0" style={{ color: "var(--color-success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="wf-text-sm font-medium" style={{ color: "var(--color-success)" }}>All milestones reached — well done.</span>
                </div>
              )}

              {goal.milestones.length === 0 ? (
                <p className="wf-text-sm mb-5" style={{ color: "var(--color-ink-3)" }}>No milestones yet. Add one below.</p>
              ) : (
                <ul className="space-y-3 mb-5">
                  {goal.milestones.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-1">
                      <button
                        onClick={() => handleToggleMilestone(m.id)}
                        className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${poppedMilestone === m.id ? "milestone-pop" : ""}`}
                        style={m.isCompleted ? { background: "var(--color-blue)", borderColor: "var(--color-blue)" } : { borderColor: "var(--color-border)", background: "transparent" }}
                      >
                        {m.isCompleted && (
                          <svg className="w-3 h-3" style={{ color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className={`wf-text flex-1 ${m.isCompleted ? "line-through" : ""}`} style={{ color: m.isCompleted ? "var(--color-ink-3)" : "var(--color-ink)" }}>
                        {m.title}
                      </span>
                      {m.completedAt && (
                        <span className="wf-text-xs shrink-0" style={{ color: "var(--color-ink-3)" }}>
                          {new Date(m.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAddMilestone} className="flex gap-3 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <input
                  type="text"
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="Add a milestone…"
                  maxLength={300}
                  className="flex-1 wf-input"
                />
                <button type="submit" disabled={!newMilestone.trim() || addingMilestone} className="wf-btn wf-btn-primary">
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar — 1/3 width on desktop */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* Prediction */}
            {prediction && prediction.trajectory !== "completed" && (
              <div className="wf-card p-5">
                <h3 className="wf-h3 mb-4">Prediction</h3>
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="text-4xl font-bold tabular-nums"
                    style={{
                      color: prediction.likelihood >= 65 ? "var(--color-success, #10b981)"
                        : prediction.likelihood >= 35 ? "var(--color-warn, #f59e0b)"
                        : "var(--color-error, #ef4444)",
                    }}
                  >
                    {prediction.likelihood}%
                  </div>
                  <div>
                    <span
                      className="wf-text-xs font-semibold px-2 py-0.5 rounded-full capitalize inline-block mb-1"
                      style={TRAJECTORY_STYLE[prediction.trajectory] ?? TRAJECTORY_STYLE["at-risk"]}
                    >
                      {prediction.trajectory.replace("-", " ")}
                    </span>
                    <p className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>likelihood</p>
                  </div>
                </div>
                {prediction.predictedDate && (
                  <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                    Est. completion <strong>{new Date(prediction.predictedDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong>
                  </p>
                )}
                <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
                  {prediction.completedSessions} session{prediction.completedSessions !== 1 ? "s" : ""} · {prediction.progress}% progress
                </p>
              </div>
            )}

            {/* Suggested mentors */}
            {goalMentors.length > 0 && (
              <div className="wf-card overflow-hidden">
                <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                  <h3 className="wf-h3" style={{ margin: 0 }}>Suggested Mentors</h3>
                  <Link to="/mentors" className="wf-text-xs text-link">Browse all →</Link>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {goalMentors.slice(0, 3).map((rec) => {
                    const mentor = goalMentorDetails[rec.mentorId];
                    const name = mentor ? `${mentor.user.firstName ?? ""} ${mentor.user.lastName ?? ""}`.trim() || "Mentor" : "Loading…";
                    return (
                      <Link
                        key={rec.mentorId}
                        to={`/mentors/${rec.mentorId}`}
                        className="flex items-center justify-between px-5 py-3 no-underline transition-colors"
                        style={{ color: "inherit" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="wf-text font-medium truncate">{name}</p>
                          {mentor?.expertise && (
                            <p className="wf-text-xs truncate" style={{ color: "var(--color-ink-3)" }}>{mentor.expertise.slice(0, 2).join(" · ")}</p>
                          )}
                        </div>
                        <span
                          className="wf-text-xs font-semibold px-2 py-0.5 rounded-full ml-3 shrink-0"
                          style={{
                            background: rec.score >= 70 ? "var(--color-success-bg, #d1fae5)" : "var(--color-warn-bg, #fef3c7)",
                            color: rec.score >= 70 ? "var(--color-success, #065f46)" : "var(--color-warn, #92400e)",
                          }}
                        >
                          {rec.score}%
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Learning Path — full width */}
        <div className="wf-card overflow-hidden mb-6">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="wf-h3" style={{ margin: 0 }}>Learning Path</h2>
            {!learningPath && (
              <button
                onClick={() => {
                  if (!id) return;
                  setPathLoading(true);
                  getLearningPath(id).then((d) => setLearningPath(d.path)).catch(() => {}).finally(() => setPathLoading(false));
                }}
                disabled={pathLoading}
                className="wf-btn wf-btn-secondary"
                style={{ fontSize: 12, padding: "4px 14px" }}
              >
                {pathLoading ? "Generating…" : "✦ Generate with AI"}
              </button>
            )}
          </div>

          {!learningPath && !pathLoading && (
            <div className="px-6 py-5">
              <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
                Generate an ordered learning path from your current skills to your target role.
              </p>
            </div>
          )}
          {pathLoading && (
            <div className="px-6 py-5 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Building your learning path…</div>
          )}
          {learningPath && (
            <div className="px-6 py-5 space-y-5">
              {learningPath.map((stage, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "var(--color-blue)", color: "#fff" }}>
                      {i + 1}
                    </div>
                    {i < learningPath.length - 1 && (
                      <div className="flex-1 w-px my-1" style={{ background: "var(--color-border)" }} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="wf-text font-semibold">{stage.stage}</p>
                      <span className="wf-text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-ink-3)" }}>
                        {stage.estimatedDuration}
                      </span>
                    </div>
                    <p className="wf-text-sm mt-1" style={{ color: "var(--color-ink-2)" }}>{stage.focus}</p>
                    {stage.resourceTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {stage.resourceTypes.map((rt) => <span key={rt} className="wf-tag">{rt}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resource Recommendations — full width */}
        <div className="wf-card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="wf-h3" style={{ margin: 0 }}>Suggested Resources</h2>
            {!resources && (
              <button
                onClick={() => {
                  if (!id) return;
                  setResourcesLoading(true);
                  getGoalResources(id).then((d) => setResources(d.resources)).catch(() => {}).finally(() => setResourcesLoading(false));
                }}
                disabled={resourcesLoading}
                className="wf-btn wf-btn-secondary"
                style={{ fontSize: 12, padding: "4px 14px" }}
              >
                {resourcesLoading ? "Finding…" : "✦ Suggest with AI"}
              </button>
            )}
          </div>

          {!resources && !resourcesLoading && (
            <div className="px-6 py-5">
              <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
                Get contextual resource suggestions based on where you are in this goal.
              </p>
            </div>
          )}
          {resourcesLoading && (
            <div className="px-6 py-5 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Finding relevant resources…</div>
          )}
          {resources && (
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {resources.map((r, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="wf-tag">{r.resourceType}</span>
                    <p className="wf-text-sm font-medium">{r.topic}</p>
                  </div>
                  <p className="wf-text-xs" style={{ color: "var(--color-ink-2)" }}>{r.rationale}</p>
                  <p className="wf-text-xs mt-1 font-mono" style={{ color: "var(--color-ink-3)" }}>Search: "{r.searchQuery}"</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
