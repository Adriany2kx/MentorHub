import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "wf-btn wf-btn-primary",
  secondary: "wf-btn wf-btn-secondary",
  danger: "wf-btn wf-btn-danger",
  ghost: "wf-btn wf-btn-link",
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "6px 12px", fontSize: 13 },
  md: { padding: "9px 18px", fontSize: 14 },
  lg: { padding: "12px 24px", fontSize: 15 },
};

/**
 * Button — design system button with loading state
 *
 * Features:
 * - Hover lift + press scale (via CSS)
 * - Loading spinner replaces content
 * - Icon support
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, children, disabled, className = "", style, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`${variantClasses[variant]} ${loading ? "wf-btn-loading" : ""} ${className}`}
        disabled={isDisabled}
        style={{ ...sizeStyles[size], ...style }}
        {...props}
      >
        {!loading && icon && <span style={{ display: "flex", marginRight: 6 }}>{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
