import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DollarSign } from "lucide-react";
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
              <DollarSign size={48} className="mx-auto mb-3 opacity-50" />
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
                {payments.map((payment) => {
                  const booking = payment.booking;
                  const mentorName = booking.mentor
                    ? `${booking.mentor.user.firstName ?? ""} ${booking.mentor.user.lastName ?? ""}`.trim()
                    : "Mentor";
                  return (
                    <tr key={payment.id}>
                      <td>
                        <p className="wf-text font-semibold">{booking.program.title}</p>
                      </td>
                      <td>
                        <p className="wf-text">{mentorName}</p>
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
                        <Link to={`/bookings/${booking.id}`} className="wf-btn wf-btn-secondary text-sm py-1">
                          View Booking
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
