import { Link, useSearchParams } from "react-router-dom";

export default function BookingCancelled() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-2xl mx-auto">
        <div className="wf-card p-8 sm:p-10">
          <div
            className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "color-mix(in srgb, var(--color-blue) 16%, white)" }}
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 7L17 17M17 7L7 17"
                stroke="var(--color-blue)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className="wf-h2 mb-3">Booking cancelled</h1>
          <p className="wf-text mb-3" style={{ color: "var(--color-ink-2)" }}>
            Your booking has been cancelled successfully.
          </p>
          <p className="wf-text mb-8" style={{ color: "var(--color-ink-2)" }}>
            A booking cancellation confirmation will also be sent to your email so you have a written record.
          </p>

          {bookingId && (
            <p className="wf-text-sm mb-8" style={{ color: "var(--color-ink-3)" }}>
              Booking reference: {bookingId}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Link to="/bookings" className="wf-btn wf-btn-primary">Back to bookings</Link>
            <Link to="/dashboard" className="wf-btn wf-btn-secondary">Go to dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}