import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateMyProfile, createMenteeProfile } from "../lib/api";
import { profileSetupSchema } from "../lib/validators";
import AvatarUpload from "../components/AvatarUpload";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
];

const STEPS = ["Account", "Role", "Profile", "Preferences", "Complete"];
const CURRENT_STEP = 3; // Profile step (1-indexed)

export default function ProfileSetup() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = profileSetupSchema.safeParse({ firstName, lastName, bio, timezone });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Update basic profile
      await updateMyProfile({
        firstName,
        lastName,
        bio: bio || undefined,
        timezone,
      });

      // Create mentee profile by default
      try {
        await createMenteeProfile({});
      } catch {
        // Ignore if mentee profile already exists
      }

      await refreshUser();
      navigate("/dashboard?welcome=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-[720px] mx-auto">
        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-start justify-between">
            {STEPS.map((label, idx) => {
              const stepNum = idx + 1;
              const isComplete = stepNum < CURRENT_STEP;
              const isCurrent = stepNum === CURRENT_STEP;
              return (
                <div key={label} className="flex-1 flex flex-col items-center relative">
                  {idx < STEPS.length - 1 && (
                    <div
                      className="absolute top-4 left-1/2 w-full h-px"
                      style={{ background: isComplete ? "var(--color-blue)" : "var(--color-border)" }}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className="relative z-10 w-8 h-8 flex items-center justify-center border"
                    style={
                      isCurrent || isComplete
                        ? { background: "var(--color-blue)", color: "#FFFFFF", borderColor: "var(--color-blue)" }
                        : { background: "var(--color-bg)", color: "var(--color-ink-3)", borderColor: "var(--color-border)" }
                    }
                  >
                    {isComplete ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="wf-text-sm">{stepNum}</span>
                    )}
                  </div>
                  <span
                    className="wf-eyebrow mt-2 text-center"
                    style={{ color: isCurrent ? "var(--color-blue)" : "var(--color-ink-3)" }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form card */}
        <div className="wf-card-flush max-w-150 mx-auto">
          <div className="wf-card-header">Onboarding</div>
          <div className="p-6">
            <h1 className="wf-h1 mb-2">Complete Your Profile</h1>
            <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)" }}>
              Step {CURRENT_STEP} of {STEPS.length} — Tell us about yourself
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex justify-center pb-2">
                <AvatarUpload
                  currentAvatarUrl={avatarUrl || user?.avatarUrl || null}
                  onUploadSuccess={setAvatarUrl}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="wf-label">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={50}
                    className="wf-input"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="wf-label">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={50}
                    className="wf-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="wf-label">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="wf-textarea"
                  placeholder="Tell us about yourself..."
                />
                <p className="wf-help-text">{bio.length}/500 characters</p>
              </div>

              <div>
                <label htmlFor="timezone" className="wf-label">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="wf-select"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="wf-error-text" role="alert">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="wf-btn wf-btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="wf-btn wf-btn-primary"
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
