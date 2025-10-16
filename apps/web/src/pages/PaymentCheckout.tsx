import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { initiateCheckout, confirmPayment, listMyBookings } from "../lib/api";
import type { Booking } from "../lib/api";

export default function PaymentCheckout() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/25");
  const [cvc, setCvc] = useState("123");

  useEffect(() => {
    if (!bookingId) return;
    listMyBookings()
      .then((d) => {
        const found = d.bookings.find((b) => b.id === bookingId);
        if (!found) {
          setError("Booking not found");
        } else {
          setBooking(found);
        }
      })
      .catch(() => setError("Failed to load booking"))
      .finally(() => setLoading(false));
  }, [bookingId]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;

    setProcessing(true);
    setError("");

    try {
      const checkoutRes = await initiateCheckout(booking.id);
      const paymentId = checkoutRes.payment.id;
      await confirmPayment(paymentId);
      navigate(`/bookings/${booking.id}?paid=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="text-center">
          <div className="wf-text mb-3">Loading checkout...</div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="text-center">
          <div className="wf-text-lg font-semibold mb-2">Booking not found</div>
          <button onClick={() => navigate("/bookings")} className="wf-btn wf-btn-primary mt-4">
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-md">
        {/* Order Summary */}
        <div className="wf-card mb-6">
          <div className="border-b pb-4 mb-4" style={{ borderColor: "var(--color-border)" }}>
            <h1 className="wf-h2">Order Summary</h1>
          </div>

          <div className="space-y-3">
            <div>
              <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Program</p>
              <p className="wf-text font-semibold">{booking.program.title}</p>
            </div>

            <div>
              <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Mentor</p>
              <p className="wf-text font-semibold">
                {booking.mentor.user.firstName} {booking.mentor.user.lastName}
              </p>
            </div>

            <div className="border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex justify-between items-end">
                <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Total Amount</p>
                <p className="wf-h3">£{(booking.totalPrice / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="wf-card">
          <div className="border-b pb-4 mb-4" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="wf-h3">Payment Details</h2>
            <p className="wf-text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>Secured by Stripe</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200">
              <p className="wf-text-sm" style={{ color: "var(--color-ink)" }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handlePay} className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="block wf-text-sm font-semibold mb-2">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                disabled={processing}
                placeholder="4242 4242 4242 4242"
                className="wf-input-box w-full"
              />
              <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>Test: 4242 4242 4242 4242</p>
            </div>

            {/* Expiry and CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block wf-text-sm font-semibold mb-2">Expiry</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  disabled={processing}
                  placeholder="MM/YY"
                  className="wf-input-box w-full"
                />
              </div>
              <div>
                <label className="block wf-text-sm font-semibold mb-2">CVC</label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  disabled={processing}
                  placeholder="123"
                  className="wf-input-box w-full"
                />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block wf-text-sm font-semibold mb-2">Cardholder Name</label>
              <input type="text" placeholder="John Doe" className="wf-input-box w-full" disabled={processing} />
            </div>

            <div className="space-y-3 pt-2">
              <button type="submit" disabled={processing} className="wf-btn wf-btn-primary w-full text-base py-3">
                {processing ? "Processing..." : `Pay £${(booking.totalPrice / 100).toFixed(2)}`}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/bookings/${booking.id}`)}
                disabled={processing}
                className="wf-btn wf-btn-secondary w-full"
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center justify-center gap-1 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-ink-3)" }}>
                <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm-2 15l-5-5 1.41-1.41L10 12.17l7.59-7.59L19 6l-9 9z" />
              </svg>
              <p className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>Payment is secure and encrypted</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
