import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
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

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="flex items-center justify-center px-4 py-16">
        <div className="wf-card w-full max-w-md p-8 text-center">

          {sent ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#E8F0EF" }}>
                  <Mail size={24} style={{ color: "#2E6A64" }} />
                </div>
              </div>
              <h1 className="wf-h2 mb-2">Check your email</h1>
              <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)" }}>
                If that address is registered, we've sent a password reset link.
              </p>
              <Link to="/login" className="text-link wf-text-sm">Back to log in</Link>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="wf-h2 mb-2">Forgot password?</h1>
                <p className="wf-text" style={{ color: "var(--color-ink-2)" }}>
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 text-left">
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
                  className="wf-btn wf-btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="wf-text-sm text-center mt-6">
                <Link to="/login" className="text-link">Back to log in</Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
