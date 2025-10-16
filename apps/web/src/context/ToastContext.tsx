import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.2)" />
      <path d="M4.5 8.5 L7 11 L11.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.2)" />
      <path d="M5.5 5.5 L10.5 10.5 M10.5 5.5 L5.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2 L14 13 H2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(255,255,255,0.2)" />
      <line x1="8" y1="7" x2="8" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.6" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.2)" />
      <line x1="8" y1="7" x2="8" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.75" fill="currentColor" />
    </svg>
  ),
};

const COLORS: Record<ToastType, { bg: string; color: string }> = {
  success: { bg: "var(--color-success)",  color: "#fff" },
  error:   { bg: "var(--color-error)",    color: "#fff" },
  warning: { bg: "var(--color-warning)",  color: "#fff" },
  info:    { bg: "var(--color-blue)",     color: "#fff" },
};

const DURATION = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), DURATION);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
          maxWidth: 360,
          width: "calc(100vw - 48px)",
        }}
      >
        {toasts.map((t) => {
          const { bg, color } = COLORS[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className="wf-toast"
              style={{
                background: bg,
                color,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                fontSize: 14,
                lineHeight: 1.4,
                pointerEvents: "auto",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{ flexShrink: 0 }}>{ICONS[t.type]}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                style={{
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  color: "inherit",
                  opacity: 0.65,
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: "0 0 0 4px",
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
