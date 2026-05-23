import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail, resendVerificationEmail } from "../lib/api";

const BACKOFF_STEPS = [30, 60, 120, 240, 480];

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"sent" | "loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStep, setResendStep] = useState(0);
  const [resendMsg, setResendMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown(seconds: number) {
    setResendCooldown(seconds);
    timerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    try {
      await resendVerificationEmail();
      setResendMsg("Email sent! Check your inbox.");
      const wait = BACKOFF_STEPS[Math.min(resendStep, BACKOFF_STEPS.length - 1)];
      setResendStep(s => s + 1);
      startCooldown(wait);
    } catch {
      setResendMsg("Failed to send. Please try again.");
    }
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (searchParams.get("sent") === "true") {
      setStatus("sent");
      return;
    }

    const token = searchParams.get("token");
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="flex items-center justify-center px-4 py-16">
        <div className="wf-card w-full max-w-md p-8 text-center">

          {status === "loading" && (
            <>
              <h1 className="wf-h2 mb-2">Verifying your email</h1>
              <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)" }}>Just a moment…</p>
              <div className="flex justify-center">
                <span className="wf-loading-spinner" aria-hidden="true" />
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <circle cx="24" cy="24" r="24" fill="#E6F4ED" />
                  <path d="M15 24l7 7 11-11" stroke="#2F7A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="wf-h2 mb-2">Email verified</h1>
              <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)" }}>
                Your account is active. You're ready to start your mentorship journey.
              </p>
              <Link to="/login" className="wf-btn wf-btn-primary w-full" style={{ display: "block" }}>
                Continue to log in
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center mb-4">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <circle cx="24" cy="24" r="24" fill="#FBEAEA" />
                  <path d="M17 17l14 14M31 17L17 31" stroke="#B74943" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="wf-h2 mb-2">Link expired</h1>
              <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)" }}>
                {message || "This verification link is invalid or has expired."}
              </p>
              <Link to="/login" className="wf-btn wf-btn-secondary w-full" style={{ display: "block" }}>
                Back to log in
              </Link>
            </>
          )}

          {status === "sent" && (
            <>
              <div className="flex justify-center mb-4">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <circle cx="24" cy="24" r="24" fill="#E8F0EF" />
                  <path d="M13 18l11 8 11-8M13 18v14h22V18M13 18h22" stroke="#2E6A64" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="wf-h2 mb-2">Check your email</h1>
              <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)" }}>
                We've sent a verification link to your inbox. Click it to activate your account.
              </p>
              <div className="space-y-3">
                <button
                  className="wf-btn wf-btn-primary w-full"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
                </button>
                {resendMsg && (
                  <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>{resendMsg}</p>
                )}
                <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
                  <Link to="/login" className="text-link">Back to log in</Link>
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
