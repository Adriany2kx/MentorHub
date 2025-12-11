import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, getMyMenteeProfile, updateMenteeProfile } from "../lib/api";
import type { FullUserProfile, SkillEntry } from "../lib/api";
import AvatarUpload from "../components/AvatarUpload";
import ProfileForm from "../components/ProfileForm";
import RoleBadge from "../components/RoleBadge";
import LoadingState from "../components/LoadingState";
import { useToast } from "../context/ToastContext";

// ---------------------------------------------------------------------------
// AI Matching constants (mirrored from ProfileSetup)
// ---------------------------------------------------------------------------
type SkillTab = "Technical" | "Business" | "Soft Skills";

const SKILL_SUGGESTIONS: Record<SkillTab, string[]> = {
  Technical: [
    "Python", "SQL", "JavaScript", "TypeScript", "React", "Node.js",
    "Machine Learning", "Data Analysis", "Cloud (AWS/GCP/Azure)", "DevOps",
    "System Design", "API Development", "Docker", "Kubernetes", "Figma",
  ],
  Business: [
    "Product Strategy", "Roadmapping", "Stakeholder Management", "Data-Driven Decisions",
    "Go-to-Market", "User Research", "OKRs / KPIs", "Agile / Scrum",
    "Business Development", "Financial Modelling", "Project Management", "Market Analysis",
  ],
  "Soft Skills": [
    "Leadership", "Public Speaking", "Negotiation", "Mentoring",
    "Cross-functional Collaboration", "Executive Communication",
    "Conflict Resolution", "Strategic Thinking", "Time Management",
  ],
};

const PROFICIENCY_LEVELS: SkillEntry["level"][] = ["beginner", "intermediate", "advanced", "expert"];
const PROFICIENCY_LABELS: Record<SkillEntry["level"], string> = {
  none: "None", beginner: "Beginner", intermediate: "Intermediate",
  advanced: "Advanced", expert: "Expert",
};

const INDUSTRIES = [
  "FinTech", "HealthTech", "SaaS", "EdTech", "E-commerce",
  "Enterprise Software", "AI / ML", "Consulting", "Media", "Other",
];

const LEARNING_STYLES = [
  { value: "structured" as const, label: "Structured", sub: "Clear syllabus, defined milestones" },
  { value: "exploratory" as const, label: "Exploratory", sub: "Open discussion, follow curiosity" },
  { value: "project-based" as const, label: "Project-based", sub: "Learn by doing real work together" },
];

// ---------------------------------------------------------------------------
// AI Matching section component
// ---------------------------------------------------------------------------
function AiMatchingSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SkillTab>("Technical");
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [currentBlocker, setCurrentBlocker] = useState("");
  const [learningStyle, setLearningStyle] = useState<"structured" | "exploratory" | "project-based" | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyMenteeProfile()
      .then(({ menteeProfile }) => {
        setSkills((menteeProfile.skills as SkillEntry[]) ?? []);
        setTargetIndustry(menteeProfile.targetIndustry ?? "");
        setCurrentBlocker(menteeProfile.currentBlocker ?? "");
        setLearningStyle((menteeProfile.learningStyle as "structured" | "exploratory" | "project-based") ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleSkill(skillName: string) {
    setSkills((prev) => {
      const exists = prev.find((s) => s.skill === skillName);
      if (exists) return prev.filter((s) => s.skill !== skillName);
      if (prev.length >= 8) return prev;
      return [...prev, { skill: skillName, level: "beginner" }];
    });
  }

  function setLevel(skillName: string, level: SkillEntry["level"]) {
    setSkills((prev) => prev.map((s) => s.skill === skillName ? { ...s, level } : s));
  }

  function addCustomSkill() {
    const name = customSkill.trim();
    if (!name || skills.find((s) => s.skill.toLowerCase() === name.toLowerCase())) return;
    if (skills.length >= 8) return;
    setSkills((prev) => [...prev, { skill: name, level: "beginner" }]);
    setCustomSkill("");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateMenteeProfile({
        skills,
        targetIndustry: targetIndustry || null,
        currentBlocker: currentBlocker.trim() || null,
        learningStyle: (learningStyle as "structured" | "exploratory" | "project-based") || null,
      });
      toast("AI matching preferences saved", "success");
    } catch {
      toast("Failed to save preferences", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Loading…</div>;

  return (
    <div className="p-6 space-y-7" id="ai-matching">
      {/* Skills */}
      <div>
        <p className="wf-label mb-1">Your skills</p>
        <p className="wf-help-text mb-3">Pick up to 8 and rate each one — this is the biggest factor in mentor matching.</p>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-lg mb-3 w-fit" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
          {(Object.keys(SKILL_SUGGESTIONS) as SkillTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1 rounded-md text-sm font-medium transition-all"
              style={{
                background: activeTab === tab ? "var(--color-blue)" : "transparent",
                color: activeTab === tab ? "#fff" : "var(--color-ink-2)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tag cloud */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SKILL_SUGGESTIONS[activeTab].map((skillName) => {
            const selected = skills.find((s) => s.skill === skillName);
            return (
              <button
                key={skillName}
                onClick={() => toggleSkill(skillName)}
                className="px-3 py-1 rounded-full text-sm font-medium transition-all border"
                style={{
                  background: selected ? "var(--color-blue)" : "transparent",
                  color: selected ? "#fff" : "var(--color-ink)",
                  borderColor: selected ? "var(--color-blue)" : "var(--color-border)",
                  opacity: !selected && skills.length >= 8 ? 0.4 : 1,
                  cursor: !selected && skills.length >= 8 ? "not-allowed" : "pointer",
                }}
              >
                {skillName}
              </button>
            );
          })}
        </div>

        {/* Custom skill */}
        <div className="flex gap-2 mb-4">
          <input
            className="wf-input flex-1"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
            placeholder="Add a skill not listed…"
            maxLength={60}
            disabled={skills.length >= 8}
          />
          <button onClick={addCustomSkill} disabled={!customSkill.trim() || skills.length >= 8} className="wf-btn wf-btn-secondary">Add</button>
        </div>

        {/* Proficiency ratings */}
        {skills.length > 0 && (
          <div className="space-y-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <p className="wf-text-sm font-medium">Rate your level:</p>
            {skills.map((s) => (
              <div key={s.skill} className="flex items-center gap-3 flex-wrap">
                <span className="wf-text-sm font-medium w-36 shrink-0 truncate">{s.skill}</span>
                <div className="flex gap-1 flex-wrap">
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(s.skill, lvl)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                      style={{
                        background: s.level === lvl ? "var(--color-blue)" : "transparent",
                        color: s.level === lvl ? "#fff" : "var(--color-ink-2)",
                        borderColor: s.level === lvl ? "var(--color-blue)" : "var(--color-border)",
                      }}
                    >
                      {PROFICIENCY_LABELS[lvl]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Target industry */}
      <div>
        <p className="wf-label mb-2">Target industry</p>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => setTargetIndustry(targetIndustry === ind ? "" : ind)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
              style={{
                background: targetIndustry === ind ? "var(--color-blue)" : "transparent",
                color: targetIndustry === ind ? "#fff" : "var(--color-ink)",
                borderColor: targetIndustry === ind ? "var(--color-blue)" : "var(--color-border)",
              }}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Current blocker */}
      <div>
        <label className="wf-label">Biggest challenge right now</label>
        <p className="wf-help-text mb-2">Used to generate session agendas — be specific.</p>
        <textarea
          className="wf-textarea"
          rows={3}
          maxLength={300}
          value={currentBlocker}
          onChange={(e) => setCurrentBlocker(e.target.value)}
          placeholder="e.g. I can't get engineering buy-in for my product ideas"
        />
        <p className="wf-help-text">{currentBlocker.length}/300</p>
      </div>

      {/* Learning style */}
      <div>
        <p className="wf-label mb-2">How do you learn best?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LEARNING_STYLES.map(({ value, label, sub }) => (
            <button
              key={value}
              onClick={() => setLearningStyle(learningStyle === value ? "" : value)}
              className="p-3 rounded-lg text-left transition-all border"
              style={{
                background: learningStyle === value ? "color-mix(in srgb, var(--color-blue) 8%, transparent)" : "transparent",
                borderColor: learningStyle === value ? "var(--color-blue)" : "var(--color-border)",
              }}
            >
              <p className="wf-text-sm font-semibold">{label}</p>
              <p className="wf-text-xs mt-0.5" style={{ color: "var(--color-ink-3)" }}>{sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
        <button onClick={handleSave} disabled={saving} className="wf-btn wf-btn-primary">
          {saving ? "Saving…" : "Save AI preferences"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
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
    if (profile) setProfile({ ...profile, avatarUrl: newAvatarUrl });
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
        <div className="wf-page-header flex items-center justify-between">
          <div>
            <p className="wf-eyebrow mb-1">Account</p>
            <h1 className="wf-h1">Edit Profile</h1>
          </div>
          <RoleBadge role={profile.role} />
        </div>

        {/* Avatar */}
        <div className="wf-card-flush mb-5">
          <div className="wf-card-header">Profile Picture</div>
          <div className="p-6 flex justify-center">
            <AvatarUpload currentAvatarUrl={profile.avatarUrl} onUploadSuccess={handleAvatarSuccess} />
          </div>
        </div>

        {/* Basic info */}
        <div className="wf-card-flush mb-5">
          <div className="wf-card-header">Basic Information</div>
          <div className="p-6">
            <ProfileForm user={profile} onSuccess={handleProfileUpdate} />
          </div>
        </div>

        {/* AI Matching — MENTEE only */}
        {profile.role === "MENTEE" && profile.menteeProfile && (
          <div className="wf-card-flush mb-5">
            <div className="wf-card-header">AI Matching Preferences</div>
            <AiMatchingSection />
          </div>
        )}

        {/* Account info */}
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
                <Link to="/become-mentor" className="wf-btn wf-btn-primary">Become a Mentor</Link>
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
