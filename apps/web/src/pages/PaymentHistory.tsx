import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listMyPayments } from "../lib/api";
import type { Payment } from "../lib/api";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "wf-badge-warn",
  COMPLETED: "wf-badge-success",
  FAILED: "wf-badge-danger",
  REFUNDED: "wf-badge-neutral",
};

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyPayments()
      .then((d) => setPayments(d.payments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <h1 className="wf-h1">Payment History</h1>
      </div>

      <div className="wf-card-flush">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 opacity-40 animate-pulse">
                  <div className="h-4 w-1/4" style={{ background: "var(--color-bg)" }} />
                  <div className="h-4 w-1/4" style={{ background: "var(--color-bg)" }} />
                  <div className="h-4 w-1/4" style={{ background: "var(--color-bg)" }} />
                  <div className="h-4 w-1/4" style={{ background: "var(--color-bg)" }} />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="wf-empty">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="wf-empty-title">No payments yet</p>
              <p className="wf-empty-text">Payment history will appear here once you book a session.</p>
            </div>
          ) : (
            <table className="wf-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Mentor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <p className="wf-text font-semibold">{payment.booking.program.title}</p>
                    </td>
                    <td>
                      <p className="wf-text">
                        {payment.booking.mentor.user.firstName} {payment.booking.mentor.user.lastName}
                      </p>
                    </td>
                    <td>
                      <p className="wf-text font-semibold">£{parseFloat(payment.amount).toFixed(2)}</p>
                    </td>
                    <td>
                      <span className={`wf-badge ${STATUS_BADGE[payment.status]}`}>{payment.status}</span>
                    </td>
                    <td>
                      <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td>
                      <Link to={`/bookings/${payment.booking.id}`} className="wf-btn wf-btn-secondary text-sm py-1">
                        View Booking
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
