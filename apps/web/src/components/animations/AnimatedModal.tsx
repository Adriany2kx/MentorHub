import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

/**
 * AnimatedModal — Luma-style modal with spring animations
 *
 * Features:
 * - Backdrop blur fade-in
 * - Content scales from 0.95 → 1.0 with spring easing
 * - Staggered content reveal
 * - Exit animation (scale down + fade)
 * - Respects prefers-reduced-motion
 * - Click outside or Escape to close
 */
export default function AnimatedModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: AnimatedModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 400,
    md: 500,
    lg: 640,
    xl: 800,
  };

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimatingOut(false);
      document.body.style.overflow = "hidden";
    } else if (isVisible) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimatingOut(false);
        document.body.style.overflow = "";
      }, 200);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isVisible]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) {
      onClose();
    }
  }

  if (!isVisible) return null;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: isAnimatingOut
          ? "rgba(0, 0, 0, 0)"
          : "rgba(0, 0, 0, 0.4)",
        backdropFilter: isAnimatingOut ? "blur(0px)" : "blur(8px)",
        WebkitBackdropFilter: isAnimatingOut ? "blur(0px)" : "blur(8px)",
        transition: prefersReducedMotion
          ? "none"
          : "background 250ms ease, backdrop-filter 250ms ease",
        animation: prefersReducedMotion
          ? "none"
          : isAnimatingOut
            ? "none"
            : "modalBackdropIn 250ms ease-out",
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        style={{
          width: "100%",
          maxWidth: sizeClasses[size],
          maxHeight: "calc(100vh - 32px)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-modal)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transform: prefersReducedMotion
            ? "none"
            : isAnimatingOut
              ? "scale(0.95)"
              : "scale(1)",
          opacity: isAnimatingOut ? 0 : 1,
          transition: prefersReducedMotion
            ? "none"
            : "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 180ms ease",
          animation: prefersReducedMotion
            ? "none"
            : isAnimatingOut
              ? "none"
              : "modalContentIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid var(--color-border)",
              animation: prefersReducedMotion
                ? "none"
                : "modalItemIn 400ms cubic-bezier(0.16, 1, 0.3, 1) 50ms both",
            }}
          >
            {title && (
              <h2
                id="modal-title"
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  color: "var(--color-ink-3)",
                  transition: "all 150ms ease",
                  marginLeft: "auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-border-soft)";
                  e.currentTarget.style.color = "var(--color-ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
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
            padding: 20,
            overflowY: "auto",
            flex: 1,
            animation: prefersReducedMotion
              ? "none"
              : "modalItemIn 400ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both",
          }}
        >
          {children}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes modalBackdropIn {
          from {
            background: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px);
          }
          to {
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
          }
        }

        @keyframes modalContentIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modalItemIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes modalBackdropIn { from, to { opacity: 1; } }
          @keyframes modalContentIn { from, to { opacity: 1; transform: none; } }
          @keyframes modalItemIn { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </div>
  );
}
