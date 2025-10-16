import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicProfile } from "../lib/api";
import type { PublicProfile as PublicProfileType } from "../lib/api";
import RoleBadge from "../components/RoleBadge";
import LoadingState from "../components/LoadingState";

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!id) return;

      try {
        const data = await getPublicProfile(id);
        setProfile(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [id]);

  if (isLoading) {
    return <LoadingState title="Loading profile" message="Fetching this member's public details." />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page py-10 text-center">
          <div className="wf-h2 mb-4">Profile Not Found</div>
          <p className="wf-text mb-4" style={{ color: "var(--color-ink-2)" }}>{error || "This user doesn't exist."}</p>
          <Link to="/" className="wf-btn wf-btn-secondary">Return to Home</Link>
        </div>
      </div>
    );
  }

  const displayName =
    profile.firstName || profile.lastName
      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
      : "Anonymous User";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page py-10 max-w-2xl">
        {/* Profile card */}
        <div className="wf-card overflow-hidden">
          {/* Hatched header band */}
          <div className="wf-card-header h-16" style={{ background: "var(--color-bg)" }} />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-8 mb-4">
              <div className="wf-avatar wf-avatar-lg overflow-hidden border-2" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="wf-h2" style={{ color: "var(--color-ink-3)" }}>
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Name and role */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="wf-h1">{displayName}</h1>
              <RoleBadge role={profile.role} />
            </div>

            {/* Mentor headline */}
            {profile.mentorProfile?.headline && (
              <p className="wf-text mb-4" style={{ color: "var(--color-ink-2)" }}>{profile.mentorProfile.headline}</p>
            )}

            <div className="wf-divider" />

            {/* Bio */}
            {profile.bio && (
              <p className="wf-text whitespace-pre-wrap mb-6" style={{ color: "var(--color-ink-2)" }}>
                {profile.bio}
              </p>
            )}

            {/* Mentor info */}
            {profile.mentorProfile && (
              <>
                {/* Expertise */}
                {profile.mentorProfile.expertise && profile.mentorProfile.expertise.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-1.5">
                      {profile.mentorProfile.expertise.map((skill) => (
                        <span key={skill} className="wf-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {profile.mentorProfile.yearsExperience !== null && (
                  <p className="wf-text-sm mb-6" style={{ color: "var(--color-ink-2)" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                      {profile.mentorProfile.yearsExperience}
                    </span>{" "}
                    years of experience
                  </p>
                )}
              </>
            )}

            <div className="wf-divider" />

            {/* Member since */}
            <p className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
              Member since {new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
