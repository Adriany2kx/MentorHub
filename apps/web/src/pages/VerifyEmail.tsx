import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../lib/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
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
      <div className="wf-topbar">
        <div className="wf-topbar-logo">MentorHub</div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="wf-card w-full max-w-120">
          <div className="text-center mb-6">
            <h1 className="wf-h2 mb-2">Email Verification</h1>
            {status === "loading" && (
              <div className="inline-flex items-center gap-2 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
                <span className="wf-loading-spinner" aria-hidden="true" />
                <span>Verifying your email...</span>
              </div>
            )}
            {status === "success" && (
              <p className="wf-text-sm" style={{ color: "var(--color-success)" }}>{message}</p>
            )}
            {status === "error" && (
              <p className="wf-text-sm" style={{ color: "var(--color-error)" }}>{message}</p>
            )}
          </div>

          {(status === "success" || status === "error") && (
            <p className="wf-text-sm text-center mt-6">
              <Link to="/login" className="text-link">Go to Log In</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
