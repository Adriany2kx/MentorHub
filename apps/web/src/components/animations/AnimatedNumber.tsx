import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatCompact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AnimatedNumber — dub.co-style count-up animation
 *
 * Features:
 * - Smooth count-up from previous value
 * - Optional compact notation (12.5K, 1.2M)
 * - Currency/prefix/suffix support
 * - Color flash on change (green for increase, red for decrease)
 * - Respects prefers-reduced-motion
 */
export default function AnimatedNumber({
  value,
  duration = 800,
  prefix = "",
  suffix = "",
  decimals = 0,
  formatCompact = false,
  className = "",
  style = {},
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flashColor, setFlashColor] = useState<"up" | "down" | null>(null);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const startValue = previousValue.current;
    const endValue = value;
    const diff = endValue - startValue;

    // Set flash color
    if (diff > 0) {
      setFlashColor("up");
    } else if (diff < 0) {
      setFlashColor("down");
    }

    // Clear flash after animation
    const flashTimer = setTimeout(() => setFlashColor(null), 600);

    if (prefersReducedMotion || diff === 0) {
      setDisplayValue(value);
      previousValue.current = value;
      return () => clearTimeout(flashTimer);
    }

    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = startValue + diff * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValue.current = endValue;
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(flashTimer);
    };
  }, [value, duration]);

  function formatNumber(num: number): string {
    if (formatCompact) {
      if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
      }
      if (num >= 1_000) {
        return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
      }
    }

    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  const colorStyle =
    flashColor === "up"
      ? { color: "var(--color-success)" }
      : flashColor === "down"
        ? { color: "var(--color-error)" }
        : {};

  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: "tabular-nums",
        transition: "color 300ms ease",
        ...colorStyle,
        ...style,
      }}
    >
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}

/**
 * AnimatedCounter — Simple count-up on mount
 * Useful for stats that only animate once when they come into view
 */
export function AnimatedCounter({
  end,
  duration = 1500,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  style = {},
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();

          if (prefersReducedMotion) {
            setCount(end);
            return;
          }

          const startTime = performance.now();

          function animate(currentTime: number) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out expo
            const eased = 1 - Math.pow(2, -10 * progress);
            setCount(Math.round(end * eased * Math.pow(10, decimals)) / Math.pow(10, decimals));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          }

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, decimals, hasAnimated]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {prefix}
      {count.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
