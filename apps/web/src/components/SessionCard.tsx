import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import type { SessionDetail } from "../lib/api";
import StatusBadge from "./StatusBadge";

interface SessionCardProps {
  session: SessionDetail;
  viewAs: "mentee" | "mentor";
}

export default function SessionCard({ session, viewAs }: SessionCardProps) {
  const scheduledDate = new Date(session.scheduledAt);
  const mentorName = [session.booking.mentor.user.firstName, session.booking.mentor.user.lastName]
    .filter(Boolean)
    .join(" ") || "Mentor";
  const menteeName = [session.booking.mentee.firstName, session.booking.mentee.lastName]
    .filter(Boolean)
    .join(" ") || "Mentee";

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="wf-card block transition-colors no-underline p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="wf-h3 truncate">{session.booking.program.title}</h3>
          <p className="wf-text-sm mt-1" style={{ color: "var(--color-ink-2)" }}>
            {viewAs === "mentee" ? `with ${mentorName}` : `with ${menteeName}`}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <div className="flex items-center gap-3 wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
        <Calendar size={16} className="shrink-0" style={{ color: "var(--color-ink-3)" }} />
        <span>
          {scheduledDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          {" at "}
          {scheduledDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span style={{ color: "var(--color-ink-3)" }}>·</span>
        <span>{session.duration} min</span>
      </div>

      {session.meetingUrl && (
        <div className="mt-3 wf-text-xs text-link truncate">
          {session.meetingUrl}
        </div>
      )}
    </Link>
  );
}
