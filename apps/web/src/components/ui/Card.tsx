import type { CSSProperties, ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  className?: string;
  style?: CSSProperties;
}

const paddingStyles: Record<string, CSSProperties> = {
  none: { padding: 0 },
  sm: { padding: 16 },
  md: { padding: 20 },
  lg: { padding: 28 },
};

/**
 * Card — container with optional hover lift
 *
 * Features:
 * - Hover lift with shadow transition (when hover=true)
 * - Padding variants
 * - Uses CSS .wf-card base styles
 */
export default function Card({
  children,
  padding = "md",
  hover = false,
  className = "",
  style,
  ...props
}: CardProps) {
  return (
    <div
      className={`wf-card ${className}`}
      style={{
        ...paddingStyles[padding],
        transition: hover
          ? "transform var(--duration-normal) var(--ease-out), box-shadow var(--duration-normal) var(--ease-out), border-color var(--duration-normal) var(--ease-out)"
          : undefined,
        cursor: hover ? "pointer" : undefined,
        ...style,
      }}
      onMouseEnter={
        hover
          ? (e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--shadow-dropdown)";
              e.currentTarget.style.borderColor = "var(--color-teal)";
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-card)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}
