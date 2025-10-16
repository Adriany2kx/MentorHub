import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import type { Program } from "../lib/api";
import { withViewTransition } from "../lib/withViewTransition";

interface ProgramCardProps {
  program: Program;
  showMentor?: boolean;
}

export default function ProgramCard({ program, showMentor = true }: ProgramCardProps) {
  const navigate = useNavigate();
  const price = parseFloat(program.price);

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
      navigate(`/programs/${program.id}`);
    });
  }

  return (
    <Link
      to={`/programs/${program.id}`}
      className="wf-card block transition-colors no-underline p-5"
      onClick={handleNavigate}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="wf-h3 line-clamp-2 pt-0.5" style={{ viewTransitionName: `program-title-${program.id}` }}>
          {program.title}
        </h3>
        <span className="wf-text font-bold whitespace-nowrap" style={{ color: "var(--color-ink)", viewTransitionName: `program-price-${program.id}` }}>
          {price === 0 ? "Free" : `$${price}`}
        </span>
      </div>

      {program.description && (
        <p className="wf-text-sm line-clamp-3 mb-4 wf-copy" style={{ color: "var(--color-ink-2)" }}>{program.description}</p>
      )}

      {program.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {program.topics.slice(0, 3).map((topic) => (
            <span key={topic} className="wf-tag">
              {topic}
            </span>
          ))}
          {program.topics.length > 3 && (
            <span className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>+{program.topics.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
        <span data-tooltip="Live 1-on-1 video calls included in this program">{program.sessionCount} session{program.sessionCount !== 1 ? "s" : ""}</span>
        <span>{program.duration} min each</span>
        {program.maxParticipants > 1 && (
          <span>Up to {program.maxParticipants} participants</span>
        )}
      </div>

      {showMentor && program.mentor && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="wf-avatar wf-avatar-sm">
            {program.mentor.user.avatarUrl ? (
              <img
                src={program.mentor.user.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-4 h-4" style={{ color: "var(--color-ink-3)" }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
          </div>
          <span className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
            {[program.mentor.user.firstName, program.mentor.user.lastName]
              .filter(Boolean)
              .join(" ") || "Mentor"}
          </span>
        </div>
      )}
    </Link>
  );
}
