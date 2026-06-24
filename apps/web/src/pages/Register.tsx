import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { registerSchema } from "../lib/validators";

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="wf-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="wf-input"
          style={{ paddingRight: 40 }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
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
          {show ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = registerSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, recaptchaToken || undefined);
      navigate("/verify-email?sent=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="flex items-center justify-center px-4 py-16">
        <div className="wf-card w-full max-w-md p-8">
          <div className="text-center mb-6">
            <h1 className="wf-h2 mb-2">Create Account</h1>
            <p className="wf-text" style={{ color: "var(--color-ink-2)" }}>Join MentorHub to get started</p>
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
            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LdHe_csAAAAAG54AZsWx97lL6EPFhZxyh18SuRW"
              onChange={setRecaptchaToken}
            />
            {error && <p role="alert" className="wf-error-text">{error}</p>}
            <button
              type="submit"
              className="wf-btn wf-btn-primary w-full mt-2"
              disabled={isLoading || recaptchaToken === null}
            >
              {isLoading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="wf-text text-center mt-6">
            Already have an account? <Link to="/login" className="text-link">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
