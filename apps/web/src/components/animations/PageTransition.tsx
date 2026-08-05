import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition — Smooth page transition wrapper
 *
 * Features:
 * - Fade + slide animation on route change
 * - Uses View Transitions API where supported
 * - Fallback CSS animation for other browsers
 * - Respects prefers-reduced-motion
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Skip if same path (query string changes shouldn't trigger)
    if (prevPathRef.current === location.pathname) {
      setDisplayChildren(children);
      return;
    }

    if (prefersReducedMotion) {
      setDisplayChildren(children);
      prevPathRef.current = location.pathname;
      return;
    }

    // Check for View Transitions API support
    if ("startViewTransition" in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => {
          setDisplayChildren(children);
          prevPathRef.current = location.pathname;
        });
    } else {
      // Fallback: CSS animation
      setIsTransitioning(true);

      // Wait for exit animation
      const exitTimer = setTimeout(() => {
        setDisplayChildren(children);
        prevPathRef.current = location.pathname;

        // Wait a frame then trigger enter animation
        requestAnimationFrame(() => {
          setIsTransitioning(false);
        });
      }, 150);

      return () => clearTimeout(exitTimer);
    }
  }, [location.pathname, children, prefersReducedMotion]);

  return (
    <div
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 200ms ease, transform 200ms ease",
        minHeight: "100vh",
      }}
    >
      {displayChildren}

      {/* View Transitions API styles */}
      <style>{`
        ::view-transition-old(root) {
          animation: page-fade-out 150ms ease-out both;
        }

        ::view-transition-new(root) {
          animation: page-fade-in 200ms ease-out both;
        }

        @keyframes page-fade-out {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-8px);
          }
        }

        @keyframes page-fade-in {
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
          ::view-transition-old(root),
          ::view-transition-new(root) {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * usePageTransition — Hook for triggering transitions programmatically
 */
export function usePageTransition() {
  const [isNavigating, setIsNavigating] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  function startTransition(callback: () => void) {
    if (prefersReducedMotion) {
      callback();
      return;
    }

    if ("startViewTransition" in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(callback);
    } else {
      setIsNavigating(true);
      setTimeout(() => {
        callback();
        setIsNavigating(false);
      }, 150);
    }
  }

  return { isNavigating, startTransition };
}
