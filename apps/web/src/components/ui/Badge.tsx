import type { CSSProperties, ReactNode } from "react";

type Variant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  pulse?: boolean;
  className?: string;
  style?: CSSProperties;
}

const variantClasses: Record<Variant, string> = {
  success: "wf-badge wf-badge-success",
  warning: "wf-badge wf-badge-warn",
  error: "wf-badge wf-badge-error",
  info: "wf-badge wf-badge-info",
  neutral: "wf-badge wf-badge-neutral",
};

/**
 * Badge — status badge with optional pulse animation
 *
 * Features:
 * - Color variants
 * - Pulse animation for live/new indicators
 */
export default function Badge({ children, variant = "neutral", pulse, className = "", style }: BadgeProps) {
  return (
    <span
      className={`${variantClasses[variant]} ${className}`}
      style={{
        animation: pulse ? "badgePulse 2s ease-in-out infinite" : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
