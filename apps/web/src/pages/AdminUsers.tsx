import { useState, useEffect, useCallback } from "react";
import { listAdminUsers, updateAdminUser, banUser, suspendUser } from "../lib/api";
import type { AdminUser, Role } from "../lib/api";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "wf-badge-info",
  MENTOR: "wf-badge-success",
  MENTEE: "wf-badge-neutral",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [suspendingUserId, setSuspendingUserId] = useState<string | null>(null);
  const [suspendDate, setSuspendDate] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    listAdminUsers({ page, search: search || undefined, role: roleFilter || undefined })
      .then((d) => {
        setUsers(d.users);
        setTotalPages(d.pagination.totalPages);
        setTotal(d.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  async function handleRoleChange(userId: string, role: Role) {
    setUpdating(userId);
    try {
      const res = await updateAdminUser(userId, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: res.user.role } : u)));
    } catch {/* ignore */}
    finally { setUpdating(null); }
  }

  async function handleVerify(userId: string, isVerified: boolean) {
    setUpdating(userId);
    try {
      await updateAdminUser(userId, { isVerified });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isVerified } : u)));
    } catch {/* ignore */}
    finally { setUpdating(null); }
  }

  async function handleBan(userId: string, banned: boolean) {
    setUpdating(userId);
    try {
      await banUser(userId, banned);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBanned: banned } : u)));
    } catch {/* ignore */}
    finally { setUpdating(null); }
  }

  async function handleSuspend(userId: string) {
    if (!suspendDate) return;
    setUpdating(userId);
    try {
      await suspendUser(userId, suspendDate);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, suspendedUntil: suspendDate } : u)));
      setSuspendingUserId(null);
      setSuspendDate("");
    } catch {/* ignore */}
    finally { setUpdating(null); }
  }

  async function handleClearSuspend(userId: string) {
    setUpdating(userId);
    try {
      await suspendUser(userId, null);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, suspendedUntil: null } : u)));
    } catch {/* ignore */}
    finally { setUpdating(null); }
  }

  return (
    <div className="wf-page">
      <div className="wf-page-header flex items-center justify-between">
        <h1 className="wf-h1">Manage Users</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email..."
          className="wf-input-box flex-1 max-w-md"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="wf-input-box"
          style={{ width: "auto" }}
        >
          <option value="">All Roles</option>
          <option value="MENTEE">Mentee</option>
          <option value="MENTOR">Mentor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="wf-card-flush">
        <div className="wf-card-header">
          {loading ? "Loading..." : `Showing ${users.length} of ${total} users`}
        </div>
        <div className="overflow-x-auto">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Verification</th>
                <th>Safety</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="opacity-40 animate-pulse">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j}>
                        <div className="h-3 w-24" style={{ background: "var(--color-bg)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="wf-empty">
                      <p className="wf-empty-title">No users found</p>
                      <p className="wf-empty-text">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
                  const isUpdating = updating === u.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="wf-avatar wf-avatar-xs object-cover" />
                          ) : (
                            <span className="wf-avatar wf-avatar-xs">
                              {(u.firstName?.[0] ?? u.email[0]).toUpperCase()}
                            </span>
                          )}
                          <span className="font-medium" style={{ color: "var(--color-ink)" }}>{name}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--color-ink-2)" }}>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                          className={`wf-badge ${ROLE_BADGE[u.role]} cursor-pointer border-current`}
                          style={{ background: "transparent", fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600, padding: "2px 8px" }}
                        >
                          <option value="MENTEE">Mentee</option>
                          <option value="MENTOR">Mentor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td style={{ color: "var(--color-ink-2)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`wf-badge ${u.isVerified ? "wf-badge-success" : "wf-badge-warn"}`}>
                          {u.isVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td>
                        {u.isBanned && (
                          <span className="wf-badge wf-badge-danger">BANNED</span>
                        )}
                        {u.suspendedUntil && new Date(u.suspendedUntil) > new Date() && (
                          <span className="wf-badge wf-badge-warn">SUSPENDED</span>
                        )}
                        {!u.isBanned && (!u.suspendedUntil || new Date(u.suspendedUntil) <= new Date()) && (
                          <span className="wf-badge wf-badge-success">ACTIVE</span>
                        )}
                      </td>
                      <td className="space-y-2">
                        <div className="flex flex-col gap-2">
                          {!u.isVerified && (
                            <button
                              onClick={() => handleVerify(u.id, true)}
                              disabled={isUpdating}
                              className="wf-btn wf-btn-secondary text-xs py-1"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleBan(u.id, !u.isBanned)}
                            disabled={isUpdating}
                            className={`wf-btn text-xs py-1 ${u.isBanned ? "wf-btn-secondary" : "wf-btn-danger"}`}
                          >
                            {u.isBanned ? "Unban" : "Ban"}
                          </button>
                          {suspendingUserId === u.id ? (
                            <div className="flex gap-1 items-end">
                              <input
                                type="datetime-local"
                                value={suspendDate}
                                onChange={(e) => setSuspendDate(e.target.value)}
                                className="wf-input-box text-xs py-1 flex-1"
                              />
                              <button
                                onClick={() => handleSuspend(u.id)}
                                disabled={!suspendDate || isUpdating}
                                className="wf-btn wf-btn-primary text-xs py-1"
                              >
                                Set
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSuspendingUserId(u.id)}
                              disabled={isUpdating}
                              className="wf-btn wf-btn-secondary text-xs py-1"
                            >
                              Suspend
                            </button>
                          )}
                          {u.suspendedUntil && (
                            <button
                              onClick={() => handleClearSuspend(u.id)}
                              disabled={isUpdating}
                              className="wf-btn wf-btn-secondary text-xs py-1"
                            >
                              Clear Suspension
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <p className="wf-text-xs">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="wf-btn wf-btn-secondary"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="wf-btn wf-btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
