import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, ChevronDown, Menu, X, LogOut, User, LayoutDashboard, Calendar, MessageSquare, Target, BookOpen, Settings } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { theme, toggleTheme } = useTheme();
  const isMentor = user?.role === "MENTOR" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]
    : "";

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || user.email[0]}`.toUpperCase()
    : "";

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  return (
    <>
      {/* Floating Nav Container */}
      <div
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          width: "calc(100% - 32px)",
          maxWidth: 900,
          transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <nav
          style={{
            background: isScrolled
              ? "rgba(255, 255, 255, 0.85)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-full)",
            boxShadow: isScrolled ? "var(--shadow-float)" : "var(--shadow-md)",
            padding: "8px 8px 8px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-ink)",
              letterSpacing: "-0.02em",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius-sm)",
                background: "var(--color-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>M</span>
            </div>
            <span className="hidden sm:inline">MentorHub</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 4 }}>
            {!user ? (
              <>
                <NavPill to="/mentors" active={isActive("/mentors")}>Mentors</NavPill>
                <NavPill to="/programs" active={isActive("/programs")}>Programs</NavPill>
              </>
            ) : (
              <>
                <NavPill to="/dashboard" active={isActive("/dashboard")}>Dashboard</NavPill>
                <NavPill to="/mentors" active={isActive("/mentors")}>Browse</NavPill>
                <NavPill to="/bookings" active={isActive("/bookings")}>Bookings</NavPill>
                <NavPill to="/messages" active={isActive("/messages")}>Messages</NavPill>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                color: "var(--color-ink-3)",
                transition: "all 150ms ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--color-border-soft)";
                e.currentTarget.style.color = "var(--color-ink)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-ink-3)";
              }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {!user ? (
              <>
                <Link
                  to="/login"
                  className="hidden sm:flex"
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--color-ink-2)",
                    padding: "8px 14px",
                    textDecoration: "none",
                    borderRadius: "var(--radius-full)",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "var(--color-border-soft)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    background: "var(--color-green)",
                    color: "#fff",
                    padding: "8px 18px",
                    borderRadius: "var(--radius-full)",
                    textDecoration: "none",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "var(--color-green-dark)";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "var(--color-green)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Get Started
                </Link>
              </>
            ) : (
              /* User Menu */
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: menuOpen ? "var(--color-border-soft)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 10px 4px 4px",
                    borderRadius: "var(--radius-full)",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={e => {
                    if (!menuOpen) e.currentTarget.style.background = "var(--color-border-soft)";
                  }}
                  onMouseLeave={e => {
                    if (!menuOpen) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--radius-full)",
                      background: "var(--color-green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                        {initials}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    style={{
                      color: "var(--color-ink-3)",
                      transform: menuOpen ? "rotate(180deg)" : "none",
                      transition: "transform 200ms ease",
                    }}
                  />
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      minWidth: 220,
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      boxShadow: "var(--shadow-dropdown)",
                      padding: 8,
                      animation: "fadeSlideUp 200ms ease-out",
                    }}
                  >
                    {/* User Info */}
                    <div style={{ padding: "8px 12px", marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                        {displayName}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 2 }}>
                        {user.email}
                      </p>
                    </div>

                    <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />

                    <DropdownLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <DropdownLink to="/profile/edit" icon={User} label="Edit Profile" />
                    <DropdownLink to="/bookings" icon={Calendar} label="My Bookings" />
                    <DropdownLink to="/messages" icon={MessageSquare} label="Messages" />
                    <DropdownLink to="/goals" icon={Target} label="Goals" />
                    <DropdownLink to="/resources" icon={BookOpen} label="Resources" />

                    {isMentor && (
                      <>
                        <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
                        <DropdownLink to="/mentor/programs" icon={Settings} label="Manage Programs" />
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
                        <DropdownLink to="/admin" icon={Settings} label="Admin Panel" />
                      </>
                    )}

                    <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />

                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 14,
                        color: "var(--color-error)",
                        background: "none",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "background 150ms ease",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "var(--color-error-bg)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(o => !o)}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: mobileOpen ? "var(--color-green)" : "transparent",
                border: "none",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                color: mobileOpen ? "#fff" : "var(--color-ink-2)",
                transition: "all 150ms ease",
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            className="md:hidden"
            style={{
              marginTop: 8,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-float)",
              padding: 8,
              animation: "fadeSlideUp 200ms ease-out",
            }}
          >
            {!user ? (
              <>
                <MobileLink to="/mentors" label="Browse Mentors" />
                <MobileLink to="/programs" label="Programs" />
                <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
                <MobileLink to="/login" label="Log in" />
                <Link
                  to="/register"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 8,
                    padding: "12px",
                    background: "var(--color-green)",
                    color: "#fff",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <MobileLink to="/dashboard" label="Dashboard" />
                <MobileLink to="/mentors" label="Browse Mentors" />
                <MobileLink to="/bookings" label="My Bookings" />
                <MobileLink to="/messages" label="Messages" />
                <MobileLink to="/goals" label="Goals" />
                <MobileLink to="/resources" label="Resources" />
                <MobileLink to="/profile/edit" label="Edit Profile" />
                {isMentor && <MobileLink to="/mentor/programs" label="Manage Programs" />}
                {isAdmin && <MobileLink to="/admin" label="Admin Panel" />}
                <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
                <button
                  onClick={logout}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--color-error)",
                    background: "none",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Spacer to push content below floating nav */}
      <div style={{ height: 80 }} />
    </>
  );
}

/* ── Helper Components ── */

function NavPill({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? "var(--color-green)" : "var(--color-ink-2)",
        padding: "8px 14px",
        borderRadius: "var(--radius-full)",
        background: active ? "var(--color-green-light)" : "transparent",
        textDecoration: "none",
        transition: "all 150ms ease",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = "var(--color-border-soft)";
          e.currentTarget.style.color = "var(--color-ink)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--color-ink-2)";
        }
      }}
    >
      {children}
    </Link>
  );
}

function DropdownLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        fontSize: 14,
        color: "var(--color-ink)",
        textDecoration: "none",
        borderRadius: "var(--radius-sm)",
        transition: "background 150ms ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "var(--color-border-soft)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon size={16} style={{ color: "var(--color-ink-3)" }} />
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
        padding: "12px",
        fontSize: 14,
        fontWeight: 500,
        color: "var(--color-ink)",
        textDecoration: "none",
        borderRadius: "var(--radius-sm)",
        transition: "background 150ms ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "var(--color-border-soft)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {label}
    </Link>
  );
}
