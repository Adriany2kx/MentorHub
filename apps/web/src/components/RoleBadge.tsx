import type { Role } from "../lib/api";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleClass: Record<Role, string> = {
  MENTEE: "wf-badge wf-badge-info",
  MENTOR: "wf-badge wf-badge-success",
  ADMIN:  "wf-badge wf-badge-neutral",
};

const roleLabels: Record<Role, string> = {
  MENTEE: "Mentee",
  MENTOR: "Mentor",
  ADMIN:  "Admin",
};

export default function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const cls = roleClass[role] ?? "wf-badge wf-badge-neutral";
  return (
    <span className={`${cls} ${className}`.trim()}>
      {roleLabels[role]}
    </span>
  );
}
