import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../lib/api";
import { resetPasswordSchema } from "../lib/validators";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("No reset token provided");
      return;
    }

    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    }
  }

  if (done) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-topbar">
          <div className="wf-topbar-logo">MentorHub</div>
        </div>

        <div className="flex items-center justify-center px-4 py-12">
          <div className="wf-card w-full max-w-120">
            <div className="text-center mb-6">
              <h1 className="wf-h2 mb-2">Password Reset</h1>
              <p className="wf-text-sm">Your password has been reset successfully.</p>
            </div>
            <p className="wf-text-sm text-center mt-6">
              <Link to="/login" className="text-link">Go to Log In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-topbar">
          <div className="wf-topbar-logo">MentorHub</div>
        </div>

        <div className="flex items-center justify-center px-4 py-12">
          <div className="wf-card w-full max-w-120">
            <div className="text-center mb-6">
              <h1 className="wf-h2 mb-2">Invalid Link</h1>
              <p className="wf-text-sm">No reset token found in the URL.</p>
            </div>
            <p className="wf-text-sm text-center mt-6">
              <Link to="/forgot-password" className="text-link">Request a new reset link</Link>
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
            <h1 className="wf-h2 mb-2">Reset Password</h1>
            <p className="wf-text-sm">Choose a new password for your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="wf-label">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="wf-input"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="wf-label">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="wf-input"
              />
            </div>
            {error && <p role="alert" className="wf-error-text">{error}</p>}
            <button type="submit" className="wf-btn wf-btn-primary w-full mt-2">
              Reset Password
            </button>
          </form>

          <p className="wf-text-sm text-center mt-6">
            <Link to="/login" className="text-link">Back to Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
