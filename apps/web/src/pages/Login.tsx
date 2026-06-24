import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { loginSchema } from "../lib/validators";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const token = failedAttempts >= 4 ? recaptchaToken : undefined;
      await login(email, password, token ?? undefined);
      setFailedAttempts(0);
      setRecaptchaToken(null);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      setFailedAttempts((prev) => prev + 1);
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="flex items-center justify-center px-4 py-16">
        <div className="wf-card w-full max-w-md p-8">
          <div className="text-center mb-6">
            <h1 className="wf-h2 mb-2">Welcome Back</h1>
            <p className="wf-text" style={{ color: "var(--color-ink-2)" }}>Log in to continue your growth journey</p>
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
            <div>
              <label htmlFor="password" className="wf-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="wf-input"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-ink-3)",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="wf-error-text">{error}</p>}
            {failedAttempts >= 4 && (
              <div className="flex justify-center py-4">
                <ReCAPTCHA
                  sitekey="6LdHe_csAAAAAG54AZsWx97lL6EPFhZxyh18SuRW"
                  onChange={(token) => setRecaptchaToken(token)}
                  onExpired={() => setRecaptchaToken(null)}
                  onErrored={() => setRecaptchaToken(null)}
                />
              </div>
            )}
            <button
              type="submit"
              className="wf-btn wf-btn-primary w-full mt-2"
              disabled={isLoading || (failedAttempts >= 4 && recaptchaToken === null)}
            >
              {isLoading ? "Logging in…" : "Log In"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <p className="wf-text">
              <Link to="/forgot-password" className="text-link">Forgot password?</Link>
            </p>
            <p className="wf-text">
              Don't have an account? <Link to="/register" className="text-link">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
