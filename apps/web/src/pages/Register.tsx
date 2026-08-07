import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { SignUp } from "@clerk/react";
import { useAuth } from "../context/AuthContext";
import { User, Award, Check } from "lucide-react";

type Role = "mentee" | "mentor";

export default function Register() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<Role>(
    searchParams.get("role") === "mentor" ? "mentor" : "mentee"
  );

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    localStorage.setItem("mentorHub_signupRole", selectedRole);
  }, [selectedRole]);

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

  const benefits = selectedRole === "mentee"
    ? ["AI-powered mentor matching", "Book sessions in minutes", "Track your goals"]
    : ["Set your own rates", "Build your practice", "Get paid weekly"];

  return (
    <main
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
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

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 500,
              color: "var(--color-ink)",
              marginBottom: 8,
            }}
          >
            Create your account
          </h1>
          <p style={{ color: "var(--color-ink-2)", fontSize: 15 }}>
            Join thousands growing with mentorship
          </p>
        </div>

        {/* Role Toggle */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            padding: 4,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <RoleTab
            selected={selectedRole === "mentee"}
            onClick={() => setSelectedRole("mentee")}
            icon={<User size={16} />}
            label="Find a mentor"
          />
          <RoleTab
            selected={selectedRole === "mentor"}
            onClick={() => setSelectedRole("mentor")}
            icon={<Award size={16} />}
            label="Become a mentor"
          />
        </div>

        {/* Benefits */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {benefits.map((text) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 13,
                color: "var(--color-ink-2)",
              }}
            >
              <Check size={14} style={{ color: "var(--color-teal)" }} />
              {text}
            </div>
          ))}
        </div>

        {/* Clerk SignUp */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SignUp
            routing="hash"
            signInUrl="/login"
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

function RoleTab({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 12px",
        fontSize: 14,
        fontWeight: selected ? 600 : 500,
        color: selected ? "var(--color-teal)" : "var(--color-ink-2)",
        background: selected ? "var(--color-teal-bg)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        transition: "all 150ms ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
