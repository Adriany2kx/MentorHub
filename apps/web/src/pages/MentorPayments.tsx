import { useState, useEffect } from "react";
import { listMentorPayments } from "../lib/api";
import type { Payment } from "../lib/api";

export default function MentorPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await listMentorPayments(page);
        setPayments(d.payments);
        setTotalPages(d.pagination.totalPages);
        setTotal(d.pagination.total);
        setTotalEarnings(d.totalEarnings);
      } catch {
        // silent error
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    load();
  }, [page]);

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <h1 className="wf-h1">Earnings</h1>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="wf-card">
          <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Total Earned</p>
          <p className="wf-h2 mt-2">£{(totalEarnings / 100).toFixed(2)}</p>
        </div>
        <div className="wf-card">
          <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Completed Sessions</p>
          <p className="wf-h2 mt-2">{total}</p>
        </div>
      </div>

      {/* Payments List */}
      <div className="wf-card-flush">
        <div className="wf-card-header">
          {loading ? "Loading..." : `Showing ${payments.length} of ${total} payments`}
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
        ) : payments.length === 0 ? (
          <div className="wf-empty">
            <p className="wf-empty-title">No earnings yet</p>
            <p className="wf-empty-text">Completed sessions will appear here.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {payments.map((payment) => {
              const booking = payment.booking;
              return (
                <div key={payment.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="wf-text font-semibold">{booking.program.title}</p>
                      <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
                        {booking.mentee.firstName} {booking.mentee.lastName}
                      </p>
                    </div>
                    <p className="wf-h3">£{parseFloat(payment.amount).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="wf-badge wf-badge-success">{payment.status}</span>
                    <p className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
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
