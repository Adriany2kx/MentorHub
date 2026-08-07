import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SignIn } from "@clerk/react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="wf-loading-spinner-lg" />
      </div>
    );
  }

  return (
    <main
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link
            to="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 600,
              color: "var(--color-ink)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <img src="/favicon.svg" alt="" style={{ width: 28, height: 24 }} />
            Mentor<span style={{ fontStyle: "italic", fontWeight: 400 }}>Hub</span>
          </Link>
        </div>

        {/* Clerk SignIn Component */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SignIn
            routing="hash"
            signUpUrl="/register"
            appearance={{
              elements: {
                rootBox: { width: "100%" },
                card: {
                  boxShadow: "var(--shadow-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                },
                headerTitle: {
                  fontFamily: "var(--font-display)",
                  color: "var(--color-ink)",
                },
                headerSubtitle: {
                  color: "var(--color-ink-2)",
                },
                formButtonPrimary: {
                  background: "var(--color-teal)",
                  "&:hover": {
                    background: "var(--color-teal-dark)",
                  },
                },
                footerActionLink: {
                  color: "var(--color-teal)",
                },
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}
