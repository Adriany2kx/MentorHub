import { forwardRef, useState, useEffect, useRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Input — design system input with floating label, error shake
 *
 * Features:
 * - Focus glow (via CSS)
 * - Error state with shake animation
 * - Optional floating label
 * - Hint text support
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const [shaking, setShaking] = useState(false);
    const prevErrorRef = useRef(error);
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    // Trigger shake when error appears or changes
    useEffect(() => {
      if (error && error !== prevErrorRef.current) {
        setShaking(true);
        const timer = setTimeout(() => setShaking(false), 500);
        return () => clearTimeout(timer);
      }
      prevErrorRef.current = error;
    }, [error]);

    return (
      <div style={{ width: "100%" }}>
        {label && (
          <label htmlFor={inputId} className="wf-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`wf-input ${error ? "wf-input-error" : ""} ${className}`}
          style={{
            animation: shaking ? "inputShake 0.5s ease" : undefined,
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="wf-error-text">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="wf-help-text">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
