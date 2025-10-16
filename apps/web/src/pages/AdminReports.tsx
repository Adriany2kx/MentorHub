import { useState, useEffect, useCallback } from "react";
import { listAdminReports, updateAdminReport } from "../lib/api";
import type { Report } from "../lib/api";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "wf-badge-warn",
  REVIEWED: "wf-badge-neutral",
  RESOLVED: "wf-badge-success",
  DISMISSED: "wf-badge-neutral",
};

const REASON_LABEL: Record<string, string> = {
  HARASSMENT: "Harassment",
  SPAM: "Spam",
  INAPPROPRIATE_CONTENT: "Inappropriate Content",
  FAKE_PROFILE: "Fake Profile",
  OTHER: "Other",
};

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    listAdminReports(page, statusFilter || undefined)
      .then((d) => {
        setReports(d.reports);
        setTotalPages(d.pagination.totalPages);
        setTotal(d.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function handleStatusChange(reportId: string, newStatus: string) {
    setUpdating(reportId);
    try {
      await updateAdminReport(reportId, {
        status: newStatus as "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED",
        adminNotes: editingNotes[reportId],
      });
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: newStatus as "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED",
                adminNotes: editingNotes[reportId] || r.adminNotes,
              }
            : r
        )
      );
      setEditingNotes((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
    } catch {/* ignore */}
    finally {
      setUpdating(null);
    }
  }

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <h1 className="wf-h1">Reports Queue</h1>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="wf-input-box"
          style={{ width: "auto" }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="wf-card-flush">
        <div className="wf-card-header">
          {loading ? "Loading..." : `Showing ${reports.length} of ${total} reports`}
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 border rounded opacity-40 animate-pulse"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="h-4 w-1/2 mb-3" style={{ background: "var(--color-bg)" }} />
                <div className="space-y-2">
                  <div className="h-3 w-full" style={{ background: "var(--color-bg)" }} />
                  <div className="h-3 w-3/4" style={{ background: "var(--color-bg)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="wf-empty">
            <p className="wf-empty-title">No reports found</p>
            <p className="wf-empty-text">All reports in this status have been processed.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {reports.map((report) => {
              const isExpanded = expandedId === report.id;
              const isUpdating = updating === report.id;
              return (
                <div key={report.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="wf-text font-semibold">
                        {report.reporter.firstName} {report.reporter.lastName}{" "}
                        <span style={{ color: "var(--color-ink-3)" }}>reported</span>{" "}
                        {report.reported.firstName} {report.reported.lastName}
                      </p>
                      <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
                        {REASON_LABEL[report.reason]} • {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`wf-badge ${STATUS_BADGE[report.status]}`}>{report.status}</span>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      className="wf-btn wf-btn-secondary text-sm py-1"
                    >
                      {isExpanded ? "Collapse" : "View"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 p-4 rounded border space-y-3" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}>
                      <div>
                        <p className="wf-text-sm font-semibold mb-1">Reporter</p>
                        <p className="wf-text-sm">{report.reporter.email}</p>
                      </div>

                      <div>
                        <p className="wf-text-sm font-semibold mb-1">Reported User</p>
                        <p className="wf-text-sm">{report.reported.email}</p>
                      </div>

                      {report.message && (
                        <div>
                          <p className="wf-text-sm font-semibold mb-1">Message</p>
                          <div className="p-2 rounded bg-white border" style={{ borderColor: "var(--color-border)" }}>
                            <p className="wf-text-sm">{report.message.content}</p>
                          </div>
                        </div>
                      )}

                      {report.description && (
                        <div>
                          <p className="wf-text-sm font-semibold mb-1">Report Description</p>
                          <p className="wf-text-sm">{report.description}</p>
                        </div>
                      )}

                      <div>
                        <label className="block wf-text-sm font-semibold mb-2">Admin Notes</label>
                        <textarea
                          value={editingNotes[report.id] ?? report.adminNotes ?? ""}
                          onChange={(e) =>
                            setEditingNotes((prev) => ({
                              ...prev,
                              [report.id]: e.target.value,
                            }))
                          }
                          disabled={isUpdating}
                          maxLength={500}
                          placeholder="Add notes about this report..."
                          className="wf-input-box resize-none w-full"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <select
                          value={report.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className="wf-input-box flex-1"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="REVIEWED">Reviewed</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="DISMISSED">Dismissed</option>
                        </select>
                        {editingNotes[report.id] !== undefined && (
                          <button
                            onClick={() => handleStatusChange(report.id, report.status)}
                            disabled={isUpdating}
                            className="wf-btn wf-btn-primary"
                          >
                            {isUpdating ? "Saving..." : "Save"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
