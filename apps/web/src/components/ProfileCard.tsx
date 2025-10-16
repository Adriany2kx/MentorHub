import { Link } from "react-router-dom";
import type { PublicProfile } from "../lib/api";
import RoleBadge from "./RoleBadge";

interface ProfileCardProps {
  profile: PublicProfile;
  showLink?: boolean;
}

export default function ProfileCard({ profile, showLink = true }: ProfileCardProps) {
  const displayName =
    profile.firstName || profile.lastName
      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
      : "Anonymous User";

  const content = (
    <div className="wf-card transition-colors">
      <div className="flex items-start gap-4">
        <div className="wf-avatar wf-avatar-md">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="w-6 h-6" style={{ color: "var(--color-ink-3)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="wf-h3 truncate">{displayName}</h3>
            <RoleBadge role={profile.role} />
          </div>
          {profile.mentorProfile?.headline && (
            <p className="wf-text-sm mb-2" style={{ color: "var(--color-ink-2)" }}>{profile.mentorProfile.headline}</p>
          )}
          {profile.bio && (
            <p className="wf-text-sm line-clamp-2" style={{ color: "var(--color-ink-3)" }}>{profile.bio}</p>
          )}
          {profile.mentorProfile?.expertise && profile.mentorProfile.expertise.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.mentorProfile.expertise.slice(0, 3).map((skill) => (
                <span key={skill} className="wf-tag">
                  {skill}
                </span>
              ))}
              {profile.mentorProfile.expertise.length > 3 && (
                <span className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
                  +{profile.mentorProfile.expertise.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (showLink) {
    return <Link to={`/users/${profile.id}`} className="no-underline block">{content}</Link>;
  }

  return content;
}
