import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, ChevronDown, Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { theme, toggleTheme } = useTheme();
  const isMentor = user?.role === "MENTOR" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]
    : "";

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [location.pathname]);

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  const linkStyle = (path: string): React.CSSProperties => ({
    fontSize: "0.9375rem",
    fontWeight: isActive(path) ? 600 : 400,
    color: isActive(path) ? "var(--color-blue)" : "var(--color-ink-2)",
    padding: "7px 11px",
    background: isActive(path)
      ? "color-mix(in oklab, var(--color-blue) 10%, var(--color-surface))"
      : "transparent",
    border: isActive(path)
      ? "1px solid color-mix(in oklab, var(--color-blue) 24%, var(--color-border))"
      : "1px solid transparent",
    borderRadius: "var(--radius-sm)",
    transition: "background 0.1s, color 0.1s",
    textDecoration: "none",
    whiteSpace: "nowrap",
  });

  return (
    <>
      <nav
        style={{
          height: "var(--topnav-height)",
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          gap: 16,
        }}
      >
        {/* ── Left: Logo + primary nav ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Link
            to="/"
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "var(--color-blue)",
              letterSpacing: "-0.015em",
              textDecoration: "none",
              marginRight: 16,
              flexShrink: 0,
              fontFamily: "var(--font-display)",
              lineHeight: 1,
            }}
          >
            Mentor<span style={{ fontStyle: "italic", fontWeight: 450 }}>Hub</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 2 }}>
            {!user ? (
              /* Public nav */
              <>
                <NavLink to="/mentors" label="Browse Mentors" style={linkStyle("/mentors")} />
                <NavLink to="/programs" label="Programs" style={linkStyle("/programs")} />
              </>
            ) : (
              /* Authenticated nav */
              <>
                <NavLink to="/dashboard" label="Dashboard" style={linkStyle("/dashboard")} />
                <NavLink to="/mentors" label="Browse" style={linkStyle("/mentors")} />
                <NavLink to="/bookings" label="Bookings" style={linkStyle("/bookings")} />
                <NavLink to="/messages" label="Messages" style={linkStyle("/messages")} />
                <NavLink to="/goals" label="Goals" style={linkStyle("/goals")} />
                <NavLink to="/resources" label="Resources" style={linkStyle("/resources")} />
                {isMentor && (
                  <NavLink to="/mentor/programs" label="My Programs" style={linkStyle("/mentor/programs")} />
                )}
                {isAdmin && (
                  <NavLink to="/admin" label="Admin" style={{ ...linkStyle("/admin"), color: "var(--color-warning)" }} />
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right: auth actions ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

          {/* Theme toggle — 44×44 touch target */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-ink-2)",
              transition: "background 0.15s ease, color 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--color-bg)";
              (e.currentTarget as HTMLElement).style.color = "var(--color-ink)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "none";
              (e.currentTarget as HTMLElement).style.color = "var(--color-ink-2)";
            }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!user ? (
            <>
              <Link
                to="/login"
                className="hidden sm:inline"
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  color: "var(--color-ink-2)",
                  padding: "7px 12px",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                }}
              >
                Log in
              </Link>
              <Link
                to="/register"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  background: "var(--color-blue)",
                  color: "#fff",
                  padding: "8px 18px",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.background = "var(--color-blue-hover)")}
                onMouseLeave={e => ((e.target as HTMLElement).style.background = "var(--color-blue)")}
              >
                Get started
              </Link>
            </>
          ) : (
            /* Avatar dropdown */
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  borderRadius: "var(--radius-md)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--color-bg)")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "none")}
              >
                <div
                  className="wf-avatar wf-avatar-sm"
                  style={{ background: "var(--color-blue)", border: "none" }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "9999px" }} />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                      {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className="hidden sm:inline"
                  style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)" }}
                >
                  {displayName}
                </span>
                <ChevronDown
                  size={12}
                  style={{ color: "var(--color-ink-3)", transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                />
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    minWidth: 200,
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-dropdown)",
                    padding: "6px 0",
                    zIndex: 50,
                  }}
                >
                  {/* User info header */}
                  <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink)" }}>{displayName}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-ink-3)", marginTop: 1 }}>{user.email}</p>
                  </div>

                  <DropdownItem to="/dashboard" label="Dashboard" />
                  <DropdownItem to="/profile/edit" label="Edit Profile" />
                  <DropdownItem to="/bookings" label="My Bookings" />
                  <DropdownItem to="/messages" label="Messages" />
                  <DropdownItem to="/goals" label="Goals & Progress" />
                  <DropdownItem to="/resources" label="Resources" />
                  {isMentor && (
                    <>
                      <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
                      <DropdownItem to="/mentor/programs" label="Manage Programs" />
                      <DropdownItem to="/mentor/availability" label="Availability" />
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
                      <DropdownItem to="/admin" label="Admin Panel" />
                    </>
                  )}
                  <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 14px",
                      fontSize: "0.875rem",
                      color: "var(--color-error)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--color-bg)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "none")}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: "var(--color-ink-2)",
              borderRadius: "var(--radius-sm)",
            }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            padding: "8px 16px 16px",
            position: "sticky",
            top: "var(--topnav-height)",
            zIndex: 29,
          }}
        >
          {!user ? (
            <>
              <MobileLink to="/mentors" label="Browse Mentors" />
              <MobileLink to="/programs" label="Programs" />
              <MobileLink to="/login" label="Log in" />
              <Link
                to="/register"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 8,
                  padding: "10px",
                  background: "var(--color-blue)",
                  color: "#fff",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                }}
              >
                Get started
              </Link>
            </>
          ) : (
            <>
              <MobileLink to="/dashboard" label="Dashboard" />
              <MobileLink to="/mentors" label="Browse Mentors" />
              <MobileLink to="/bookings" label="My Bookings" />
              <MobileLink to="/messages" label="Messages" />
              <MobileLink to="/goals" label="Goals & Progress" />
              <MobileLink to="/resources" label="Resources" />
              <MobileLink to="/profile/edit" label="Edit Profile" />
              {isMentor && (
                <>
                  <MobileLink to="/mentor/programs" label="Manage Programs" />
                  <MobileLink to="/mentor/availability" label="Availability" />
                </>
              )}
              {isAdmin && <MobileLink to="/admin" label="Admin Panel" />}
              <button
                onClick={logout}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 4px",
                  marginTop: 4,
                      fontSize: "0.9375rem",
                  color: "var(--color-error)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

/* ── Helpers ── */

function NavLink({ to, label, style }: { to: string; label: string; style: React.CSSProperties }) {
  return (
    <Link
      to={to}
      style={style}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "var(--color-bg)";
        (e.currentTarget as HTMLElement).style.color = "var(--color-ink)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "none";
        (e.currentTarget as HTMLElement).style.color = style.color as string;
      }}
    >
      {label}
    </Link>
  );
}

function DropdownItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        padding: "8px 14px",
        fontSize: "0.875rem",
        color: "var(--color-ink)",
        textDecoration: "none",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--color-bg)")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "none")}
    >
      {label}
    </Link>
  );
}

function MobileLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        padding: "10px 4px",
        fontSize: "0.9375rem",
        fontWeight: 500,
        color: "var(--color-ink)",
        borderBottom: "1px solid var(--color-border)",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}
