import { useState } from "react";
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import type { MentorListItem } from "../lib/api";
import { withViewTransition } from "../lib/withViewTransition";
import { User, Circle } from "lucide-react";

function AvatarPlaceholder() {
  return <User size={24} style={{ color: "var(--color-ink-3)" }} aria-hidden="true" />;
}

function AvatarWithFallback({ url, name }: { url?: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="wf-avatar wf-avatar-md shrink-0">
      {url && !imgError ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <AvatarPlaceholder />
      )}
    </div>
  );
}

interface MentorCardProps {
  mentor: MentorListItem;
  compatibilityScore?: number;
  matchReason?: string;
}

export default function MentorCard({ mentor, compatibilityScore, matchReason }: MentorCardProps) {
  const navigate = useNavigate();
  const displayName =
    mentor.user.firstName || mentor.user.lastName
      ? `${mentor.user.firstName || ""} ${mentor.user.lastName || ""}`.trim()
      : "Anonymous Mentor";

  const hourlyRate = mentor.hourlyRate ? parseFloat(mentor.hourlyRate) : null;

  function handleNavigate(e: MouseEvent<HTMLAnchorElement>) {
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.defaultPrevented
    ) {
      return;
    }

    e.preventDefault();
    withViewTransition(() => {
      navigate(`/mentors/${mentor.id}`);
    });
  }

  return (
    <Link
      to={`/mentors/${mentor.id}`}
      className="wf-card block transition-colors no-underline p-5"
      onClick={handleNavigate}
    >
      <div className="flex items-start gap-4">
        <div style={{ viewTransitionName: `mentor-avatar-${mentor.id}` }}>
          <AvatarWithFallback url={mentor.user.avatarUrl} name={displayName} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="wf-h3 truncate" style={{ viewTransitionName: `mentor-name-${mentor.id}` }}>
            {displayName}
          </h3>
          {mentor.headline && (
            <p className="wf-text-sm line-clamp-2 mt-1.5 wf-copy" style={{ color: "var(--color-ink-2)" }}>{mentor.headline}</p>
          )}
        </div>
      </div>

      {mentor.expertise.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-5">
          {mentor.expertise.slice(0, 4).map((skill) => (
            <span key={skill} className="wf-tag">
              {skill}
            </span>
          ))}
          {mentor.expertise.length > 4 && (
            <span className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>+{mentor.expertise.length - 4}</span>
          )}
        </div>
      )}

      {compatibilityScore !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: compatibilityScore >= 70 ? "var(--color-success-bg, #d1fae5)" : compatibilityScore >= 45 ? "var(--color-warn-bg, #fef3c7)" : "var(--color-error-bg, #fee2e2)",
              color: compatibilityScore >= 70 ? "var(--color-success, #065f46)" : compatibilityScore >= 45 ? "var(--color-warn, #92400e)" : "var(--color-error, #991b1b)",
            }}
            title={matchReason}
          >
            <Circle size={10} fill="currentColor" aria-hidden="true" />
            {compatibilityScore}% match
          </div>
          {matchReason && (
            <span className="wf-text-xs truncate" style={{ color: "var(--color-ink-3)" }}>{matchReason}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-4 wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
          {mentor.yearsExperience !== null && (
            <span>{mentor.yearsExperience} years exp.</span>
          )}
          {mentor.programCount > 0 && (
            <span>{mentor.programCount} program{mentor.programCount !== 1 ? "s" : ""}</span>
          )}
        </div>
        {hourlyRate !== null && (
          <span
            className="wf-text font-semibold"
            style={{ color: "var(--color-ink)" }}
            data-tooltip="Per-hour 1-on-1 session rate"
          >
            ${hourlyRate}/hr
          </span>
        )}
      </div>
    </Link>
  );
}
