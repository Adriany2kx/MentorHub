import { useState, useEffect } from "react";
import { listPendingMentors, approveMentor, rejectMentor } from "../lib/api";
import type { PendingMentor } from "../lib/api";
import { useToast } from "../context/ToastContext";

export default function AdminMentors() {
  const { toast } = useToast();
  const [mentors, setMentors] = useState<PendingMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);

  useEffect(() => {
    listPendingMentors()
      .then((d) => setMentors(d.mentors))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    setActing(id);
    try {
      await approveMentor(id);
      setMentors((prev) => prev.filter((m) => m.id !== id));
      toast("Mentor approved", "success");
    } catch {
      toast("Failed to approve mentor", "error");
    }
    finally { setActing(null); }
  }

  async function handleReject(id: string) {
    if (rejectConfirmId !== id) {
      setRejectConfirmId(id);
      toast("Press reject again to confirm profile removal", "warning");
      setTimeout(() => {
        setRejectConfirmId((current) => (current === id ? null : current));
      }, 5000);
      return;
    }

    setActing(id);
    try {
      await rejectMentor(id);
      setMentors((prev) => prev.filter((m) => m.id !== id));
      setRejectConfirmId(null);
      toast("Mentor application rejected", "success");
    } catch {
      toast("Failed to reject mentor", "error");
    }
    finally { setActing(null); }
  }

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <h1 className="wf-h1">Mentor Approval</h1>
        <p className="wf-text-sm mt-1">Review and approve mentor profile applications.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="wf-card opacity-40 animate-pulse space-y-3">
              <div className="h-4 w-1/3" style={{ background: "var(--color-bg)" }} />
              <div className="h-3 w-1/2" style={{ background: "var(--color-bg)" }} />
            </div>
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <div className="wf-empty">
          <p className="wf-empty-title">All caught up!</p>
          <p className="wf-empty-text">No pending mentor applications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mentors.map((m) => {
            const name = [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || "Unnamed";
            const isActing = acting === m.id;
            return (
              <div key={m.id} className="wf-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="wf-avatar wf-avatar-md overflow-hidden shrink-0">
                      {m.user.avatarUrl ? (
                        <img src={m.user.avatarUrl} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{name[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="wf-text font-semibold">{name}</h2>
                      <p className="wf-text-sm">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(m.id)}
                      disabled={isActing}
                      className="wf-btn wf-btn-primary"
                    >
                      {isActing ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(m.id)}
                      disabled={isActing}
                      className="wf-btn wf-btn-danger"
                    >
                      {isActing ? "..." : "Reject"}
                    </button>
                  </div>
                </div>

                <hr className="wf-divider" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {m.headline && (
                    <div>
                      <p className="wf-eyebrow mb-1">Headline</p>
                      <p className="wf-text truncate">{m.headline}</p>
                    </div>
                  )}
                  {m.yearsExperience !== null && (
                    <div>
                      <p className="wf-eyebrow mb-1">Experience</p>
                      <p className="wf-text">{m.yearsExperience} years</p>
                    </div>
                  )}
                  {m.hourlyRate && (
                    <div>
                      <p className="wf-eyebrow mb-1">Rate</p>
                      <p className="wf-text">${parseFloat(m.hourlyRate)}/hr</p>
                    </div>
                  )}
                  <div>
                    <p className="wf-eyebrow mb-1">Applied</p>
                    <p className="wf-text">{new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {m.expertise.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {m.expertise.map((skill) => (
                      <span key={skill} className="wf-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
