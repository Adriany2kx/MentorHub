import { Link } from "react-router-dom";
import type { Booking } from "../lib/api";
import StatusBadge from "./StatusBadge";

interface BookingCardProps {
  booking: Booking;
  viewAs: "mentee" | "mentor";
}

export default function BookingCard({ booking, viewAs }: BookingCardProps) {
  const price = parseFloat(booking.totalPrice);
  const mentorName = [booking.mentor.user.firstName, booking.mentor.user.lastName]
    .filter(Boolean)
    .join(" ") || "Mentor";
  const menteeName = [booking.mentee.firstName, booking.mentee.lastName]
    .filter(Boolean)
    .join(" ") || "Mentee";

  const completedSessions = booking.sessions.filter((s) => s.status === "COMPLETED").length;
  const totalSessions = booking.program.sessionCount;

  return (
    <Link
      to={`/bookings/${booking.id}`}
      className="wf-card flex flex-col gap-4 no-underline p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="wf-h3 truncate">{booking.program.title}</h3>
          <p className="wf-text-sm mt-1" style={{ color: "var(--color-ink-2)" }}>
            {viewAs === "mentee" ? `with ${mentorName}` : `from ${menteeName}`}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
        <span>{totalSessions} session{totalSessions !== 1 ? "s" : ""}</span>
        <span aria-hidden>·</span>
        <span>{booking.program.duration} min each</span>
        <span aria-hidden>·</span>
        <span>{price === 0 ? "Free" : `$${price}`}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 wf-text-xs pt-0.5 border-t" style={{ color: "var(--color-ink-3)", borderColor: "var(--color-border)" }}>
        {booking.sessions.length > 0 ? (
          <span>{completedSessions}/{totalSessions} sessions completed</span>
        ) : (
          <span>No sessions scheduled yet</span>
        )}
        <span>Booked {new Date(booking.createdAt).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}
