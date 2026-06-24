import { useState } from "react";
import { Check } from "lucide-react";
import type { ReportReason } from "../lib/api";
import { fileReport } from "../lib/api";
import { AnimatedModal } from "./animations";

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

  function handleClose() {
    if (!submitting) {
      onClose();
      setReason("");
      setDescription("");
      setError("");
      setSuccess(false);
    }
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={messageId ? "Report Message" : "Report User"}
      size="md"
    >
      {success ? (
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-success-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Check size={28} style={{ color: "var(--color-success)" }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>
            Report submitted
          </p>
          <p style={{ fontSize: 14, color: "var(--color-ink-3)", marginTop: 4 }}>
            Our team will review it shortly
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: 14, color: "var(--color-ink-3)", marginBottom: 20 }}>
            Help us understand what's wrong. Your report is confidential.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-ink)",
                marginBottom: 6,
              }}
            >
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason | "")}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-surface)",
                color: "var(--color-ink)",
                cursor: "pointer",
              }}
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-ink)",
                marginBottom: 6,
              }}
            >
              Description <span style={{ color: "var(--color-ink-3)", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              placeholder="Provide any additional details..."
              rows={4}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-surface)",
                color: "var(--color-ink)",
                resize: "vertical",
                minHeight: 100,
              }}
            />
            <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 4 }}>
              {description.length}/1000
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: "12px 14px",
                background: "var(--color-error-bg)",
                border: "1px solid var(--color-error-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-error)",
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-ink)",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                background: "var(--color-green)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                cursor: submitting || !reason ? "not-allowed" : "pointer",
                opacity: submitting || !reason ? 0.5 : 1,
              }}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      )}
    </AnimatedModal>
  );
}
