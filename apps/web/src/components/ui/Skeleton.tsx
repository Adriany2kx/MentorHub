import type { CSSProperties } from "react";

type Variant = "text" | "title" | "avatar" | "button" | "card" | "image";

interface SkeletonProps {
  variant?: Variant;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}

const variantClasses: Record<Variant, string> = {
  text: "wf-skeleton wf-skeleton-text wf-shimmer",
  title: "wf-skeleton wf-skeleton-title wf-shimmer",
  avatar: "wf-skeleton wf-skeleton-avatar wf-shimmer",
  button: "wf-skeleton wf-skeleton-button wf-shimmer",
  card: "wf-skeleton wf-skeleton-card wf-shimmer",
  image: "wf-skeleton wf-skeleton-image wf-shimmer",
};

/**
 * Skeleton — placeholder loading shapes with shimmer
 *
 * Features:
 * - Multiple shape variants
 * - Shimmer animation
 * - Custom dimensions
 */
export default function Skeleton({ variant = "text", width, height, className = "", style }: SkeletonProps) {
  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonGroup — multiple skeletons with stagger animation
 */
export function SkeletonGroup({ count = 3, variant = "text" }: { count?: number; variant?: Variant }) {
  return (
    <div className="wf-loading-stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} width={`${100 - i * 15}%`} />
      ))}
    </div>
  );
}
