import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile } from "../lib/api";
import type { FullUserProfile } from "../lib/api";
import AvatarUpload from "../components/AvatarUpload";
import ProfileForm from "../components/ProfileForm";
import RoleBadge from "../components/RoleBadge";
import LoadingState from "../components/LoadingState";

export default function ProfileEdit() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<FullUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProfile() {
    try {
      const data = await getMyProfile();
      setProfile(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleProfileUpdate() {
    await loadProfile();
    await refreshUser();
  }

  function handleAvatarSuccess(newAvatarUrl: string) {
    if (profile) {
      setProfile({ ...profile, avatarUrl: newAvatarUrl });
    }
    refreshUser();
  }

  if (isLoading) {
    return <LoadingState title="Loading profile" message="Getting your account details ready." maxWidthClassName="max-w-180" />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page max-w-180 mx-auto">
          <p className="wf-error-text">{error || "Failed to load profile"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-180 mx-auto">
        {/* Page header */}
        <div className="wf-page-header flex items-center justify-between">
          <div>
            <p className="wf-eyebrow mb-1">Account</p>
            <h1 className="wf-h1">Edit Profile</h1>
          </div>
          <RoleBadge role={profile.role} />
        </div>

        {/* Avatar card */}
        <div className="wf-card-flush mb-5">
          <div className="wf-card-header">Profile Picture</div>
          <div className="p-6 flex justify-center">
            <AvatarUpload
              currentAvatarUrl={profile.avatarUrl}
              onUploadSuccess={handleAvatarSuccess}
            />
          </div>
        </div>

        {/* Basic info card */}
        <div className="wf-card-flush mb-5">
          <div className="wf-card-header">Basic Information</div>
          <div className="p-6">
            <ProfileForm user={profile} onSuccess={handleProfileUpdate} />
          </div>
        </div>

        {/* Account card */}
        <div className="wf-card-flush">
          <div className="wf-card-header">Account</div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="wf-label mb-0">Email</span>
              <span className="wf-text">{profile.email}</span>
              {profile.isVerified ? (
                <span className="wf-badge wf-badge-success">Verified</span>
              ) : (
                <span className="wf-badge wf-badge-warn">Not verified</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="wf-label mb-0">Member since</span>
              <span className="wf-text">{new Date(profile.createdAt || "").toLocaleDateString()}</span>
            </div>

            {profile.role === "MENTEE" && !profile.mentorProfile && (
              <div className="pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                <Link to="/become-mentor" className="wf-btn wf-btn-primary">
                  Become a Mentor
                </Link>
              </div>
            )}

            {profile.mentorProfile && (
              <div className="pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                <p className="wf-eyebrow mb-2">Mentor Status</p>
                {profile.mentorProfile.isApproved ? (
                  <p className="wf-text" style={{ color: "var(--color-success)" }}>Your mentor profile is approved and visible.</p>
                ) : (
                  <p className="wf-text" style={{ color: "var(--color-warning)" }}>Your mentor profile is pending approval.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
