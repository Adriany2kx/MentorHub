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

  // Redirect if already a mentor
  if (user?.role === "MENTOR" || user?.role === "ADMIN") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div className="wf-page max-w-xl mx-auto">
          <h1 className="wf-h1 mb-3">You're Already a Mentor</h1>
          <p className="wf-text mb-6" style={{ color: "var(--color-ink-2)" }}>
            You already have a mentor profile. You can edit it from your profile settings.
          </p>
          <Link to="/profile/edit" className="wf-btn wf-btn-primary">
            Go to Profile
          </Link>
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
      <div className="wf-page max-w-xl mx-auto">
        {/* Page header */}
        <div className="wf-page-header">
          <p className="wf-eyebrow mb-1">Mentorship</p>
          <h1 className="wf-h1 mb-2">Become a Mentor</h1>
          <p className="wf-text" style={{ color: "var(--color-ink-2)" }}>
            Share your expertise and help others grow in their careers. Fill out the form
            below to apply as a mentor.
          </p>
        </div>

        {/* Info notice */}
        <div className="wf-card mb-6 border-l-2" style={{ borderLeftColor: "var(--color-ink)" }}>
          <p className="wf-eyebrow mb-3">What happens next?</p>
          <ol className="space-y-1">
            <li className="wf-text-sm">1. Submit your mentor application</li>
            <li className="wf-text-sm">2. Our team reviews your profile</li>
            <li className="wf-text-sm">3. Once approved, you'll appear in the mentor directory</li>
            <li className="wf-text-sm">4. Mentees can then book sessions with you</li>
          </ol>
        </div>

        <div className="wf-card-flush">
          <div className="wf-card-header">Mentor Application</div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="headline" className="wf-label">
                  Professional Headline *
                </label>
                <input
                  id="headline"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  required
                  minLength={10}
                  maxLength={200}
                  placeholder="e.g., NHS Nurse | 8 years in A&E, or Chartered Accountant at KPMG | ACA qualified"
                  className="wf-input"
                />
                <p className="wf-help-text">
                  A brief description of your professional background ({headline.length}/200)
                </p>
              </div>

              <SkillTagInput
                label="Areas of Expertise *"
                tags={expertise}
                onChange={setExpertise}
                maxTags={10}
                placeholder="e.g., Chartered Accountancy, Career Change, Solicitor, Nursing, Marketing"
              />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="hourlyRate" className="wf-label">
                    Hourly Rate (USD)
                  </label>
                  <div className="flex items-baseline gap-1">
                    <span className="wf-text" style={{ color: "var(--color-ink-3)" }}>$</span>
                    <input
                      id="hourlyRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="0.00"
                      className="wf-input"
                    />
                  </div>
                  <p className="wf-help-text">Leave blank for free mentorship</p>
                </div>

                <div>
                  <label htmlFor="yearsExperience" className="wf-label">
                    Years of Experience
                  </label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="wf-btn wf-btn-primary"
                >
                  {isSubmitting ? "Submitting..." : "Apply as Mentor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
