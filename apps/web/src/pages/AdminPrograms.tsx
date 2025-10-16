import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { listAdminPrograms } from "../lib/api";
import type { AdminProgram } from "../lib/api";

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    listAdminPrograms({ page, search: search || undefined })
      .then((d) => {
        setPrograms(d.programs);
        setTotalPages(d.pagination.totalPages);
        setTotal(d.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="wf-page">
      <div className="wf-page-header flex items-center justify-between">
        <h1 className="wf-h1">Programs</h1>
      </div>

      {/* Search */}
      <div className="mb-5 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search programs..."
          className="wf-input-box"
        />
      </div>

      {/* Table */}
      <div className="wf-card-flush">
        <div className="wf-card-header">
          {loading ? "Loading..." : `${total} programs`}
        </div>
        <div className="overflow-x-auto">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Mentor</th>
                <th>Price</th>
                <th>Sessions</th>
                <th>Bookings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="opacity-40 animate-pulse">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j}>
                        <div className="h-3 w-20" style={{ background: "var(--color-bg)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="wf-empty">
                      <p className="wf-empty-title">No programs found</p>
                      <p className="wf-empty-text">Try adjusting your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                programs.map((p) => {
                  const mentorName =
                    [p.mentor.user.firstName, p.mentor.user.lastName].filter(Boolean).join(" ") ||
                    p.mentor.user.email;
                  return (
                    <tr key={p.id}>
                      <td className="font-medium" style={{ color: "var(--color-ink)" }}>{p.title}</td>
                      <td style={{ color: "var(--color-ink-2)" }}>{mentorName}</td>
                      <td style={{ color: "var(--color-ink)" }}>${parseFloat(p.price)}</td>
                      <td style={{ color: "var(--color-ink)" }}>{p.sessionCount}</td>
                      <td style={{ color: "var(--color-ink)" }}>{p._count.bookings}</td>
                      <td>
                        <span className={`wf-badge ${p.isPublished ? "wf-badge-success" : "wf-badge-warn"}`}>
                          {p.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td>
                        <Link to={`/programs/${p.id}`} className="wf-btn wf-btn-link">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
