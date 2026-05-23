import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createMentorProfile } from "../lib/api";
import { mentorProfileSchema } from "../lib/validators";
import SkillTagInput from "../components/SkillTagInput";

export default function BecomeMentor() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [headline, setHeadline] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (user?.role === "MENTOR" || user?.role === "ADMIN") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="flex items-center justify-center px-4 py-16">
          <div className="wf-card w-full max-w-md p-8 text-center">
            <h1 className="wf-h2 mb-2">You're already a mentor</h1>
            <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)" }}>
              You already have a mentor profile. Edit it from your profile settings.
            </p>
            <Link to="/profile/edit" className="wf-btn wf-btn-primary">Go to profile</Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const data = {
      headline,
      expertise,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : undefined,
    };

    const result = mentorProfileSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await createMentorProfile(data);
      await refreshUser();
      navigate("/profile/edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create mentor profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-2xl mx-auto">

        <div className="wf-page-header">
          <p className="wf-eyebrow mb-1">Mentorship</p>
          <h1 className="wf-h1 mb-2">Become a Mentor</h1>
          <p className="wf-text" style={{ color: "var(--color-ink-2)" }}>
            Share your expertise and help others grow in their careers.
          </p>
        </div>

        {/* What happens next */}
        <div className="wf-card p-6 mb-6">
          <p className="wf-eyebrow mb-4">What happens next</p>
          <div className="space-y-3">
            {[
              "Submit your mentor application",
              "Our team reviews your profile",
              "Once approved, you'll appear in the mentor directory",
              "Mentees can then book sessions with you",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="wf-text-sm font-medium shrink-0" style={{
                  background: "var(--color-blue)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                }}>
                  {i + 1}
                </span>
                <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Application form */}
        <div className="wf-card p-8">
          <h2 className="wf-h3 mb-6">Mentor application</h2>
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label htmlFor="headline" className="wf-label">Professional headline *</label>
              <input
                id="headline"
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                required
                minLength={10}
                maxLength={200}
                placeholder="e.g., NHS Nurse | 8 years in A&E, or Chartered Accountant at KPMG"
                className="wf-input"
              />
              <p className="wf-help-text">{headline.length}/200 characters</p>
            </div>

            <SkillTagInput
              label="Areas of expertise *"
              tags={expertise}
              onChange={setExpertise}
              maxTags={10}
              placeholder="e.g., Career Change, Leadership, Software Engineering"
            />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="hourlyRate" className="wf-label">Hourly rate (USD)</label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-ink-3)",
                    fontSize: 14,
                    pointerEvents: "none",
                  }}>$</span>
                  <input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="0.00"
                    className="wf-input"
                    style={{ paddingLeft: 26 }}
                  />
                </div>
                <p className="wf-help-text">Leave blank for free mentorship</p>
              </div>

              <div>
                <label htmlFor="yearsExperience" className="wf-label">Years of experience</label>
                <input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="wf-input"
                />
              </div>
            </div>

            {error && <p className="wf-error-text" role="alert">{error}</p>}

            <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button type="button" onClick={() => navigate(-1)} className="wf-btn wf-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="wf-btn wf-btn-primary">
                {isSubmitting ? "Submitting…" : "Apply as mentor"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
