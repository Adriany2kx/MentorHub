import { useState } from "react";
import type { ReportReason } from "../lib/api";
import { fileReport } from "../lib/api";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedId: string;
  messageId?: string;
}

export default function ReportModal({ isOpen, onClose, reportedId, messageId }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reasons: { value: ReportReason; label: string }[] = [
    { value: "HARASSMENT", label: "Harassment or bullying" },
    { value: "SPAM", label: "Spam or scam" },
    { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
    { value: "FAKE_PROFILE", label: "Fake or misleading profile" },
    { value: "OTHER", label: "Other" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await fileReport({
        reportedId,
        messageId,
        reason: reason as ReportReason,
        description: description || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason("");
        setDescription("");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8" style={{ background: "var(--color-paper)" }}>
        <h2 className="wf-h3 mb-1">Report User</h2>
        <p className="wf-text-sm mb-4" style={{ color: "var(--color-ink-3)" }}>
          {messageId ? "Report this message" : "Report this user"}
        </p>

        {success ? (
          <div className="py-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-ink)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="wf-text font-semibold">Report submitted</p>
            <p className="wf-text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>Our team will review it shortly</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block wf-text-sm font-semibold mb-2">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason | "")}
                className="w-full wf-input-box"
                disabled={submitting}
              >
                <option value="">Select a reason...</option>
                {reasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block wf-text-sm font-semibold mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="Provide any additional details..."
                className="w-full wf-input-box resize-none"
                rows={4}
                disabled={submitting}
              />
              <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
                {description.length}/1000
              </p>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 wf-text-sm">{error}</div>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 wf-btn wf-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reason}
                className="flex-1 wf-btn wf-btn-primary"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
