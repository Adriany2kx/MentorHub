import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAdminStats, listAdminUsers } from "../lib/api";
import type { AdminStats, AdminUser } from "../lib/api";

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="wf-stat">
      <p className="wf-stat-label">{label}</p>
      <p className="wf-stat-value">{value}</p>
      {sub && <p className="wf-stat-sub">{sub}</p>}
    </div>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Users", to: "/admin/users" },
    { label: "Mentors", to: "/admin/mentors" },
    { label: "Programs", to: "/admin/programs" },
    { label: "Payments", to: "/admin/payments" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Dark sidebar — Notion/Linear Tier 4 */}
      <aside className="wf-sidebar" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* User identity */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="wf-avatar wf-avatar-sm" style={{ background: "rgba(74,111,165,0.4)", border: "none" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
                {(user?.firstName?.[0] ?? user?.email?.[0] ?? "A").toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.firstName || user?.email?.split("@")[0] || "Admin"}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3">
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", padding: "0 16px 6px" }}>
            Admin
          </p>
          {navItems.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== "/admin" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`wf-sidebar-link${active ? " active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            to="/dashboard"
            style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 8, textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
          >
            ← Back to app
          </Link>
          <button
            onClick={logout}
            style={{ fontSize: 12, color: "rgba(192,57,43,0.8)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = "var(--color-error)")}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(192,57,43,0.8)")}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--color-bg)" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getAdminStats(), listAdminUsers({ limit: 5 } as Parameters<typeof listAdminUsers>[0])])
      .then(([s, u]) => {
        setStats(s.stats);
        setRecentUsers(u.users);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="wf-page">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="wf-stat opacity-40 animate-pulse" style={{ minHeight: 88 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="wf-page">
      <div className="wf-page-header flex items-center justify-between">
        <h1 className="wf-h1">Admin Dashboard</h1>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            sub={`${stats.totalMentors} mentors · ${stats.totalMentees} mentees`}
          />
          <StatCard
            label="Active Sessions"
            value={stats.activeSessions.toLocaleString()}
            sub={`${stats.totalSessions} total`}
          />
          <StatCard
            label="Published Programs"
            value={stats.totalPrograms.toLocaleString()}
            sub={`${stats.activeBookings} active bookings`}
          />
          <StatCard
            label="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            sub={`${stats.totalBookings} bookings`}
          />
        </div>
      )}

      {/* Pending mentors banner */}
      {stats && stats.pendingMentors > 0 && (
        <div className="border border-warn bg-paper-2 px-4 py-3 mb-6 flex items-center justify-between">
          <p className="wf-text-sm" style={{ color: "var(--color-warn)" }}>
            {stats.pendingMentors} mentor{stats.pendingMentors !== 1 ? "s" : ""} awaiting approval
          </p>
          <Link to="/admin/mentors" className="wf-btn wf-btn-secondary" style={{ fontSize: 9 }}>
            Review →
          </Link>
        </div>
      )}

      {/* Recent Users */}
      <div className="wf-card-flush">
        <div className="wf-card-header flex items-center justify-between">
          <span>Recent Users</span>
          <Link to="/admin/users" className="text-link" style={{ fontSize: 9, textTransform: "none", letterSpacing: 0 }}>
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => {
                const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
                return (
                  <tr key={u.id}>
                    <td className="text-ink font-medium">{name}</td>
                    <td className="text-ink-2">{u.email}</td>
                    <td>
                      <span className="wf-badge wf-badge-info">{u.role}</span>
                    </td>
                    <td className="text-ink-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`wf-badge ${u.isVerified ? "wf-badge-success" : "wf-badge-warn"}`}>
                        {u.isVerified ? "Active" : "Unverified"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/admin/users`)}
                        className="wf-btn wf-btn-link"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
