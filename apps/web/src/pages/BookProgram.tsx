import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getProgram, createBooking } from "../lib/api";
import type { Program } from "../lib/api";
import LoadingState from "../components/LoadingState";

export default function BookProgram() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getProgram(id)
      .then((d) => setProgram(d.program))
      .catch(() => setError("Program not found"))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!program) return;

    setIsSubmitting(true);
    setError("");
    try {
      const res = await createBooking({ programId: program.id, note: note.trim() || undefined });
      navigate(`/bookings/${res.booking.id}?booked=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState title="Preparing booking" message="Loading program details before checkout." maxWidthClassName="max-w-2xl" />;
  }

  if (error && !program) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page max-w-2xl mx-auto text-center">
          <p className="wf-error-text mb-4">{error}</p>
          <Link to="/programs" className="text-link">← Back to programs</Link>
        </div>
      </div>
    );
  }

  if (!program) return null;

  const price = parseFloat(program.price);
  const mentorName = program.mentor
    ? [program.mentor.user.firstName, program.mentor.user.lastName].filter(Boolean).join(" ") || "Mentor"
    : "Mentor";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-2xl mx-auto">
        <Link to={`/programs/${program.id}`} className="wf-text-sm text-link mb-6 inline-block">
          ← Back to program
        </Link>

        <div className="wf-page-header">
          <p className="wf-eyebrow mb-1">Booking</p>
          <h1 className="wf-h1">Book Program</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Form — takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="wf-card-flush">
              <div className="wf-card-header">Your Message</div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="wf-label">
                      Message to mentor <span className="normal-case tracking-normal" style={{ fontSize: "9px", color: "var(--color-ink-3)" }}>(optional)</span>
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Tell the mentor about your goals and what you hope to achieve..."
                      rows={5}
                      maxLength={1000}
                      className="wf-textarea"
                    />
                    <p className="wf-help-text">{note.length}/1000</p>
                  </div>

                  {error && <p className="wf-error-text">{error}</p>}

                  <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="wf-btn wf-btn-primary flex-1"
                    >
                      {isSubmitting ? "Sending request..." : "Send Booking Request"}
                    </button>
                    <Link
                      to={`/programs/${program.id}`}
                      className="wf-btn wf-btn-secondary"
                    >
                      Cancel
                    </Link>
                  </div>

                  <p className="wf-text-xs text-center">
                    The mentor will review your request and confirm within a few days.
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Order summary sidebar */}
          <div>
            <div className="wf-card-flush">
              <div className="wf-card-header">Order Summary</div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="wf-text font-semibold">{program.title}</p>
                  <p className="wf-text-sm mt-0.5">with {mentorName}</p>
                </div>
                <hr className="wf-divider" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="wf-eyebrow">Sessions</span>
                    <span className="wf-text font-semibold">{program.sessionCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="wf-eyebrow">Per session</span>
                    <span className="wf-text font-semibold">{program.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="wf-eyebrow">Total</span>
                    <span className="wf-text font-semibold">{price === 0 ? "Free" : `$${price}`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
