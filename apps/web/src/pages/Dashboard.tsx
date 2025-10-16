import { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RoleBadge from "../components/RoleBadge";
import StatusBadge from "../components/StatusBadge";
import { listMySessions, listMyBookings } from "../lib/api";
import type { SessionDetail as ISessionDetail, Booking } from "../lib/api";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState<ISessionDetail[]>([]);
  const [bookingStats, setBookingStats] = useState({ total: 0, active: 0, pending: 0 });

  const displayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : user?.email;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [searchParams] = useSearchParams();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(searchParams.get("welcome") === "1");
  useEffect(() => {
    if (showWelcomeBanner) {
      const t = setTimeout(() => setShowWelcomeBanner(false), 6000);
      return () => clearTimeout(t);
    }
  }, [showWelcomeBanner]);

  useEffect(() => {
    listMySessions()
      .then((d) => {
        const now = new Date();
        const upcoming = d.sessions
          .filter((s) => s.status === "SCHEDULED" && new Date(s.scheduledAt) >= now)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          .slice(0, 3);
        setUpcomingSessions(upcoming);
      })
      .catch(() => {/* silently ignore */});

    listMyBookings()
      .then((d) => {
        const bookings: Booking[] = d.bookings;
        setBookingStats({
          total: bookings.length,
          active: bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED").length,
          pending: bookings.filter((b) => b.status === "PENDING").length,
        });
      })
      .catch(() => {/* silently ignore */});
  }, []);

  if (user && !user.firstName) {
    return <Navigate to="/profile/setup" />;
  }

  const isMentor = user?.role === "MENTOR" || user?.role === "ADMIN";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)] gap-5 items-stretch mb-8">
          <div className="wf-card-flush p-6 lg:p-7">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="max-w-2xl">
                <p className="wf-eyebrow mb-2">Dashboard</p>
                <h1 className="wf-h1">
                  {greeting}{displayName ? `, ${displayName}` : ""}
                </h1>
                <p className="wf-text-sm mt-2 wf-copy" style={{ maxWidth: 58 + "ch" }}>
                  Here's what's happening with your mentorship. Upcoming sessions, profile status,
                  and the next steps are all in one place.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {user && <RoleBadge role={user.role} />}
                <button onClick={logout} className="wf-btn wf-btn-secondary" style={{ fontSize: "0.875rem" }}>
                  Sign out
                </button>
              </div>
            </div>
          </div>

          <div className="wf-card-flush p-6 lg:p-7">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="wf-eyebrow mb-1">At a glance</p>
                <h2 className="wf-h3">Your current momentum</h2>
              </div>
              <span className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="wf-stat p-4">
                <div className="wf-stat-label">Bookings</div>
                <div className="wf-stat-value">{bookingStats.total}</div>
              </div>
              <div className="wf-stat p-4">
                <div className="wf-stat-label">Active</div>
                <div className="wf-stat-value">{bookingStats.active}</div>
              </div>
              <div className="wf-stat p-4">
                <div className="wf-stat-label">Pending</div>
                <div className="wf-stat-value">{bookingStats.pending}</div>
              </div>
              <div className="wf-stat p-4">
                <div className="wf-stat-label">Sessions</div>
                <div className="wf-stat-value">{upcomingSessions.length}</div>
              </div>
            </div>
          </div>
        </div>

        {showWelcomeBanner && (
          <div
            className="wf-success-banner mb-6 rounded-xl flex items-start gap-3 px-5 py-4"
            style={{ background: "var(--color-blue)", color: "#fff" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="11" cy="11" r="10" fill="rgba(255,255,255,0.18)" />
              <path d="M6.5 11.5 L9.5 14.5 L15.5 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold" style={{ fontSize: 15 }}>Your profile is set up — welcome to MentorHub.</p>
              <p style={{ fontSize: 13, opacity: 0.85 }}>Browse mentors to find the right fit, or explore programs to get started.</p>
            </div>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              aria-label="Dismiss"
              style={{ opacity: 0.7, fontSize: 18, lineHeight: 1, cursor: "pointer", background: "none", border: "none", color: "#fff", padding: 0 }}
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="wf-card-flush">
              <div className="wf-card-header" style={{ justifyContent: "space-between" }}>
                <span>Upcoming Sessions</span>
                <Link to="/bookings" className="wf-btn-link" style={{ fontSize: 12 }}>
                  View all →
                </Link>
              </div>
              {upcomingSessions.length === 0 ? (
                <div className="p-6">
                  <div className="wf-empty">
                    <p className="wf-empty-title">No upcoming sessions</p>
                    <p className="wf-empty-text">Sessions you schedule will appear here.</p>
                  </div>
                </div>
              ) : (
                <div>
                  {upcomingSessions.map((s) => {
                    const date = new Date(s.scheduledAt);
                    const otherName = isMentor
                      ? [s.booking.mentee.firstName, s.booking.mentee.lastName].filter(Boolean).join(" ") || "Mentee"
                      : [s.booking.mentor.user.firstName, s.booking.mentor.user.lastName].filter(Boolean).join(" ") || "Mentor";
                    return (
                      <Link
                        key={s.id}
                        to={`/sessions/${s.id}`}
                        className="flex items-center justify-between px-5 py-4 transition-colors"
                        style={{ borderBottom: "1px solid var(--color-border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <div>
                          <p className="wf-text font-medium">{s.booking.program.title}</p>
                          <p className="wf-text-xs mt-0.5">
                            with {otherName} · {s.duration} min
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-4">
                          <div className="text-right">
                            <p className="wf-text-sm font-medium">
                              {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                            <p className="wf-text-xs">
                              {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <StatusBadge status={s.status} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="wf-card-flush">
              <div className="wf-card-header">Your Profile</div>
              <div className="p-5 flex items-center gap-4">
                <div className="wf-avatar wf-avatar-md shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName || "Avatar"} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: "var(--color-blue)", fontWeight: 700 }}>
                      {(user?.firstName?.[0] || user?.email[0] || "?").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="wf-text font-semibold">{displayName}</p>
                  <p className="wf-text-sm truncate">{user?.email}</p>
                  {!user?.isVerified && (
                    <p className="wf-text-xs mt-1" style={{ color: "var(--color-warning)" }}>
                      Email not verified
                    </p>
                  )}
                </div>
                <Link to="/profile/edit" className="wf-btn wf-btn-secondary" style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }}>
                  Edit profile
                </Link>
              </div>
            </div>
          </div>

          <div>
            <p className="wf-eyebrow mb-3">Quick Links</p>
            <div className="wf-card-flush overflow-hidden">
              {[
                { to: "/bookings", label: "My Bookings", sub: "View and manage bookings" },
                { to: "/messages", label: "Messages", sub: "Chat with mentors & mentees" },
                { to: "/goals", label: "My Goals", sub: "Track learning milestones" },
                { to: "/resources", label: "Resources", sub: "Upload and access files" },
                { to: "/mentors", label: "Browse Mentors", sub: "Find the right mentor" },
                { to: "/programs", label: "Browse Programs", sub: "Explore programs" },
                ...(user?.role === "MENTOR" || user?.role === "ADMIN" ? [
                  { to: "/mentor/programs", label: "Manage Programs", sub: "Create and edit programs" },
                  { to: "/mentor/availability", label: "Set Availability", sub: "Manage your schedule" },
                ] : []),
                ...(user?.role === "MENTEE" ? [
                  { to: "/become-mentor", label: "Become a Mentor", sub: "Share your expertise" },
                ] : []),
              ].map(({ to, label, sub }, i, arr) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between px-4 py-3 transition-colors"
                  style={{
                    borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <div>
                    <p className="wf-text font-medium" style={{ color: "var(--color-ink)" }}>{label}</p>
                    <p className="wf-text-xs">{sub}</p>
                  </div>
                  <span style={{ color: "var(--color-ink-3)", fontSize: 16 }}>›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}