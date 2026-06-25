import { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { CheckCircle, X, Sparkles, User, Calendar, TrendingUp, Clock, Target } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import RoleBadge from "../components/RoleBadge";
import StatusBadge from "../components/StatusBadge";
import { AnimatedNumber } from "../components/animations";
import { listMySessions, listMyBookings, getMentorRecommendations, getProfileQuality, getMentor, getProgressInsights } from "../lib/api";
import type { SessionDetail as ISessionDetail, Booking, AiMentorRecommendation, AiProfileQuality, MentorDetail, AiInsights } from "../lib/api";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState<ISessionDetail[]>([]);
  const [bookingStats, setBookingStats] = useState({ total: 0, active: 0, pending: 0 });
  const [recommendations, setRecommendations] = useState<AiMentorRecommendation[]>([]);
  const [recommendedMentors, setRecommendedMentors] = useState<Record<string, MentorDetail>>({});
  const [recLoading, setRecLoading] = useState(false);
  const [profileInsufficient, setProfileInsufficient] = useState(false);
  const [profileQuality, setProfileQuality] = useState<AiProfileQuality | null>(null);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

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

  useEffect(() => {
    if (user?.role !== "MENTEE") return;

    getProfileQuality().then(setProfileQuality).catch(() => {});

    async function fetchInsights() {
      setInsightsLoading(true);
      try {
        const d = await getProgressInsights();
        setInsights(d.insights);
      } catch { /* silently ignore */ }
      finally { setInsightsLoading(false); }
    }
    void fetchInsights();

    setRecLoading(true);
    getMentorRecommendations()
      .then(({ recommendations: recs, profileInsufficient: insufficient }) => {
        setRecommendations(recs);
        setProfileInsufficient(!!insufficient);
        return Promise.all(recs.map((r) => getMentor(r.mentorId).catch(() => null)));
      })
      .then((mentors) => {
        const map: Record<string, MentorDetail> = {};
        mentors.forEach((m) => { if (m) map[m.mentor.id] = m.mentor; });
        setRecommendedMentors(map);
      })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, [user?.role]);

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
              <StatCard
                icon={Calendar}
                label="Bookings"
                value={bookingStats.total}
                color="var(--color-green)"
              />
              <StatCard
                icon={TrendingUp}
                label="Active"
                value={bookingStats.active}
                color="var(--color-success)"
              />
              <StatCard
                icon={Clock}
                label="Pending"
                value={bookingStats.pending}
                color="var(--color-warning)"
              />
              <StatCard
                icon={Target}
                label="Sessions"
                value={upcomingSessions.length}
                color="var(--color-blue)"
              />
            </div>
          </div>
        </div>

        {showWelcomeBanner && (
          <div
            className="wf-success-banner mb-6 rounded-xl flex items-start gap-3 px-5 py-4"
            style={{ background: "var(--color-blue)", color: "#fff" }}
          >
            <CheckCircle size={22} style={{ flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <p className="font-semibold" style={{ fontSize: 15 }}>Your profile is set up — welcome to MentorHub.</p>
              <p style={{ fontSize: 13, opacity: 0.85 }}>Browse mentors to find the right fit, or explore programs to get started.</p>
            </div>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              aria-label="Dismiss"
              style={{ opacity: 0.7, cursor: "pointer", background: "none", border: "none", color: "#fff", padding: 0 }}
            >
              <X size={18} />
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

          <div className="space-y-5">
            {user?.role === "MENTEE" && profileQuality && (
              <div className="wf-card-flush">
                <div className="wf-card-header">Profile Quality</div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="wf-text font-semibold">{profileQuality.score}/100</span>
                    <span
                      className="wf-text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: profileQuality.score >= 80 ? "var(--color-success-bg, #d1fae5)" : profileQuality.score >= 50 ? "var(--color-warn-bg, #fef3c7)" : "var(--color-error-bg, #fee2e2)",
                        color: profileQuality.score >= 80 ? "var(--color-success, #065f46)" : profileQuality.score >= 50 ? "var(--color-warn, #92400e)" : "var(--color-error, #991b1b)",
                      }}
                    >
                      {profileQuality.score >= 80 ? "Strong" : profileQuality.score >= 50 ? "Good" : "Needs work"}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: "var(--color-border)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${profileQuality.score}%`,
                        background: profileQuality.score >= 80 ? "var(--color-success, #10b981)" : profileQuality.score >= 50 ? "var(--color-warn, #f59e0b)" : "var(--color-error, #ef4444)",
                      }}
                    />
                  </div>
                  {profileQuality.suggestions.length > 0 && (
                    <ul className="space-y-1">
                      {profileQuality.suggestions.map((s) => (
                        <li key={s}>
                          <Link
                            to="/profile/edit"
                            className="wf-text-xs flex items-center gap-2 py-1 rounded transition-colors no-underline"
                            style={{ color: "var(--color-ink-2)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-blue)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-ink-2)")}
                          >
                            <span style={{ color: "var(--color-warn, #f59e0b)", flexShrink: 0 }}>→</span>
                            {s}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

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
                  { to: "/mentor/payments", label: "My Earnings", sub: "View completed session payments" },
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

        {user?.role === "MENTEE" && (insights || insightsLoading) && (
          <div className="mt-5 wf-card-flush">
            <div className="wf-card-header" style={{ justifyContent: "space-between" }}>
              <span>Weekly Progress Insights</span>
              <span className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>AI · refreshes every 24h</span>
            </div>
            {insightsLoading && (
              <div className="p-5 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Analysing your progress…</div>
            )}
            {insights && (
              <div className="p-5 space-y-4">
                {insights.highlights.length > 0 && (
                  <div>
                    <p className="wf-eyebrow mb-2">Highlights</p>
                    <ul className="space-y-1">
                      {insights.highlights.map((h, i) => (
                        <li key={i} className="wf-text-sm flex gap-2">
                          <span style={{ color: "var(--color-success, #10b981)" }}>✓</span> {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {insights.stalledAreas.length > 0 && (
                  <div>
                    <p className="wf-eyebrow mb-2">Needs Attention</p>
                    <ul className="space-y-1">
                      {insights.stalledAreas.map((a, i) => (
                        <li key={i} className="wf-text-sm flex gap-2">
                          <span style={{ color: "var(--color-warn, #f59e0b)" }}>→</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {insights.recommendations.length > 0 && (
                  <div>
                    <p className="wf-eyebrow mb-2">Recommendations</p>
                    <ul className="space-y-1">
                      {insights.recommendations.map((r, i) => (
                        <li key={i} className="wf-text-sm flex gap-2">
                          <span style={{ color: "var(--color-blue)" }}>•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="wf-text-xs pt-2" style={{ color: "var(--color-ink-3)", borderTop: "1px solid var(--color-border)" }}>
                  Session frequency: {insights.sessionFrequency}
                </p>
              </div>
            )}
          </div>
        )}

        {user?.role === "MENTEE" && (
          <div className="mt-5 wf-card-flush">
            <div className="wf-card-header" style={{ justifyContent: "space-between" }}>
              <span>AI Mentor Recommendations</span>
              <Link to="/mentors" className="wf-btn-link" style={{ fontSize: 12 }}>Browse all →</Link>
            </div>
            {recLoading ? (
              <div className="p-6 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Finding your best mentor matches…</div>
            ) : recommendations.length === 0 ? (
              <div className="p-6">
                <div className="wf-empty">
                  {profileInsufficient ? (
                    <>
                      <User size={48} className="mx-auto mb-3" style={{ color: "var(--color-ink-3)" }} />
                      <p className="wf-empty-title">Complete your profile for better matches</p>
                      <p className="wf-empty-text">Add your current role, target role, and goals so we can find the right mentors for you.</p>
                      <Link to="/profile/edit" className="wf-btn wf-btn-primary mt-4" style={{ display: "inline-block" }}>Complete profile</Link>
                    </>
                  ) : (
                    <>
                      <Sparkles size={48} className="mx-auto mb-3" style={{ color: "var(--color-ink-3)" }} />
                      <p className="wf-empty-title">No recommendations yet</p>
                      <p className="wf-empty-text">We couldn't find strong matches right now. Try browsing all mentors.</p>
                      <Link to="/mentors" className="wf-btn wf-btn-secondary mt-4" style={{ display: "inline-block" }}>Browse mentors</Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {recommendations.map((rec) => {
                  const mentor = recommendedMentors[rec.mentorId];
                  const name = mentor
                    ? `${mentor.user.firstName ?? ""} ${mentor.user.lastName ?? ""}`.trim() || "Mentor"
                    : "Loading…";
                  return (
                    <Link
                      key={rec.mentorId}
                      to={`/mentors/${rec.mentorId}`}
                      className="flex items-center justify-between px-5 py-4 transition-colors no-underline"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="wf-text font-medium">{name}</p>
                        {mentor?.headline && (
                          <p className="wf-text-xs truncate mt-0.5" style={{ color: "var(--color-ink-3)" }}>{mentor.headline}</p>
                        )}
                        <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-2)" }}>{rec.reason}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background: rec.score >= 70 ? "var(--color-success-bg, #d1fae5)" : "var(--color-warn-bg, #fef3c7)",
                            color: rec.score >= 70 ? "var(--color-success, #065f46)" : "var(--color-warn, #92400e)",
                          }}
                        >
                          {rec.score}% match
                        </span>
                        <span style={{ color: "var(--color-ink-3)" }}>›</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── StatCard Component ── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 16,
        position: "relative",
        overflow: "hidden",
        transition: "all 200ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-sm)",
          background: `color-mix(in oklab, ${color} 12%, var(--color-surface))`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon size={16} style={{ color }} />
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--color-ink)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <AnimatedNumber value={value} duration={800} />
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--color-ink-3)",
          marginTop: 4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
    </div>
  );
}