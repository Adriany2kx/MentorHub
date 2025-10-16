import type { ReactNode } from "react";

interface LoadingStateProps {
  title?: string;
  message?: string;
  fullScreen?: boolean;
  maxWidthClassName?: string;
  lines?: 2 | 3 | 4;
  children?: ReactNode;
}

export default function LoadingState({
  title = "Preparing your workspace",
  message = "Just a moment while we load your content.",
  fullScreen = false,
  maxWidthClassName = "max-w-2xl",
  lines = 3,
  children,
}: LoadingStateProps) {
  const lineWidths = ["w-full", "w-11/12", "w-8/12", "w-6/12"];

  return (
    <div className={fullScreen ? "min-h-screen" : ""} style={{ background: "var(--color-bg)" }}>
      <div className="wf-page py-10">
        <div
          className={`wf-loading-shell wf-card ${maxWidthClassName} mx-auto p-6 sm:p-7`}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex items-center gap-3">
            <span className="wf-loading-spinner" aria-hidden="true" />
            <div>
              <p className="wf-text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                {title}
              </p>
              <p className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
                {message}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3" aria-hidden="true">
            <div className="wf-skeleton wf-loading-bar h-5 w-4/12" />
            {Array.from({ length: lines }).map((_, index) => (
              <div key={index} className={`wf-skeleton wf-loading-bar h-3 ${lineWidths[index] || "w-full"}`} />
            ))}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
