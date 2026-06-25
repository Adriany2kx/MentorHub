import { useState, useCallback } from "react";
import { Check, ChevronRight, ChevronLeft, X } from "lucide-react";

export interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  isValid?: () => boolean;
}

interface OnboardingWizardProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  allowBack?: boolean;
}

/**
 * OnboardingWizard — Abode-style multi-step onboarding
 *
 * Features:
 * - Progress indicator with animated transitions
 * - Step slides in from right
 * - Skip option with confirmation
 * - Completion celebration
 */
export default function OnboardingWizard({
  steps,
  onComplete,
  onSkip,
  showSkip = true,
  allowBack = true,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = step.isValid ? step.isValid() : true;

  const goNext = useCallback(() => {
    if (!canProceed) return;

    if (isLastStep) {
      setIsCompleting(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } else {
      setDirection("next");
      setCurrentStep((prev) => prev + 1);
    }
  }, [canProceed, isLastStep, onComplete]);

  const goBack = useCallback(() => {
    if (isFirstStep || !allowBack) return;
    setDirection("prev");
    setCurrentStep((prev) => prev - 1);
  }, [isFirstStep, allowBack]);

  const handleSkip = useCallback(() => {
    if (showSkipConfirm) {
      onSkip?.();
    } else {
      setShowSkipConfirm(true);
    }
  }, [showSkipConfirm, onSkip]);

  if (isCompleting) {
    return (
      <div
        style={{
          minHeight: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          animation: "fadeIn 400ms ease-out",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--color-green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            animation: "completePop 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <Check size={40} style={{ color: "#fff" }} />
        </div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "var(--color-ink)",
            margin: "0 0 8px",
            textAlign: "center",
          }}
        >
          You're all set!
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--color-ink-2)",
            margin: 0,
            textAlign: "center",
          }}
        >
          Welcome to MentorHub. Let's get started.
        </p>

        <style>{`
          @keyframes completePop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      {/* Header with progress */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {/* Step counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-ink-3)",
            }}
          >
            Step {currentStep + 1} of {steps.length}
          </span>

          {showSkip && onSkip && (
            <button
              onClick={handleSkip}
              style={{
                fontSize: 12,
                color: showSkipConfirm ? "var(--color-error)" : "var(--color-ink-3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 150ms ease",
              }}
            >
              {showSkipConfirm ? (
                <>
                  <X size={14} />
                  Confirm skip
                </>
              ) : (
                "Skip for now"
              )}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 4,
            background: "var(--color-border-soft)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--color-green)",
              borderRadius: 2,
              transition: "width 300ms ease",
            }}
          />
        </div>

        {/* Step indicators */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
          }}
        >
          {steps.map((s, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div
                key={s.id}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    background: isCompleted
                      ? "var(--color-green)"
                      : isCurrent
                      ? "var(--color-green-light)"
                      : "var(--color-border-soft)",
                    color: isCompleted
                      ? "#fff"
                      : isCurrent
                      ? "var(--color-green-dark)"
                      : "var(--color-ink-3)",
                    border: isCurrent ? "2px solid var(--color-green)" : "none",
                    transition: "all 200ms ease",
                  }}
                >
                  {isCompleted ? <Check size={14} /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: isCompleted
                        ? "var(--color-green)"
                        : "var(--color-border-soft)",
                      transition: "background 200ms ease",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div
        key={step.id}
        style={{
          padding: 24,
          minHeight: 280,
          animation: `stepSlide${direction === "next" ? "In" : "Out"} 300ms ease-out`,
        }}
      >
        <h3
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--color-ink)",
            margin: "0 0 8px",
          }}
        >
          {step.title}
        </h3>
        {step.description && (
          <p
            style={{
              fontSize: 14,
              color: "var(--color-ink-2)",
              margin: "0 0 24px",
              lineHeight: 1.5,
            }}
          >
            {step.description}
          </p>
        )}
        <div>{step.content}</div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-bg)",
        }}
      >
        <button
          onClick={goBack}
          disabled={isFirstStep || !allowBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 500,
            color: isFirstStep || !allowBack ? "var(--color-ink-3)" : "var(--color-ink-2)",
            background: "none",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            cursor: isFirstStep || !allowBack ? "not-allowed" : "pointer",
            opacity: isFirstStep || !allowBack ? 0.5 : 1,
            transition: "all 150ms ease",
          }}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <button
          onClick={goNext}
          disabled={!canProceed}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            background: canProceed ? "var(--color-green)" : "var(--color-ink-3)",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: canProceed ? "pointer" : "not-allowed",
            transition: "all 150ms ease",
          }}
        >
          {isLastStep ? "Complete" : "Continue"}
          {!isLastStep && <ChevronRight size={16} />}
        </button>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes stepSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes stepSlideOut {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes stepSlideIn { from, to { opacity: 1; transform: none; } }
          @keyframes stepSlideOut { from, to { opacity: 1; transform: none; } }
          @keyframes completePop { from, to { transform: scale(1); opacity: 1; } }
        }
      `}</style>
    </div>
  );
}
