import { useState } from "react";
import { updateMyProfile } from "../lib/api";
import type { AuthUser } from "../lib/api";

interface ProfileFormProps {
  user: AuthUser & { bio?: string | null; timezone?: string | null };
  onSuccess: () => void;
}

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

export default function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [bio, setBio] = useState(user.bio || "");
  const [timezone, setTimezone] = useState(user.timezone || "UTC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      await updateMyProfile({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        bio: bio || undefined,
        timezone: timezone || undefined,
      });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="wf-label">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={50}
            className="wf-input"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="wf-label">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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

      {success && (
        <p className="wf-text-sm text-success">Profile updated successfully!</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="wf-btn wf-btn-primary w-full"
      >
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
