import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Star, CheckCircle, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateMyProfile, createMenteeProfile, updateMenteeProfile } from "../lib/api";
import type { SkillEntry } from "../lib/api";
import AvatarUpload from "../components/AvatarUpload";

// ---------------------------------------------------------------------------
// Step 1 data
// ---------------------------------------------------------------------------
const COMMON_ROLES = [
  "Software Engineer", "Product Manager", "Data Scientist", "UX Designer",
  "Engineering Manager", "Data Analyst", "Marketing Manager", "Business Analyst",
  "DevOps Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Machine Learning Engineer", "Product Designer", "Startup Founder", "Consultant",
];

// ---------------------------------------------------------------------------
// Step 2 data — skill suggestions grouped by tab
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

// ---------------------------------------------------------------------------
// Step 3 data
// ---------------------------------------------------------------------------
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
// Progress bar component
// ---------------------------------------------------------------------------
function StepBar({ step }: { step: number }) {
  const count = 4;
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: count }, (_, i) => {
        const num = i + 1;
        const done = num < step;
        const active = num === step;
        return (
          <div key={num} className="flex items-center flex-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0"
              style={{
                background: done || active ? "var(--color-blue)" : "var(--color-border)",
                color: done || active ? "#fff" : "var(--color-ink-3)",
              }}
            >
              {done ? <Check size={14} /> : num}
            </div>
            {i < count - 1 && (
              <div
                className="h-px flex-1 mx-1"
                style={{ background: num < step ? "var(--color-blue)" : "var(--color-border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ProfileSetup() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [timezone] = useState(detectedTz || "UTC");

  // Step 2
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [activeTab, setActiveTab] = useState<SkillTab>("Technical");
  const [customSkill, setCustomSkill] = useState("");

  // Step 3
  const [targetIndustry, setTargetIndustry] = useState("");
  const [currentBlocker, setCurrentBlocker] = useState("");
  const [learningStyle, setLearningStyle] = useState<"structured" | "exploratory" | "project-based" | "">("");

  // ---------------------------------------------------------------------------
  // Step helpers
  // ---------------------------------------------------------------------------
  function toggleSkill(skillName: string) {
    setSkills((prev) => {
      const exists = prev.find((s) => s.skill === skillName);
      if (exists) return prev.filter((s) => s.skill !== skillName);
      if (prev.length >= 8) return prev; // cap at 8
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

  // ---------------------------------------------------------------------------
  // Save step 1 — profile basics
  // ---------------------------------------------------------------------------
  async function saveStep1() {
    if (!firstName.trim()) { setError("First name is required"); return; }
    if (!currentRole.trim() || !targetRole.trim()) { setError("Please fill in both your current and target role"); return; }
    setError("");
    setSaving(true);
    try {
      await updateMyProfile({ firstName: firstName.trim(), lastName: lastName.trim(), timezone });
      try {
        await createMenteeProfile({ currentRole: currentRole.trim(), targetRole: targetRole.trim() });
      } catch {
        await updateMenteeProfile({ currentRole: currentRole.trim(), targetRole: targetRole.trim() });
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Save step 2 — skills (skip-friendly)
  // ---------------------------------------------------------------------------
  async function saveStep2(skip = false) {
    setSaving(true);
    try {
      if (!skip && skills.length > 0) {
        await updateMenteeProfile({ skills });
      }
      setStep(3);
    } catch {
      // non-blocking — move on anyway
      setStep(3);
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Save step 3 — focus (skip-friendly)
  // ---------------------------------------------------------------------------
  async function saveStep3(skip = false) {
    setSaving(true);
    try {
      if (!skip) {
        await updateMenteeProfile({
          targetIndustry: targetIndustry || null,
          currentBlocker: currentBlocker.trim() || null,
          learningStyle: (learningStyle as "structured" | "exploratory" | "project-based") || null,
        });
      }
      setStep(4);
    } catch {
      setStep(4);
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Finish — go to dashboard
  // ---------------------------------------------------------------------------
  async function finish() {
    setSaving(true);
    try {
      await refreshUser();
      navigate("/dashboard?welcome=1");
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-155 mx-auto">
        <StepBar step={step} />

        {/* ── STEP 1 — About You ── */}
        {step === 1 && (
          <div className="wf-card-flush">
            <div className="wf-card-header">About You</div>
            <div className="p-6 space-y-5">
              <div>
                <h1 className="wf-h2 mb-1">Where are you going?</h1>
                <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                  This is the only required step — takes about 30 seconds.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="wf-label">First name *</label>
                  <input className="wf-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} placeholder="Alex" />
                </div>
                <div>
                  <label className="wf-label">Last name</label>
                  <input className="wf-input" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} placeholder="Smith" />
                </div>
              </div>

              <div>
                <label className="wf-label">Your current role *</label>
                <input
                  className="wf-input" list="current-roles"
                  value={currentRole} onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                />
                <datalist id="current-roles">
                  {COMMON_ROLES.map((r) => <option key={r} value={r} />)}
                </datalist>
              </div>

              <div>
                <label className="wf-label">Where do you want to be? *</label>
                <input
                  className="wf-input" list="target-roles"
                  value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Product Manager"
                />
                <datalist id="target-roles">
                  {COMMON_ROLES.map((r) => <option key={r} value={r} />)}
                </datalist>
                <p className="wf-help-text mt-1">This is the core of your mentor matching</p>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                <Info size={16} className="shrink-0" style={{ color: "var(--color-ink-3)" }} />
                <p className="wf-text-xs" style={{ color: "var(--color-ink-2)" }}>
                  Timezone auto-detected as <strong>{timezone}</strong> — you can change this in profile settings later.
                </p>
              </div>

              {error && <p className="wf-error-text" role="alert">{error}</p>}

              <div className="pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                <button onClick={saveStep1} disabled={saving} className="wf-btn wf-btn-primary w-full">
                  {saving ? "Saving…" : "Continue →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 — Skills ── */}
        {step === 2 && (
          <div className="wf-card-flush">
            <div className="wf-card-header" style={{ justifyContent: "space-between" }}>
              <span>Your Skills</span>
              <span className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>{skills.length}/8 selected</span>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h1 className="wf-h2 mb-1">What skills do you already have?</h1>
                <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Pick up to 8. Rate each one — this powers your mentor recommendations.
                </p>
              </div>

              {/* Tab selector */}
              <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                {(Object.keys(SKILL_SUGGESTIONS) as SkillTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                    style={{
                      background: activeTab === tab ? "var(--color-blue)" : "transparent",
                      color: activeTab === tab ? "#fff" : "var(--color-ink-2)",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Skill tag cloud */}
              <div className="flex flex-wrap gap-2">
                {SKILL_SUGGESTIONS[activeTab].map((skillName) => {
                  const selected = skills.find((s) => s.skill === skillName);
                  return (
                    <button
                      key={skillName}
                      onClick={() => toggleSkill(skillName)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
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

              {/* Custom skill input */}
              <div className="flex gap-2">
                <input
                  className="wf-input flex-1"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                  placeholder="Add a skill not listed…"
                  maxLength={60}
                  disabled={skills.length >= 8}
                />
                <button onClick={addCustomSkill} disabled={!customSkill.trim() || skills.length >= 8} className="wf-btn wf-btn-secondary">
                  Add
                </button>
              </div>

              {/* Proficiency ratings for selected skills */}
              {skills.length > 0 && (
                <div className="space-y-3 pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <p className="wf-text-sm font-medium">Rate your level for each selected skill:</p>
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

              <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                <button onClick={() => saveStep2(true)} disabled={saving} className="wf-btn wf-btn-secondary">
                  Skip for now
                </button>
                <button onClick={() => saveStep2(false)} disabled={saving} className="wf-btn wf-btn-primary">
                  {saving ? "Saving…" : skills.length > 0 ? `Save ${skills.length} skill${skills.length > 1 ? "s" : ""} →` : "Continue →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Focus ── */}
        {step === 3 && (
          <div className="wf-card-flush">
            <div className="wf-card-header">Your Focus</div>
            <div className="p-6 space-y-6">
              <div>
                <h1 className="wf-h2 mb-1">Tell us a bit more</h1>
                <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Two quick questions. Both are optional but make a big difference.
                </p>
              </div>

              {/* Target industry */}
              <div>
                <label className="wf-label mb-2 block">Target industry</label>
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
                <label className="wf-label">What's your biggest challenge right now?</label>
                <p className="wf-help-text mb-2">This is used to generate your session agendas</p>
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
                <label className="wf-label mb-2 block">How do you learn best?</label>
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

              {/* Mid-flow value hook */}
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-blue) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--color-blue) 20%, transparent)" }}>
                <Star size={20} style={{ color: "var(--color-blue)" }} />
                <p className="wf-text-sm" style={{ color: "var(--color-blue)" }}>
                  <strong>Your answers unlock AI-generated session agendas</strong> — mentors get a tailored plan before every session.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                <button onClick={() => saveStep3(true)} disabled={saving} className="wf-btn wf-btn-secondary">
                  Skip for now
                </button>
                <button onClick={() => saveStep3(false)} disabled={saving} className="wf-btn wf-btn-primary">
                  {saving ? "Saving…" : "Continue →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4 — Finish ── */}
        {step === 4 && (
          <div className="wf-card-flush">
            <div className="wf-card-header">Almost there</div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-blue) 10%, transparent)" }}>
                  <CheckCircle size={28} style={{ color: "var(--color-blue)" }} />
                </div>
                <h1 className="wf-h2 mb-1">You're all set{firstName ? `, ${firstName}` : ""}!</h1>
                <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
                  Add a photo to make your profile stand out. Totally optional — you can do it later.
                </p>
              </div>

              <div className="flex justify-center">
                <AvatarUpload
                  currentAvatarUrl={user?.avatarUrl ?? null}
                  onUploadSuccess={() => {}}
                />
              </div>

              <div className="space-y-3 pt-2">
                <button onClick={finish} disabled={saving} className="wf-btn wf-btn-primary w-full">
                  {saving ? "Setting up…" : "Go to my dashboard →"}
                </button>
                <button onClick={finish} disabled={saving} className="wf-btn-link w-full text-center block text-sm" style={{ color: "var(--color-ink-3)" }}>
                  Skip photo for now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
