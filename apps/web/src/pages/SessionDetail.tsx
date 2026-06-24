import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, Video, Star } from "lucide-react";
import { getSession, completeSession, cancelSession, getSessionAgenda, generateSessionSummary, extractActionItems } from "../lib/api";
import type { SessionDetail as ISessionDetail, AiAgendaItem, AiSessionSummary } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ISessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isActing, setIsActing] = useState(false);

  // Complete form
  const [showComplete, setShowComplete] = useState(false);
  const [mentorNotes, setMentorNotes] = useState("");
  const [menteeFeedback, setMenteeFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [cancelConfirmArmed, setCancelConfirmArmed] = useState(false);

  // AI state
  const [agenda, setAgenda] = useState<AiAgendaItem[] | null>(null);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiSessionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [actionItemsLoading, setActionItemsLoading] = useState(false);
  const [actionItemsResult, setActionItemsResult] = useState<{ created: number; note?: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    getSession(id)
      .then((d) => setSession(d.session))
      .catch((err) => setError(err instanceof Error ? err.message : "Session not found"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const isMentor = user?.role === "MENTOR" || user?.role === "ADMIN";
  const viewAs = isMentor ? "mentor" : "mentee";

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setIsActing(true);
    setActionError("");
    try {
      const data: { mentorNotes?: string; menteeFeedback?: string; rating?: number } = {};
      if (isMentor && mentorNotes.trim()) data.mentorNotes = mentorNotes.trim();
      if (!isMentor && menteeFeedback.trim()) data.menteeFeedback = menteeFeedback.trim();
      if (!isMentor && rating > 0) data.rating = rating;

      await completeSession(session.id, data);
      const res = await getSession(session.id);
      setSession(res.session);
      setShowComplete(false);
      toast("Session marked complete", "success");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to complete session");
      toast(err instanceof Error ? err.message : "Failed to complete session", "error");
    } finally {
      setIsActing(false);
    }
  }

  async function handleCancel() {
    if (!session) return;
    if (!cancelConfirmArmed) {
      setCancelConfirmArmed(true);
      toast("Press cancel again to confirm session cancellation", "warning");
      setTimeout(() => setCancelConfirmArmed(false), 5000);
      return;
    }

    setIsActing(true);
    setActionError("");
    try {
      await cancelSession(session.id);
      const res = await getSession(session.id);
      setSession(res.session);
      setCancelConfirmArmed(false);
      toast("Session cancelled", "success");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel session");
      toast(err instanceof Error ? err.message : "Failed to cancel session", "error");
    } finally {
      setIsActing(false);
    }
  }

  async function handleGenerateAgenda() {
    if (!session) return;
    setAgendaLoading(true);
    try {
      const { agenda: items } = await getSessionAgenda(session.id);
      setAgenda(items);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not generate agenda", "error");
    } finally {
      setAgendaLoading(false);
    }
  }

  async function handleGenerateSummary() {
    if (!session) return;
    setSummaryLoading(true);
    try {
      const { summary } = await generateSessionSummary(session.id, {
        mentorNotes: session.mentorNotes ?? undefined,
        menteeFeedback: session.menteeFeedback ?? undefined,
      });
      setAiSummary(summary);
      toast("AI summary generated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not generate summary", "error");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleExtractActionItems() {
    if (!session) return;
    setActionItemsLoading(true);
    try {
      const result = await extractActionItems(session.id);
      setActionItemsResult({ created: result.created, note: result.note });
      toast(result.created > 0 ? `${result.created} milestone${result.created > 1 ? "s" : ""} created` : "No action items found", result.created > 0 ? "success" : "warning");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not extract action items", "error");
    } finally {
      setActionItemsLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingState title="Loading session" message="Preparing session timeline and meeting details." maxWidthClassName="max-w-2xl" />;
  }

  if (error || !session) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page max-w-2xl mx-auto text-center">
          <p className="wf-error-text mb-4">{error || "Session not found"}</p>
          <Link to="/bookings" className="text-link">← Back to bookings</Link>
        </div>
      </div>
    );
  }

  const scheduledDate = new Date(session.scheduledAt);
  const mentorName = [session.booking.mentor.user.firstName, session.booking.mentor.user.lastName].filter(Boolean).join(" ") || "Mentor";
  const menteeName = [session.booking.mentee.firstName, session.booking.mentee.lastName].filter(Boolean).join(" ") || "Mentee";
  const canComplete = session.status === "SCHEDULED" || session.status === "IN_PROGRESS";
  const canCancel = session.status === "SCHEDULED";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-2xl mx-auto">
        <Link to={`/bookings/${session.bookingId}`} className="wf-text-sm text-link mb-6 inline-block">
          ← Back to booking
        </Link>

        {/* Session Header card */}
        <div className="wf-card-flush mb-5">
          <div className="wf-card-header flex items-center justify-between">
            <span>{viewAs === "mentee" ? `with ${mentorName}` : `with ${menteeName}`}</span>
            <StatusBadge status={session.status} />
          </div>
          <div className="p-6">
            <h1 className="wf-h2 mb-4">{session.booking.program.title}</h1>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="shrink-0" style={{ color: "var(--color-ink-3)" }} />
                <span className="wf-text">
                  {scheduledDate.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  {" at "}
                  {scheduledDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="shrink-0" style={{ color: "var(--color-ink-3)" }} />
                <span className="wf-text">{session.duration} minutes</span>
              </div>
              {session.meetingUrl && (
                <div className="flex items-center gap-3">
                  <Video size={16} className="shrink-0" style={{ color: "var(--color-ink-3)" }} />
                  <a
                    href={session.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link wf-text break-all"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Agenda — pre-session */}
        {session.status === "SCHEDULED" && (
          <div className="wf-card-flush mb-5">
            <div className="wf-card-header" style={{ justifyContent: "space-between" }}>
              <span>Session Agenda</span>
              {!agenda && (
                <button
                  onClick={handleGenerateAgenda}
                  disabled={agendaLoading}
                  className="wf-btn wf-btn-secondary"
                  style={{ fontSize: 12, padding: "4px 12px" }}
                >
                  {agendaLoading ? "Generating…" : "✦ Generate with AI"}
                </button>
              )}
            </div>
            {!agenda && !agendaLoading && (
              <div className="p-5">
                <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Get a personalised agenda based on your goals, skills, and previous sessions.
                </p>
              </div>
            )}
            {agendaLoading && (
              <div className="p-5 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Generating your agenda…</div>
            )}
            {agenda && (
              <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {agenda.map((item, i) => (
                  <div key={i} className="px-5 py-4 flex items-start gap-4">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: "var(--color-blue)", color: "#fff" }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="wf-text font-medium">{item.item}</p>
                      <p className="wf-text-xs mt-0.5" style={{ color: "var(--color-ink-2)" }}>{item.rationale}</p>
                    </div>
                    <span className="wf-text-xs shrink-0 mt-0.5" style={{ color: "var(--color-ink-3)" }}>
                      ~{item.estimatedMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes & Feedback */}
        {(session.mentorNotes || session.menteeFeedback || session.rating) && (
          <div className="wf-card-flush mb-5">
            <div className="wf-card-header">Notes & Feedback</div>
            <div className="p-6 space-y-4">
              {session.mentorNotes && (
                <div>
                  <p className="wf-eyebrow mb-2">Mentor Notes</p>
                  <p className="wf-text whitespace-pre-wrap" style={{ color: "var(--color-ink-2)" }}>{session.mentorNotes}</p>
                </div>
              )}
              {session.menteeFeedback && (
                <div>
                  <p className="wf-eyebrow mb-2">Mentee Feedback</p>
                  <p className="wf-text whitespace-pre-wrap" style={{ color: "var(--color-ink-2)" }}>{session.menteeFeedback}</p>
                </div>
              )}
              {session.rating && (
                <div>
                  <p className="wf-eyebrow mb-2">Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        fill={star <= session.rating! ? "currentColor" : "none"}
                        style={{ color: star <= session.rating! ? "var(--color-warning)" : "var(--color-border)" }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Summary — post-session */}
        {session.status === "COMPLETED" && (session.mentorNotes || session.menteeFeedback) && (
          <div className="wf-card-flush mb-5">
            <div className="wf-card-header" style={{ justifyContent: "space-between" }}>
              <span>AI Summary</span>
              {!aiSummary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="wf-btn wf-btn-secondary"
                  style={{ fontSize: 12, padding: "4px 12px" }}
                >
                  {summaryLoading ? "Summarising…" : "✦ Generate with AI"}
                </button>
              )}
            </div>
            {!aiSummary && !summaryLoading && (
              <div className="p-5">
                <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Structure your notes into key points, decisions, action items, and follow-up questions.
                </p>
              </div>
            )}
            {summaryLoading && (
              <div className="p-5 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Analysing session notes…</div>
            )}
            {aiSummary && (
              <div className="p-5 space-y-5">
                {aiSummary.keyPoints.length > 0 && (
                  <div>
                    <p className="wf-eyebrow mb-2">Key Points</p>
                    <ul className="space-y-1">
                      {aiSummary.keyPoints.map((pt, i) => (
                        <li key={i} className="wf-text-sm flex gap-2">
                          <span style={{ color: "var(--color-blue)" }}>•</span> {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiSummary.decisions.length > 0 && (
                  <div>
                    <p className="wf-eyebrow mb-2">Decisions Made</p>
                    <ul className="space-y-1">
                      {aiSummary.decisions.map((d, i) => (
                        <li key={i} className="wf-text-sm flex gap-2">
                          <span style={{ color: "var(--color-success, #10b981)" }}>✓</span> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiSummary.actionItems.length > 0 && (
                  <div>
                    <p className="wf-eyebrow mb-2">Action Items</p>
                    <ul className="space-y-1">
                      {aiSummary.actionItems.map((a, i) => (
                        <li key={i} className="wf-text-sm flex gap-2">
                          <span style={{ color: "var(--color-warning, #f59e0b)" }}>→</span> {a}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleExtractActionItems}
                      disabled={actionItemsLoading || !!actionItemsResult}
                      className="wf-btn wf-btn-secondary mt-3"
                      style={{ fontSize: 12 }}
                    >
                      {actionItemsLoading ? "Creating milestones…"
                        : actionItemsResult ? `${actionItemsResult.created} milestone${actionItemsResult.created !== 1 ? "s" : ""} created`
                        : "✦ Add to my goals as milestones"}
                    </button>
                    {actionItemsResult?.note && (
                      <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>{actionItemsResult.note}</p>
                    )}
                  </div>
                )}
                {aiSummary.followUpQuestions.length > 0 && (
                  <div>
                    <p className="wf-eyebrow mb-2">Follow-up Questions</p>
                    <ul className="space-y-1">
                      {aiSummary.followUpQuestions.map((q, i) => (
                        <li key={i} className="wf-text-sm flex gap-2" style={{ color: "var(--color-ink-2)" }}>
                          <span>?</span> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {(canComplete || canCancel) && !showComplete && (
          <div className="flex flex-wrap gap-3 mb-5">
            {canComplete && (
              <button
                onClick={() => setShowComplete(true)}
                className="wf-btn wf-btn-primary"
              >
                Mark Complete
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isActing}
                className="wf-btn wf-btn-danger"
              >
                Cancel Session
              </button>
            )}
          </div>
        )}

        {/* Complete Form */}
        {showComplete && (
          <div className="wf-card-flush mb-5">
            <div className="wf-card-header">Complete Session</div>
            <div className="p-6">
              <form onSubmit={handleComplete} className="space-y-5">
                {isMentor && (
                  <div>
                    <label className="wf-label">
                      Session Notes <span className="normal-case tracking-normal" style={{ fontSize: "9px", color: "var(--color-ink-3)" }}>(optional)</span>
                    </label>
                    <textarea
                      value={mentorNotes}
                      onChange={(e) => setMentorNotes(e.target.value)}
                      placeholder="Summary of what was covered..."
                      rows={4}
                      maxLength={2000}
                      className="wf-textarea"
                    />
                  </div>
                )}

                {!isMentor && (
                  <>
                    <div>
                      <label className="wf-label">
                        Feedback <span className="normal-case tracking-normal" style={{ fontSize: "9px", color: "var(--color-ink-3)" }}>(optional)</span>
                      </label>
                      <textarea
                        value={menteeFeedback}
                        onChange={(e) => setMenteeFeedback(e.target.value)}
                        placeholder="How did the session go?"
                        rows={4}
                        maxLength={2000}
                        className="wf-textarea"
                      />
                    </div>
                    <div>
                      <label className="wf-label">
                        Rating <span className="normal-case tracking-normal" style={{ fontSize: "9px", color: "var(--color-ink-3)" }}>(optional)</span>
                      </label>
                      <div className="flex gap-2 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star === rating ? 0 : star)}
                            className="focus:outline-none"
                          >
                            <Star
                              size={32}
                              className="transition-colors"
                              fill={star <= rating ? "currentColor" : "none"}
                              style={{ color: star <= rating ? "var(--color-warning)" : "var(--color-border)" }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {actionError && <p className="wf-error-text">{actionError}</p>}

                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <button
                    type="submit"
                    disabled={isActing}
                    className="wf-btn wf-btn-primary"
                  >
                    {isActing ? "Saving..." : "Confirm Complete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowComplete(false)}
                    className="wf-btn wf-btn-secondary"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {actionError && !showComplete && <p className="wf-error-text mb-4">{actionError}</p>}
      </div>
    </div>
  );
}
