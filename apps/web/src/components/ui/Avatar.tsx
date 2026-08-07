import type { CSSProperties } from "react";

type Size = "xs" | "sm" | "md" | "lg";
type Status = "online" | "offline" | "busy" | "away";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: Size;
  status?: Status;
  className?: string;
  style?: CSSProperties;
}

const sizeClasses: Record<Size, string> = {
  xs: "wf-avatar wf-avatar-xs",
  sm: "wf-avatar wf-avatar-sm",
  md: "wf-avatar wf-avatar-md",
  lg: "wf-avatar wf-avatar-lg",
};

const sizePx: Record<Size, number> = { xs: 24, sm: 32, md: 44, lg: 80 };

const statusColors: Record<Status, string> = {
  online: "var(--color-success)",
  offline: "var(--color-muted)",
  busy: "var(--color-error)",
  away: "var(--color-warning)",
};

/**
 * Avatar — user avatar with fallback initials and status dot
 *
 * Features:
 * - Image with fallback to initials
 * - Status indicator dot (online/offline/busy/away)
 * - Multiple sizes
 */
export default function Avatar({ src, name = "", size = "md", status, className = "", style }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dotSize = size === "xs" ? 6 : size === "sm" ? 8 : size === "md" ? 10 : 14;

  return (
    <div style={{ position: "relative", display: "inline-flex", ...style }} className={className}>
      <div className={sizeClasses[size]}>
        {src ? (
          <img
            src={src}
            alt={name || "Avatar"}
            style={{
              width: sizePx[size],
              height: sizePx[size],
              objectFit: "cover",
              borderRadius: "inherit",
            }}
          />
        ) : (
          initials || "?"
        )}
      </div>

      {status && (
        <span
          aria-label={status}
          style={{
            position: "absolute",
            bottom: size === "lg" ? 4 : 0,
            right: size === "lg" ? 4 : 0,
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            background: statusColors[status],
            border: "2px solid var(--color-surface)",
            animation: status === "online" ? "statusPulse 2s ease-in-out infinite" : undefined,
          }}
        />
      )}
    </div>
  );
}
