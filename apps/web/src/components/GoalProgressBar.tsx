import { useState, useEffect } from "react";

interface GoalProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function GoalProgressBar({ progress, showLabel = true, size = "md" }: GoalProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  // Start at 0 so the CSS transition animates the fill on mount
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDisplayed(clamped), 30);
    return () => clearTimeout(id);
  }, [clamped]);

  const labelTone =
    clamped === 100
      ? { color: "var(--color-success)", background: "var(--color-success-bg)", borderColor: "var(--color-success-border)" }
      : clamped >= 30
      ? { color: "var(--color-warning)", background: "var(--color-warning-bg)", borderColor: "var(--color-warning-border)" }
      : { color: "var(--color-error)", background: "var(--color-error-bg)", borderColor: "var(--color-error-border)" };

  const height = size === "sm" ? "h-1.5" : "h-2";
  const isComplete = clamped === 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="wf-text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-ink-3)" }}>
          Progress
        </span>
        {showLabel && (
          <span
            className="wf-badge"
            style={{
              paddingInline: 10,
              color: labelTone.color,
              background: labelTone.background,
              border: `1px solid ${labelTone.borderColor}`,
            }}
          >
            {clamped}% complete
          </span>
        )}
      </div>

      <div className={`w-full bg-paper-2 border border-line overflow-hidden rounded-full ${height}`}>
        <div
          className={`${height}`}
          style={{
            width: `${displayed}%`,
            transition: "width 700ms cubic-bezier(0.16, 1, 0.3, 1)",
            background: isComplete ? "var(--color-success)" : "var(--color-ink)",
            boxShadow: isComplete ? "0 0 8px rgba(45,106,79,0.30)" : "none",
          }}
        />
      </div>
    </div>
  );
}
