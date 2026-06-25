import { useState, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  name?: string;
  id?: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "var(--color-border)" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "var(--color-error)" };
  if (score <= 2) return { score: 2, label: "Fair", color: "var(--color-warn)" };
  if (score <= 3) return { score: 3, label: "Good", color: "var(--color-green)" };
  return { score: 4, label: "Strong", color: "var(--color-green-dark)" };
}

/**
 * PasswordInput — Animated password field with strength indicator
 *
 * Features:
 * - Eye icon with smooth morph (closed → open)
 * - Animated strength indicator bar
 * - Subtle field background color shift during reveal
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = "Enter password",
  showStrength = false,
  error,
  disabled = false,
  autoComplete = "current-password",
  name,
  id,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const strength = getStrength(value);

  const toggleVisibility = useCallback(() => {
    setIsAnimating(true);
    setVisible((v) => !v);
    setTimeout(() => setIsAnimating(false), 200);
  }, []);

  return (
    <div>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          name={name}
          id={id}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: "100%",
            padding: "10px 44px 10px 14px",
            fontSize: 14,
            border: `1px solid ${
              error
                ? "var(--color-error)"
                : isFocused
                ? "var(--color-green)"
                : "var(--color-border)"
            }`,
            borderRadius: "var(--radius-md)",
            background: visible
              ? "var(--color-green-light)"
              : "var(--color-surface)",
            color: "var(--color-ink)",
            outline: "none",
            transition: "all 200ms ease",
            opacity: disabled ? 0.5 : 1,
          }}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          style={{
            position: "absolute",
            right: 8,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: disabled ? "not-allowed" : "pointer",
            color: "var(--color-ink-3)",
            transition: "all 150ms ease",
            transform: isAnimating ? "scale(0.9)" : "scale(1)",
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = "var(--color-border-soft)";
              e.currentTarget.style.color = "var(--color-ink)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "var(--color-ink-3)";
          }}
        >
          <div
            style={{
              transition: "transform 200ms ease, opacity 150ms ease",
              transform: isAnimating ? "rotateY(90deg)" : "rotateY(0)",
            }}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </button>
      </div>

      {/* Strength indicator */}
      {showStrength && value && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 4,
            }}
          >
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background:
                    level <= strength.score
                      ? strength.color
                      : "var(--color-border-soft)",
                  transition: "all 300ms ease",
                  transitionDelay: `${level * 50}ms`,
                }}
              />
            ))}
          </div>
          <p
            style={{
              fontSize: 12,
              color: strength.color,
              margin: 0,
              transition: "color 300ms ease",
            }}
          >
            {strength.label}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p
          style={{
            fontSize: 12,
            color: "var(--color-error)",
            margin: "6px 0 0",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
