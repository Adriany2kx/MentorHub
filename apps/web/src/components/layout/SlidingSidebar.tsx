import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface SlidingSidebarProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
  width?: number | string;
  title?: string;
  showClose?: boolean;
  pushContent?: boolean;
}

/**
 * SlidingSidebar — Typefully-style sliding panel
 *
 * Features:
 * - Slide from edge with spring easing
 * - Backdrop overlay with click-to-close
 * - Content push (not overlay) option
 * - Keyboard navigation (Escape to close)
 */
export default function SlidingSidebar({
  open,
  onClose,
  children,
  side = "left",
  width = 320,
  title,
  showClose = true,
  pushContent = false,
}: SlidingSidebarProps) {
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const widthValue = typeof width === "number" ? `${width}px` : width;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: open ? "blur(4px)" : "none",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transition: "all 250ms ease",
          zIndex: 999,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          [side]: 0,
          width: widthValue,
          maxWidth: "90vw",
          background: "var(--color-surface)",
          borderRight: side === "left" ? "1px solid var(--color-border)" : "none",
          borderLeft: side === "right" ? "1px solid var(--color-border)" : "none",
          boxShadow: open
            ? side === "left"
              ? "8px 0 32px rgba(0,0,0,0.1)"
              : "-8px 0 32px rgba(0,0,0,0.1)"
            : "none",
          transform: open
            ? "translateX(0)"
            : side === "left"
            ? "translateX(-100%)"
            : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        {(title || showClose) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          >
            {title && (
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}

            {showClose && (
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  color: "var(--color-ink-3)",
                  transition: "all 150ms ease",
                  marginLeft: title ? 0 : "auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-border-soft)";
                  e.currentTarget.style.color = "var(--color-ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--color-ink-3)";
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {children}
        </div>
      </div>

      {/* Push content wrapper support */}
      {pushContent && (
        <style>{`
          body {
            transition: margin 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
            ${side === "left" ? "margin-left" : "margin-right"}: ${open ? widthValue : "0"};
          }
        `}</style>
      )}
    </>
  );
}
