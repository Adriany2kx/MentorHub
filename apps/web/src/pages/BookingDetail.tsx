import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { getBooking, confirmBooking, cancelBooking, scheduleSession, listMyPayments } from "../lib/api";
import type { Booking } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import SessionCard from "../components/SessionCard";
import type { SessionDetail } from "../lib/api";
import LoadingState from "../components/LoadingState";

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isActing, setIsActing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [showBookedBanner, setShowBookedBanner] = useState(searchParams.get("booked") === "1");
  const [showPaidBanner, setShowPaidBanner] = useState(searchParams.get("paid") === "1");
  const isMentor = user?.role === "MENTOR" || user?.role === "ADMIN";
  const viewAs = isMentor ? "mentor" : "mentee";

  useEffect(() => {
    if (showBookedBanner) {
      const t = setTimeout(() => setShowBookedBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showBookedBanner]);

  useEffect(() => {
    if (showPaidBanner) {
      const t = setTimeout(() => setShowPaidBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showPaidBanner]);

  // Schedule form state
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [cancelConfirmArmed, setCancelConfirmArmed] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBooking(id)
      .then((d) => setBooking(d.booking))
      .catch((err) => setError(err instanceof Error ? err.message : "Booking not found"))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || isMentor) {
      setPaymentStatus(null);
      return;
    }
    listMyPayments()
      .then((d) => {
        const payment = d.payments.find((p) => p.booking.id === id);
        setPaymentStatus(payment?.status || null);
      })
      .catch(() => setPaymentStatus(null));
  }, [id, isMentor]);

  async function handleConfirm() {
    if (!booking) return;
    setIsActing(true);
    setActionError("");
    try {
      const res = await confirmBooking(booking.id);
      setBooking(res.booking);
      toast("Booking confirmed", "success");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to confirm");
      toast(err instanceof Error ? err.message : "Failed to confirm", "error");
    } finally {
      setIsActing(false);
    }
  }

  async function handleCancel() {
    if (!booking) return;
    if (!cancelConfirmArmed) {
      setCancelConfirmArmed(true);
      toast("Press cancel again to confirm booking cancellation", "warning");
      setTimeout(() => setCancelConfirmArmed(false), 5000);
      return;
    }

    setIsActing(true);
    setActionError("");
    try {
      const res = await cancelBooking(booking.id);
      setBooking(res.booking);
      setCancelConfirmArmed(false);
      toast("Booking cancelled", "success");
      navigate(`/bookings/cancelled?bookingId=${booking.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel");
      toast(err instanceof Error ? err.message : "Failed to cancel", "error");
    } finally {
      setIsActing(false);
    }
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!booking || !scheduledAt) return;
    setIsScheduling(true);
    setActionError("");
    try {
      await scheduleSession(booking.id, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        meetingUrl: meetingUrl.trim() || undefined,
      });
      // Refresh booking to get updated sessions + status
      const res = await getBooking(booking.id);
      setBooking(res.booking);
      setShowSchedule(false);
      setScheduledAt("");
      setMeetingUrl("");
      toast("Session scheduled", "success");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to schedule session");
      toast(err instanceof Error ? err.message : "Failed to schedule session", "error");
    } finally {
      setIsScheduling(false);
    }
  }

  if (isLoading) {
    return <LoadingState title="Loading booking" message="Fetching booking status, sessions, and actions." maxWidthClassName="max-w-3xl" />;
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page max-w-3xl mx-auto text-center">
          <p className="wf-error-text mb-4">{error || "Booking not found"}</p>
          <Link to="/bookings" className="text-link">← Back to bookings</Link>
        </div>
      </div>
    );
  }

  const price = parseFloat(booking.totalPrice);
  const mentorName = [booking.mentor.user.firstName, booking.mentor.user.lastName].filter(Boolean).join(" ") || "Mentor";
  const menteeName = [booking.mentee.firstName, booking.mentee.lastName].filter(Boolean).join(" ") || "Mentee";
  const canConfirm = isMentor && booking.status === "PENDING";
  const canCancel = booking.status !== "CANCELLED" && booking.status !== "COMPLETED";
  const canSchedule = isMentor && (booking.status === "CONFIRMED" || booking.status === "ACTIVE" || booking.status === "PENDING");

  // Build SessionDetail shape for SessionCard
  const sessionDetails = booking.sessions.map((s): SessionDetail => ({
    id: s.id,
    bookingId: booking.id,
    scheduledAt: s.scheduledAt,
    duration: s.duration,
    status: s.status,
    meetingUrl: s.meetingUrl,
    mentorNotes: s.mentorNotes,
    menteeFeedback: s.menteeFeedback,
    rating: s.rating,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    booking: {
      id: booking.id,
      status: booking.status,
      program: { id: booking.program.id, title: booking.program.title, duration: booking.program.duration, sessionCount: booking.program.sessionCount },
      mentor: booking.mentor,
      mentee: booking.mentee,
    },
  }));

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-3xl mx-auto">
        <Link to="/bookings" className="wf-text-sm text-link mb-6 inline-block">
          ← Back to bookings
        </Link>

        {/* Booking success banner */}
        {showBookedBanner && (
          <div
            className="wf-success-banner mb-5 rounded-xl flex items-start gap-3 px-5 py-4"
            style={{ background: "var(--color-blue)", color: "#fff" }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.18)", marginTop: 1 }}>
              <Check size={14} style={{ color: "#fff" }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ fontSize: 15 }}>Booking request sent</p>
              <p style={{ fontSize: 13, opacity: 0.85 }}>
                Your mentor will review and confirm within a few days. You'll see the status update here.
              </p>
            </div>
            <button
              onClick={() => setShowBookedBanner(false)}
              aria-label="Dismiss"
              style={{ opacity: 0.7, cursor: "pointer", background: "none", border: "none", color: "#fff", padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Payment success banner */}
        {showPaidBanner && (
          <div
            className="wf-success-banner mb-5 rounded-xl flex items-start gap-3 px-5 py-4"
            style={{ background: "var(--color-green)", color: "#fff" }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.18)", marginTop: 1 }}>
              <Check size={14} style={{ color: "#fff" }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ fontSize: 15 }}>Payment successful</p>
              <p style={{ fontSize: 13, opacity: 0.85 }}>
                Your payment has been received. You're all set to begin your sessions!
              </p>
            </div>
            <button
              onClick={() => setShowPaidBanner(false)}
              aria-label="Dismiss"
              style={{ opacity: 0.7, cursor: "pointer", background: "none", border: "none", color: "#fff", padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Header card */}
        <div className="wf-card-flush mb-5">
          <div className="wf-card-header flex items-center justify-between">
            <span>{viewAs === "mentee" ? `with ${mentorName}` : `from ${menteeName}`}</span>
            <StatusBadge status={booking.status} />
          </div>
          <div className="p-6">
            <h1 className="wf-h2 mb-4">{booking.program.title}</h1>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <dt className="wf-eyebrow mb-1">Sessions</dt>
                <dd className="wf-text font-semibold">{booking.program.sessionCount}</dd>
              </div>
              <div>
                <dt className="wf-eyebrow mb-1">Duration</dt>
                <dd className="wf-text font-semibold">{booking.program.duration} min</dd>
              </div>
              <div>
                <dt className="wf-eyebrow mb-1">Price</dt>
                <dd className="wf-text font-semibold">{price === 0 ? "Free" : `$${price}`}</dd>
              </div>
              <div>
                <dt className="wf-eyebrow mb-1">Booked</dt>
                <dd className="wf-text font-semibold">{new Date(booking.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>

            {booking.note && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <p className="wf-eyebrow mb-2">Note from mentee</p>
                <p className="wf-text" style={{ color: "var(--color-ink-2)" }}>{booking.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Status & Actions */}
        {!isMentor && (booking.status === "PENDING" || booking.status === "CONFIRMED" || booking.status === "ACTIVE") && (
          <div className="mb-5 p-4 rounded border" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="wf-text-sm font-semibold mb-1">Payment Status</p>
                {paymentStatus === "COMPLETED" ? (
                  <span className="wf-badge wf-badge-success">✓ Payment Received</span>
                ) : paymentStatus === "PENDING" ? (
                  <span className="wf-badge wf-badge-warn">Payment Pending</span>
                ) : (
                  <span className="wf-badge wf-badge-neutral">Not Yet Paid</span>
                )}
              </div>
              {paymentStatus !== "COMPLETED" && (
                <button
                  onClick={() => navigate(`/checkout/${booking.id}`)}
                  className="wf-btn wf-btn-primary"
                >
                  Complete Payment
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {(canConfirm || canCancel || canSchedule) && (
          <div className="flex flex-wrap gap-3 mb-5">
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={isActing}
                className="wf-btn wf-btn-primary"
              >
                {isActing ? "Confirming..." : "Confirm Booking"}
              </button>
            )}
            {canSchedule && (
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className="wf-btn wf-btn-secondary"
              >
                Schedule Session
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isActing}
                className="wf-btn wf-btn-danger"
              >
                {isActing ? "Cancelling..." : "Cancel Booking"}
              </button>
            )}
          </div>
        )}

        {/* Schedule Session Form */}
        {showSchedule && (
          <div className="wf-card-flush mb-5">
            <div className="wf-card-header">Schedule a Session</div>
            <div className="p-6">
              <form onSubmit={handleSchedule} className="space-y-5">
                <div>
                  <label className="wf-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                    className="wf-input"
                  />
                </div>
                <div>
                  <label className="wf-label">
                    Meeting URL <span className="normal-case tracking-normal" style={{ fontSize: "9px", color: "var(--color-ink-3)" }}>(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="wf-input"
                  />
                </div>
                <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="wf-btn wf-btn-primary"
                  >
                    {isScheduling ? "Scheduling..." : "Add Session"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSchedule(false)}
                    className="wf-btn wf-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {actionError && <p className="wf-error-text mb-4">{actionError}</p>}

        {/* Leave a Review */}
        {!isMentor && booking.status === "COMPLETED" && (
          <div className="mb-5">
            <Link
              to={`/bookings/${booking.id}/review`}
              className="wf-btn wf-btn-primary"
            >
              Leave a Review
            </Link>
          </div>
        )}

        {/* Sessions */}
        <div>
          <p className="wf-eyebrow mb-3">
            Sessions ({booking.sessions.length}/{booking.program.sessionCount})
          </p>
          {sessionDetails.length === 0 ? (
            <div className="wf-empty">
              <p className="wf-empty-title">No sessions scheduled yet</p>
              {isMentor && (
                <p className="wf-empty-text">Use the Schedule Session button above to add one.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sessionDetails.map((s) => (
                <SessionCard key={s.id} session={s} viewAs={viewAs} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
