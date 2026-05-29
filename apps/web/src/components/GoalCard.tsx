import { Link } from "react-router-dom";
import type { Goal } from "../lib/api";
import GoalProgressBar from "./GoalProgressBar";

interface GoalCardProps {
  goal: Goal;
  onDelete?: (id: string) => void;
}

const STATUS_PILL: Record<string, string> = {
  NOT_STARTED: "wf-badge wf-badge-neutral",
  IN_PROGRESS: "wf-badge wf-badge-warn",
  COMPLETED:   "wf-badge wf-badge-success",
  ON_HOLD:     "wf-badge wf-badge-warn",
};

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
  const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
  const totalMilestones = goal.milestones.length;
  const isOverdue =
    goal.targetDate &&
    goal.status !== "COMPLETED" &&
    new Date(goal.targetDate) < new Date();

  const pill = STATUS_PILL[goal.status] ?? "wf-badge wf-badge-neutral";

  return (
    <div className="wf-card flex flex-col p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <Link
            to={`/goals/${goal.id}`}
            className="wf-h3 block no-underline hover:underline"
          >
            {goal.title}
          </Link>
          {goal.booking && (
            <p className="wf-text-xs mt-2" style={{ color: "var(--color-ink-3)" }}>
              {goal.booking.program.title}
            </p>
          )}
        </div>
        <span className={`shrink-0 ${pill}`}>
          {STATUS_LABELS[goal.status]}
        </span>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="wf-text-sm line-clamp-2 mb-5" style={{ color: "var(--color-ink-2)" }}>{goal.description}</p>
      )}

      {/* Progress */}
      <div className="mb-5">
        <GoalProgressBar progress={goal.progress} />
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center justify-between gap-3 wf-text-xs mb-5" style={{ color: "var(--color-ink-3)" }}>
        <span>
          {totalMilestones > 0
            ? `${completedMilestones}/${totalMilestones} milestones`
            : "No milestones"}
        </span>
        {goal.targetDate && (
          <span style={isOverdue ? { color: "var(--color-error)", fontWeight: 500 } : {}}>
            {isOverdue ? "Overdue · " : "Due "}
            {new Date(goal.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-5 mt-auto border-t" style={{ borderColor: "var(--color-border)" }}>
        <Link
          to={`/goals/${goal.id}`}
          className="wf-btn wf-btn-secondary text-sm py-2 px-4"
        >
          View details
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(goal.id)}
            className="wf-text-sm hover:underline ml-auto"
            style={{ color: "var(--color-error)" }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
