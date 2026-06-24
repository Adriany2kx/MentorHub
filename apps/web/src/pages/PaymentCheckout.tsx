import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Check, Star, Lock, Loader2 } from "lucide-react";
import { initiateCheckout, confirmPayment, getBooking } from "../lib/api";
import type { Booking } from "../lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCardNumber(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function maskCardNumber(num: string) {
  const digits = num.replace(/\s/g, "");
  if (digits.length <= 4) return num || "•••• •••• •••• ••••";
  const visible = digits.slice(-4);
  const masked = "•".repeat(Math.max(0, digits.length - 4));
  const full = (masked + visible).padEnd(16, "•");
  return full.replace(/(.{4})/g, "$1 ").trim();
}

function getCardBrand(num: string) {
  const d = num.replace(/\s/g, "");
  if (d.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return null;
}

// ---------------------------------------------------------------------------
// Card preview component
// ---------------------------------------------------------------------------
function CardPreview({ number, name, expiry, flipped }: { number: string; name: string; expiry: string; flipped: boolean }) {
  const brand = getCardBrand(number);
  return (
    <div className="relative w-full" style={{ perspective: 600 }}>
      <div
        className="relative transition-all duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          height: 180,
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)",
            color: "#fff",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-6 rounded-sm" style={{ background: "rgba(255,255,255,0.2)" }} />
            {brand && <span className="text-xs font-bold tracking-widest opacity-80">{brand.toUpperCase()}</span>}
          </div>
          <div>
            <p className="font-mono tracking-widest text-lg mb-3">{maskCardNumber(number)}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs opacity-60 mb-0.5">CARDHOLDER</p>
                <p className="font-mono text-sm tracking-wide">{name.toUpperCase() || "YOUR NAME"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-60 mb-0.5">EXPIRES</p>
                <p className="font-mono text-sm">{expiry || "MM/YY"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)",
          }}
        >
          <div className="w-full h-10 mt-8" style={{ background: "rgba(0,0,0,0.4)" }} />
          <div className="px-6 mt-4 flex items-center justify-end gap-3">
            <div className="flex-1 h-7 rounded" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="w-12 h-7 rounded flex items-center justify-center" style={{ background: "#fff" }}>
              <p className="text-xs font-mono font-bold" style={{ color: "#1e3a5f" }}>•••</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------
function SuccessScreen({ booking, onContinue }: { booking: Booking; onContinue: () => void }) {
  return (
    <div className="text-center py-8">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: "var(--color-success, #10b981)" }}
      >
        <Check size={40} style={{ color: "#fff" }} />
      </div>
      <h2 className="wf-h2 mb-2">Payment confirmed!</h2>
      <p className="wf-text mb-1" style={{ color: "var(--color-ink-2)" }}>
        £{parseFloat(booking.totalPrice).toFixed(2)} paid for
      </p>
      <p className="wf-text font-semibold mb-6">{booking.program.title}</p>

      <div className="p-4 rounded-xl mb-6 text-left" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
        <p className="wf-eyebrow mb-3">What happens next</p>
        <div className="space-y-2">
          {[
            "Your booking is now active",
            "Your mentor will confirm session times",
            "You'll receive a meeting link before each session",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "var(--color-blue)", color: "#fff" }}>
                {i + 1}
              </div>
              <p className="wf-text-sm">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onContinue} className="wf-btn wf-btn-primary w-full">
        View my booking →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PaymentCheckout() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Card fields
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [cvcFocused, setCvcFocused] = useState(false);

  // Payment flow state
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const processingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    getBooking(bookingId)
      .then((d) => setBooking(d.booking))
      .catch(() => setError("Booking not found"))
      .finally(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => () => {
    if (processingTimer.current) clearTimeout(processingTimer.current);
  }, []);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;

    setStep("processing");
    setError("");

    try {
      // Real API calls run in parallel with the animation delay
      const [checkoutRes] = await Promise.all([
        initiateCheckout(booking.id),
        new Promise((res) => { processingTimer.current = setTimeout(res, 2000); }),
      ]);
      await confirmPayment(checkoutRes.payment.id);
      setStep("success");
    } catch (err) {
      setStep("form");
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <p className="wf-text" style={{ color: "var(--color-ink-3)" }}>Loading checkout…</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg)" }}>
        <div className="text-center">
          <p className="wf-text mb-4" style={{ color: "var(--color-error, #ef4444)" }}>{error}</p>
          <Link to="/bookings" className="wf-btn wf-btn-secondary">← Back to bookings</Link>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const amount = parseFloat(booking.totalPrice);
  const mentorName = [booking.mentor.user.firstName, booking.mentor.user.lastName].filter(Boolean).join(" ") || "Mentor";

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-md mx-auto">

        {/* Test mode banner */}
        <div className="flex items-center justify-center gap-2 mb-6 px-3 py-1.5 rounded-full w-fit mx-auto" style={{ background: "var(--color-warn-bg, #fef3c7)", border: "1px solid var(--color-warn, #f59e0b)" }}>
          <Star size={12} fill="var(--color-warn, #f59e0b)" style={{ color: "var(--color-warn, #f59e0b)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--color-warn, #92400e)" }}>Simulated payment — no real charges</span>
        </div>

        <div className="wf-card-flush overflow-hidden">

          {/* Processing overlay */}
          {step === "processing" && (
            <div className="p-10 text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <Loader2 size={64} className="animate-spin" style={{ color: "var(--color-blue)" }} />
              </div>
              <h2 className="wf-h3 mb-2">Processing payment…</h2>
              <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Please don't close this window</p>
            </div>
          )}

          {/* Success screen */}
          {step === "success" && (
            <div className="p-6">
              <SuccessScreen booking={booking} onContinue={() => navigate(`/bookings/${booking.id}?paid=1`)} />
            </div>
          )}

          {/* Payment form */}
          {step === "form" && (
            <>
              {/* Order summary header */}
              <div className="p-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <p className="wf-eyebrow mb-1">Order summary</p>
                <h1 className="wf-h3">{booking.program.title}</h1>
                <p className="wf-text-sm mt-1" style={{ color: "var(--color-ink-2)" }}>
                  with {mentorName} · {booking.program.sessionCount} session{booking.program.sessionCount !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="p-5 space-y-5">
                {/* Card preview */}
                <CardPreview number={cardNumber} name={cardName} expiry={expiry} flipped={cvcFocused} />

                {/* Card form */}
                <form onSubmit={handlePay} className="space-y-4">
                  <div>
                    <label className="wf-label">Card number</label>
                    <input
                      className="wf-input font-mono tracking-widest"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      inputMode="numeric"
                      maxLength={19}
                      required
                    />
                    <p className="wf-help-text mt-1">Use <strong>4242 4242 4242 4242</strong> to simulate a successful payment</p>
                  </div>

                  <div>
                    <label className="wf-label">Cardholder name</label>
                    <input
                      className="wf-input"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="wf-label">Expiry</label>
                      <input
                        className="wf-input font-mono"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        inputMode="numeric"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label className="wf-label">CVC</label>
                      <input
                        className="wf-input font-mono"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="123"
                        inputMode="numeric"
                        maxLength={4}
                        onFocus={() => setCvcFocused(true)}
                        onBlur={() => setCvcFocused(false)}
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="wf-error-text" role="alert">{error}</p>}

                  {/* Price + pay button */}
                  <div className="pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="wf-text" style={{ color: "var(--color-ink-2)" }}>Total due</span>
                      <span className="wf-h3">£{amount.toFixed(2)}</span>
                    </div>

                    <button type="submit" className="wf-btn wf-btn-primary w-full py-3 text-base">
                      Pay £{amount.toFixed(2)}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                      className="wf-btn wf-btn-secondary w-full mt-2"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Security footer */}
                  <div className="flex items-center justify-center gap-2" style={{ color: "var(--color-ink-3)" }}>
                    <Lock size={14} />
                    <span className="text-xs">Simulated secure checkout · No real charges</span>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {step === "form" && (
          <p className="text-center wf-text-xs mt-4" style={{ color: "var(--color-ink-3)" }}>
            By paying you agree to our <Link to="/terms" className="wf-btn-link">Terms of Service</Link>
          </p>
        )}
      </div>
    </div>
  );
}
