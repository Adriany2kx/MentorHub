import { useState, useRef, useCallback, useEffect } from "react";

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * OTPInput — Family-style one-time password input
 *
 * Features:
 * - Auto-focus next field on digit entry
 * - Scale pulse on digit entry
 * - Shake animation on invalid code
 * - Success animation: all boxes flash green
 * - Paste support with staggered fill
 */
export default function OTPInput({
  length = 6,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = true,
}: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const [activeIndex, setActiveIndex] = useState<number | null>(autoFocus ? 0 : null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset on error change
  useEffect(() => {
    if (error) {
      setValues(Array(length).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [error, length]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (disabled) return;

      // Only allow single digit
      const digit = value.replace(/\D/g, "").slice(-1);

      const newValues = [...values];
      newValues[index] = digit;
      setValues(newValues);

      // Trigger pulse animation
      if (digit) {
        setAnimatingIndex(index);
        setTimeout(() => setAnimatingIndex(null), 200);
      }

      // Move to next field
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        setActiveIndex(index + 1);
      }

      // Check if complete
      const code = newValues.join("");
      if (code.length === length && !code.includes("")) {
        setSuccess(true);
        setTimeout(() => {
          onComplete(code);
          setSuccess(false);
        }, 400);
      }
    },
    [values, length, onComplete, disabled]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === "Backspace") {
        if (values[index]) {
          // Clear current field
          const newValues = [...values];
          newValues[index] = "";
          setValues(newValues);
        } else if (index > 0) {
          // Move to previous field and clear it
          inputRefs.current[index - 1]?.focus();
          setActiveIndex(index - 1);
          const newValues = [...values];
          newValues[index - 1] = "";
          setValues(newValues);
        }
        e.preventDefault();
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        setActiveIndex(index + 1);
      }
    },
    [values, length, disabled]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled) return;

      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

      if (pasted) {
        const newValues = Array(length).fill("");
        pasted.split("").forEach((char, i) => {
          newValues[i] = char;
          // Staggered animation
          setTimeout(() => {
            setAnimatingIndex(i);
            setTimeout(() => setAnimatingIndex(null), 200);
          }, i * 50);
        });
        setValues(newValues);

        // Focus last filled or next empty
        const nextIndex = Math.min(pasted.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
        setActiveIndex(nextIndex);

        // Check if complete
        if (pasted.length === length) {
          setTimeout(() => {
            setSuccess(true);
            setTimeout(() => {
              onComplete(pasted);
              setSuccess(false);
            }, 400);
          }, length * 50 + 100);
        }
      }
    },
    [length, onComplete, disabled]
  );

  const handleFocus = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleBlur = useCallback(() => {
    setActiveIndex(null);
  }, []);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          animation: error ? "otpShake 400ms ease" : "none",
        }}
      >
        {Array.from({ length }).map((_, index) => {
          const isActive = activeIndex === index;
          const isAnimating = animatingIndex === index;
          const hasValue = !!values[index];

          return (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={values[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              disabled={disabled}
              autoFocus={autoFocus && index === 0}
              style={{
                width: 48,
                height: 56,
                border: `2px solid ${
                  error
                    ? "var(--color-error)"
                    : success
                    ? "var(--color-green)"
                    : isActive
                    ? "var(--color-green)"
                    : hasValue
                    ? "var(--color-border)"
                    : "var(--color-border-soft)"
                }`,
                borderRadius: "var(--radius-md)",
                background: success
                  ? "var(--color-green-light)"
                  : error
                  ? "var(--color-error-bg)"
                  : "var(--color-surface)",
                fontSize: 24,
                fontWeight: 600,
                textAlign: "center",
                color: "var(--color-ink)",
                outline: "none",
                transition: "all 150ms ease",
                transform: isAnimating ? "scale(1.1)" : "scale(1)",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "text",
              }}
            />
          );
        })}
      </div>

      {/* Helper text */}
      {error && (
        <p
          style={{
            textAlign: "center",
            marginTop: 12,
            fontSize: 13,
            color: "var(--color-error)",
            animation: "otpFadeIn 200ms ease",
          }}
        >
          Invalid code. Please try again.
        </p>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes otpShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }

        @keyframes otpFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes otpShake { from, to { transform: none; } }
          @keyframes otpFadeIn { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </div>
  );
}
