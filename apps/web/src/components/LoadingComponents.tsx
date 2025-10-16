/**
 * MentorHub Loading Components
 * Impeccable loading animations — warm, trustworthy, energizing
 *
 * Usage:
 *   import { Spinner, SkeletonText, LoadingDots, ProgressBar, ... } from './LoadingComponents';
 */

import type { ReactNode, CSSProperties } from "react";

/* ============================================================
   SPINNER VARIANTS
   ============================================================ */

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
type SpinnerColor = "default" | "white" | "accent";

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
  label?: string;
}

const spinnerSizeClasses: Record<SpinnerSize, string> = {
  xs: "wf-loading-spinner-xs",
  sm: "wf-loading-spinner-sm",
  md: "wf-loading-spinner",
  lg: "wf-loading-spinner-lg",
  xl: "wf-loading-spinner-xl",
};

const spinnerColorClasses: Record<SpinnerColor, string> = {
  default: "",
  white: "wf-loading-spinner-white",
  accent: "wf-loading-spinner-accent",
};

export function Spinner({ size = "md", color = "default", className = "", label }: SpinnerProps) {
  return (
    <span
      className={`${spinnerSizeClasses[size]} ${spinnerColorClasses[color]} ${className}`}
      role="status"
      aria-label={label || "Loading"}
    />
  );
}

/* Circular SVG Spinner — smoother animation */
interface CircularSpinnerProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function CircularSpinner({
  size = 24,
  strokeWidth = 3,
  className = "",
  label,
}: CircularSpinnerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <svg
      className={`wf-loading-circular ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="status"
      aria-label={label || "Loading"}
    >
      <circle
        className="wf-loading-circular-path"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.25}
      />
    </svg>
  );
}

/* ============================================================
   LOADING DOTS
   ============================================================ */

interface LoadingDotsProps {
  size?: "sm" | "md" | "lg";
  color?: "default" | "white";
  className?: string;
}

export function LoadingDots({ size = "md", color = "default", className = "" }: LoadingDotsProps) {
  const sizeClass = size === "sm" ? "wf-loading-dots-sm" : size === "lg" ? "wf-loading-dots-lg" : "";
  const colorClass = color === "white" ? "wf-loading-dots-white" : "";

  return (
    <span className={`wf-loading-dots ${sizeClass} ${colorClass} ${className}`} role="status" aria-label="Loading">
      <span />
      <span />
      <span />
    </span>
  );
}

/* ============================================================
   LOADING BOUNCE
   ============================================================ */

interface LoadingBounceProps {
  className?: string;
}

export function LoadingBounce({ className = "" }: LoadingBounceProps) {
  return (
    <span className={`wf-loading-bounce ${className}`} role="status" aria-label="Loading">
      <span />
      <span />
      <span />
    </span>
  );
}

/* ============================================================
   SKELETON LOADERS
   ============================================================ */

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
  shimmer?: boolean;
}

export function Skeleton({ className = "", width, height, style, shimmer = false }: SkeletonProps) {
  const shimmerClass = shimmer ? "wf-shimmer" : "";
  return (
    <div
      className={`wf-skeleton wf-loading-bar ${shimmerClass} ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
  shimmer = true,
}: {
  lines?: number;
  className?: string;
  shimmer?: boolean;
}) {
  const widths = ["100%", "92%", "78%", "85%", "60%"];
  const shimmerClass = shimmer ? "wf-shimmer" : "";

  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`wf-skeleton wf-skeleton-text wf-loading-bar ${shimmerClass}`}
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

export function SkeletonTitle({ width = "60%", className = "" }: { width?: string; className?: string }) {
  return (
    <div
      className={`wf-skeleton wf-skeleton-title wf-loading-bar wf-shimmer ${className}`}
      style={{ width }}
      aria-hidden="true"
    />
  );
}

type AvatarSize = "sm" | "md" | "lg";

export function SkeletonAvatar({ size = "md", className = "" }: { size?: AvatarSize; className?: string }) {
  const sizeClass =
    size === "sm"
      ? "wf-skeleton-avatar-sm"
      : size === "lg"
        ? "wf-skeleton-avatar-lg"
        : "wf-skeleton-avatar-md";

  return <div className={`wf-skeleton wf-skeleton-avatar ${sizeClass} ${className}`} aria-hidden="true" />;
}

export function SkeletonButton({ width = "100px", className = "" }: { width?: string; className?: string }) {
  return (
    <div
      className={`wf-skeleton wf-skeleton-button wf-loading-bar wf-shimmer ${className}`}
      style={{ width }}
      aria-hidden="true"
    />
  );
}

export function SkeletonImage({ aspectRatio = "16 / 9", className = "" }: { aspectRatio?: string; className?: string }) {
  return (
    <div
      className={`wf-skeleton wf-skeleton-image wf-loading-bar wf-shimmer ${className}`}
      style={{ aspectRatio }}
      aria-hidden="true"
    />
  );
}

/* ============================================================
   SKELETON CARD COMPOSITIONS
   ============================================================ */

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`wf-skeleton-card-full ${className}`} aria-hidden="true">
      <SkeletonTitle width="45%" />
      <SkeletonText lines={2} />
      <div className="flex gap-2 mt-2">
        <SkeletonButton width="80px" />
        <SkeletonButton width="60px" />
      </div>
    </div>
  );
}

export function SkeletonMentorCard({ className = "" }: { className?: string }) {
  return (
    <div className={`wf-skeleton-mentor-card ${className}`} aria-hidden="true">
      <SkeletonAvatar size="lg" />
      <div className="wf-skeleton-mentor-info">
        <SkeletonTitle width="70%" />
        <Skeleton height={14} width="50%" />
        <SkeletonText lines={2} />
        <div className="flex gap-2 mt-1">
          <Skeleton height={24} width={60} className="rounded-full" />
          <Skeleton height={24} width={70} className="rounded-full" />
          <Skeleton height={24} width={55} className="rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 4, className = "" }: { columns?: number; className?: string }) {
  const widths = ["25%", "35%", "20%", "15%", "30%"];
  return (
    <div className={`wf-skeleton-table-row ${className}`} aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height={14} width={widths[i % widths.length]} />
      ))}
    </div>
  );
}

/* ============================================================
   PROGRESS BARS
   ============================================================ */

type ProgressSize = "sm" | "md" | "lg";
type ProgressVariant = "default" | "accent" | "success";

interface ProgressBarProps {
  value?: number;
  indeterminate?: boolean;
  size?: ProgressSize;
  variant?: ProgressVariant;
  className?: string;
  label?: string;
}

const progressSizeClasses: Record<ProgressSize, string> = {
  sm: "wf-progress-sm",
  md: "",
  lg: "wf-progress-lg",
};

const progressVariantClasses: Record<ProgressVariant, string> = {
  default: "",
  accent: "wf-progress-accent",
  success: "wf-progress-success",
};

export function ProgressBar({
  value = 0,
  indeterminate = false,
  size = "md",
  variant = "default",
  className = "",
  label,
}: ProgressBarProps) {
  const indeterminateClass = indeterminate ? "wf-progress-indeterminate" : "";

  return (
    <div
      className={`wf-progress ${progressSizeClasses[size]} ${progressVariantClasses[variant]} ${indeterminateClass} ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || "Progress"}
    >
      <div className="wf-progress-bar" style={indeterminate ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ============================================================
   PAGE LOADER
   ============================================================ */

interface PageLoaderProps {
  message?: string;
  showSpinner?: boolean;
}

export function PageLoader({ message = "Loading...", showSpinner = true }: PageLoaderProps) {
  return (
    <div className="wf-page-loader">
      {showSpinner && <Spinner size="xl" />}
      <p className="wf-page-loader-text">{message}</p>
    </div>
  );
}

/* ============================================================
   INLINE LOADER
   ============================================================ */

interface InlineLoaderProps {
  text?: string;
  className?: string;
}

export function InlineLoader({ text = "Loading", className = "" }: InlineLoaderProps) {
  return (
    <span className={`wf-loading-inline ${className}`}>
      <Spinner size="xs" />
      <span>{text}</span>
    </span>
  );
}

/* ============================================================
   BUTTON WITH LOADING STATE
   ============================================================ */

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  children: ReactNode;
}

export function LoadingButton({
  loading = false,
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: LoadingButtonProps) {
  const variantClass =
    variant === "secondary"
      ? "wf-btn-secondary"
      : variant === "danger"
        ? "wf-btn-danger"
        : "wf-btn-primary";
  const loadingClass = loading ? "wf-btn-loading" : "";

  return (
    <button
      className={`wf-btn ${variantClass} ${loadingClass} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {children}
    </button>
  );
}

/* ============================================================
   LOADING STAGGER CONTAINER
   ============================================================ */

interface LoadingStaggerProps {
  children: ReactNode;
  className?: string;
}

export function LoadingStagger({ children, className = "" }: LoadingStaggerProps) {
  return <div className={`wf-loading-stagger ${className}`}>{children}</div>;
}

/* ============================================================
   CONTENT PLACEHOLDER (Loading State with slot for content)
   ============================================================ */

interface ContentPlaceholderProps {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

export function ContentPlaceholder({ loading, skeleton, children }: ContentPlaceholderProps) {
  if (loading) {
    return <>{skeleton}</>;
  }
  return <>{children}</>;
}

/* ============================================================
   EXPORT ALL
   ============================================================ */

export default {
  Spinner,
  CircularSpinner,
  LoadingDots,
  LoadingBounce,
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonCard,
  SkeletonMentorCard,
  SkeletonTableRow,
  ProgressBar,
  PageLoader,
  InlineLoader,
  LoadingButton,
  LoadingStagger,
  ContentPlaceholder,
};
