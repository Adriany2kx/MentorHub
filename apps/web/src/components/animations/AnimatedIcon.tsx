import { useState } from "react";
import type { LucideIcon } from "lucide-react";

interface AnimatedIconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  hoverColor?: string;
  animation?: "scale" | "bounce" | "rotate" | "pulse" | "shake" | "none";
  clickAnimation?: "pop" | "spin" | "none";
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  "aria-label"?: string;
}

/**
 * AnimatedIcon — Discord-style icon micro-interactions
 *
 * Animations:
 * - scale: Smooth scale up on hover (1.0 → 1.15)
 * - bounce: Elastic bounce on hover
 * - rotate: 15deg rotation on hover
 * - pulse: Breathing pulse effect
 * - shake: Horizontal shake on hover
 *
 * Click animations:
 * - pop: Quick scale pop (1 → 1.3 → 1)
 * - spin: 360deg rotation
 */
export default function AnimatedIcon({
  icon: Icon,
  size = 20,
  color = "currentColor",
  hoverColor,
  animation = "scale",
  clickAnimation = "pop",
  className = "",
  style = {},
  onClick,
  "aria-label": ariaLabel,
}: AnimatedIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function handleClick() {
    if (prefersReducedMotion) {
      onClick?.();
      return;
    }

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
    onClick?.();
  }

  const hoverTransforms: Record<string, string> = {
    scale: "scale(1.15)",
    bounce: "scale(1.2) translateY(-2px)",
    rotate: "rotate(15deg)",
    pulse: "scale(1.1)",
    shake: "translateX(2px)",
    none: "none",
  };

  const clickTransforms: Record<string, string> = {
    pop: "scale(1.3)",
    spin: "rotate(360deg)",
    none: "none",
  };

  const getTransform = () => {
    if (prefersReducedMotion) return "none";
    if (isClicked && clickAnimation !== "none") {
      return clickTransforms[clickAnimation];
    }
    if (isHovered && animation !== "none") {
      return hoverTransforms[animation];
    }
    return "none";
  };

  const getTransition = () => {
    if (prefersReducedMotion) return "none";
    if (isClicked) {
      return clickAnimation === "spin"
        ? "transform 300ms ease-out"
        : "transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)";
    }
    return animation === "bounce"
      ? "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), color 150ms ease"
      : "transform 150ms ease, color 150ms ease";
  };

  const currentColor =
    isHovered && hoverColor ? hoverColor : color;

  const Wrapper = onClick ? "button" : "span";

  return (
    <Wrapper
      className={className}
      onClick={onClick ? handleClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: onClick ? "pointer" : "default",
        transform: getTransform(),
        transition: getTransition(),
        color: currentColor,
        ...style,
      }}
    >
      <Icon size={size} />
    </Wrapper>
  );
}

/**
 * IconButton — Button wrapper with icon animations
 */
export function IconButton({
  icon: Icon,
  size = 20,
  label,
  variant = "ghost",
  onClick,
  disabled = false,
  className = "",
}: {
  icon: LucideIcon;
  size?: number;
  label: string;
  variant?: "ghost" | "solid" | "outline";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const baseStyles: React.CSSProperties = {
    width: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: prefersReducedMotion
      ? "none"
      : "all 150ms ease",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    ghost: {
      background: "transparent",
      border: "none",
      color: "var(--color-ink-2)",
    },
    solid: {
      background: "var(--color-green)",
      border: "none",
      color: "#fff",
    },
    outline: {
      background: "transparent",
      border: "1px solid var(--color-border)",
      color: "var(--color-ink-2)",
    },
  };

  function handleClick() {
    if (disabled) return;
    if (!prefersReducedMotion) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
    }
    onClick?.();
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        transform: isPressed ? "scale(0.92)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === "ghost") {
            e.currentTarget.style.background = "var(--color-border-soft)";
            e.currentTarget.style.color = "var(--color-ink)";
          } else if (variant === "solid") {
            e.currentTarget.style.background = "var(--color-green-dark)";
          } else if (variant === "outline") {
            e.currentTarget.style.borderColor = "var(--color-green)";
            e.currentTarget.style.color = "var(--color-green)";
          }
        }
      }}
      onMouseLeave={(e) => {
        if (variant === "ghost") {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--color-ink-2)";
        } else if (variant === "solid") {
          e.currentTarget.style.background = "var(--color-green)";
        } else if (variant === "outline") {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.color = "var(--color-ink-2)";
        }
      }}
    >
      <Icon size={size} />
    </button>
  );
}
