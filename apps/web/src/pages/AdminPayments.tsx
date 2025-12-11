import { useState, useEffect } from "react";
import { listAdminPayments, updatePaymentStatus } from "../lib/api";
import type { Payment, PaymentStatus } from "../lib/api";

const STATUS_BADGE: Record<PaymentStatus, string> = {
  PENDING: "wf-badge-warn",
  COMPLETED: "wf-badge-success",
  FAILED: "wf-badge-error",
  REFUNDED: "wf-badge-neutral",
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");

  useEffect(() => {
    setLoading(true);
    listAdminPayments(page)
      .then((d) => {
        setPayments(d.payments);
        setTotalRevenue(d.totalRevenue);
        setTotalPages(d.pagination.totalPages);
        setTotal(d.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  async function handleStatusChange(id: string, status: PaymentStatus) {
    setUpdating(id);
    try {
      const res = await updatePaymentStatus(id, status);
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: res.payment.status } : p)));
    } catch {/* ignore */}
    finally { setUpdating(null); }
  }

  return (
    <div className="wf-page">
      <div className="wf-page-header flex items-center justify-between">
        <h1 className="wf-h1">Payments</h1>
      </div>

      {/* Status filter */}
      <div className="mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "")}
          className="wf-input-box"
          style={{ width: "auto" }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Revenue stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="wf-stat">
          <p className="wf-stat-label">Total Revenue</p>
          <p className="wf-stat-value" style={{ color: "var(--color-success)" }}>${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="wf-stat">
          <p className="wf-stat-label">Total Transactions</p>
          <p className="wf-stat-value">{total}</p>
        </div>
      </div>

      {/* Payments table */}
      <div className="wf-card-flush">
        <div className="overflow-x-auto">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Mentee</th>
                <th>Program</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="opacity-40 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j}>
                        <div className="h-3 w-20" style={{ background: "var(--color-bg)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="wf-empty">
                      <p className="wf-empty-title">No payments yet</p>
                      <p className="wf-empty-text">Transactions will appear here once bookings are paid.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.filter((p) => !statusFilter || p.status === statusFilter).map((p) => {
                  const menteeName = p.booking.mentee
                    ? [p.booking.mentee.firstName, p.booking.mentee.lastName].filter(Boolean).join(" ") ||
                      p.booking.mentee.email
                    : "—";
                  const isUpdating = updating === p.id;
                  return (
                    <tr key={p.id}>
                      <td className="font-medium" style={{ color: "var(--color-ink)" }}>{menteeName}</td>
                      <td style={{ color: "var(--color-ink-2)" }}>{p.booking.program.title}</td>
                      <td className="font-medium" style={{ color: "var(--color-ink)" }}>${parseFloat(p.amount).toFixed(2)}</td>
                      <td>
                        <span className={`wf-badge ${STATUS_BADGE[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--color-ink-2)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <select
                          value={p.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(p.id, e.target.value as PaymentStatus)}
                          className="wf-input-box"
                          style={{ width: "auto", fontSize: 10, padding: "4px 8px" }}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="FAILED">Failed</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
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
