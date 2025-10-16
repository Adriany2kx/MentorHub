import type { BookingStatus, SessionStatus } from "../lib/api";

type Status = BookingStatus | SessionStatus;

const CONFIG: Record<Status, { label: string; cls: string }> = {
  PENDING:     { label: "Pending",     cls: "wf-badge wf-badge-warn" },
  CONFIRMED:   { label: "Confirmed",   cls: "wf-badge wf-badge-info" },
  ACTIVE:      { label: "Active",      cls: "wf-badge wf-badge-success" },
  COMPLETED:   { label: "Completed",   cls: "wf-badge wf-badge-neutral" },
  CANCELLED:   { label: "Cancelled",   cls: "wf-badge wf-badge-error" },
  SCHEDULED:   { label: "Scheduled",   cls: "wf-badge wf-badge-info" },
  IN_PROGRESS: { label: "In Progress", cls: "wf-badge wf-badge-warn" },
  NO_SHOW:     { label: "No Show",     cls: "wf-badge wf-badge-error" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status] ?? { label: status, cls: "wf-badge wf-badge-neutral" };
  return <span className={cfg.cls}>{cfg.label}</span>;
}
