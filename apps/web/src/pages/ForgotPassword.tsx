import { useState } from "react";
import { Link } from "react-router-dom";
import { requestReset } from "../lib/api";
import { requestResetSchema } from "../lib/validators";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = requestResetSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      await requestReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-topbar">
          <div className="wf-topbar-logo">MentorHub</div>
        </div>

        <div className="flex items-center justify-center px-4 py-12">
          <div className="wf-card w-full max-w-120">
            <div className="text-center mb-6">
              <h1 className="wf-h2 mb-2">Check Your Email</h1>
              <p className="wf-text">If that email exists, we sent a reset link.</p>
            </div>
            <p className="wf-text text-center mt-6">
              <Link to="/login" className="text-link">Back to Log In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="wf-card w-full max-w-120">
          <div className="text-center mb-6">
            <h1 className="wf-h2 mb-2">Forgot Password</h1>
            <p className="wf-text">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="wf-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className="wf-input"
              />
            </div>
            {error && <p role="alert" className="wf-error-text">{error}</p>}
            <button
              type="submit"
              className="wf-btn wf-btn-primary w-full mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>

          <p className="wf-text text-center mt-6">
            <Link to="/login" className="text-link">Back to Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
