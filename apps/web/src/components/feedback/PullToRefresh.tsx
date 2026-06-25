import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

/**
 * PullToRefresh — Snapchat-style pull-to-refresh
 *
 * Features:
 * - Elastic pull indicator with rotation
 * - Smooth snap-back animation
 * - Works on touch devices
 * - Desktop: refresh button alternative
 */
export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const canPull = useCallback(() => {
    if (disabled || isRefreshing) return false;
    const container = containerRef.current;
    if (!container) return false;
    return container.scrollTop <= 0;
  }, [disabled, isRefreshing]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!canPull()) return;
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      setIsPulling(true);
    },
    [canPull]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || !canPull()) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      if (distance > 0) {
        // Elastic resistance - diminishing returns as you pull further
        const elasticDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(elasticDistance);

        // Prevent scroll when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    },
    [isPulling, canPull, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Keep indicator visible

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  // Desktop refresh button handler
  const handleDesktopRefresh = useCallback(async () => {
    if (isRefreshing || disabled) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, disabled, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;
  const scale = 0.5 + progress * 0.5;
  const opacity = Math.min(progress * 1.5, 1);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Pull indicator */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: pullDistance,
          overflow: "hidden",
          transition: isPulling ? "none" : "height 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            opacity,
            transition: isPulling
              ? "none"
              : "transform 300ms ease, opacity 300ms ease",
          }}
        >
          <RefreshCw
            size={18}
            style={{
              color: isRefreshing ? "var(--color-green)" : "var(--color-ink-2)",
              animation: isRefreshing ? "spinRefresh 800ms linear infinite" : "none",
            }}
          />
        </div>
      </div>

      {/* Content wrapper */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {children}
      </div>

      {/* Desktop refresh button (shown on non-touch devices) */}
      <button
        onClick={handleDesktopRefresh}
        disabled={isRefreshing || disabled}
        className="ptr-desktop-btn"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          cursor: isRefreshing || disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 200ms ease",
          zIndex: 100,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <RefreshCw
          size={20}
          style={{
            color: "var(--color-ink-2)",
            animation: isRefreshing ? "spinRefresh 800ms linear infinite" : "none",
          }}
        />
      </button>

      {/* Styles */}
      <style>{`
        @keyframes spinRefresh {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Hide desktop button on touch devices */
        @media (hover: none) and (pointer: coarse) {
          .ptr-desktop-btn {
            display: none !important;
          }
        }

        /* Show desktop button on desktop */
        @media (hover: hover) and (pointer: fine) {
          .ptr-desktop-btn:hover {
            background: var(--color-green-light);
            border-color: var(--color-green);
            transform: scale(1.05);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes spinRefresh {
            from, to { transform: rotate(0deg); }
          }
        }
      `}</style>
    </div>
  );
}
