import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

interface MentorFiltersProps {
  onFilterChange: (filters: {
    expertise?: string;
    minRate?: number;
    maxRate?: number;
    minExperience?: number;
  }) => void;
  initialFilters?: {
    expertise?: string;
    minRate?: number;
    maxRate?: number;
    minExperience?: number;
  };
}

const POPULAR_EXPERTISE = [
  // Universal
  "Career Change", "Career Growth", "Leadership",
  "Interview Preparation", "CV & Applications", "Networking",
  // Law
  "Solicitor", "Barrister", "Legal Practice", "In-House Counsel", "Legal Training Contracts",
  // Finance
  "Chartered Accountancy", "Investment Banking", "Financial Planning", "Audit & Tax",
  // Healthcare
  "Medical Careers", "Nursing", "Allied Health", "NHS Career Pathways",
  // Business
  "Consulting", "Entrepreneurship", "Operations Management", "Project Management",
  // Education
  "Teaching", "Educational Leadership", "Academia & Research",
  // Marketing & Creative
  "Marketing Strategy", "PR & Communications", "Graphic Design",
  // Tech
  "Product Management", "UX Design", "Data Science", "Software Development",
];

export default function MentorFilters({ onFilterChange, initialFilters = {} }: MentorFiltersProps) {
  const [expertise, setExpertise] = useState(initialFilters.expertise || "");
  const [minRate, setMinRate] = useState(initialFilters.minRate?.toString() || "");
  const [maxRate, setMaxRate] = useState(initialFilters.maxRate?.toString() || "");
  const [minExperience, setMinExperience] = useState(initialFilters.minExperience?.toString() || "");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-apply on change (debounced)
  // Note: onFilterChange excluded from deps intentionally to avoid infinite loops
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange({
        expertise: expertise || undefined,
        minRate: minRate ? parseFloat(minRate) : undefined,
        maxRate: maxRate ? parseFloat(maxRate) : undefined,
        minExperience: minExperience ? parseInt(minExperience, 10) : undefined,
      });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expertise, minRate, maxRate, minExperience]);

  function handleClear() {
    setExpertise("");
    setMinRate("");
    setMaxRate("");
    setMinExperience("");
  }

  const hasFilters = expertise || minRate || maxRate || minExperience;
  const filterCount = [expertise, minRate, maxRate, minExperience].filter(Boolean).length;

  const filterContent = (
    <div className="space-y-5">
      <div>
        <label className="wf-label">Field or skill</label>
        <select
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
          className="wf-select"
        >
          <option value="">Any field</option>
          {POPULAR_EXPERTISE.map((exp) => (
            <option key={exp} value={exp}>{exp}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="wf-label">Hourly rate ($)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minRate}
            onChange={(e) => setMinRate(e.target.value)}
            className="wf-input"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxRate}
            onChange={(e) => setMaxRate(e.target.value)}
            className="wf-input"
          />
        </div>
      </div>

      <div>
        <label className="wf-label">Min. experience (years)</label>
        <input
          type="number"
          min="0"
          max="50"
          placeholder="e.g., 5"
          value={minExperience}
          onChange={(e) => setMinExperience(e.target.value)}
          className="wf-input"
        />
      </div>

      {hasFilters && (
        <button onClick={handleClear} className="wf-btn wf-btn-ghost w-full text-sm">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: persistent frosted sidebar */}
      <div
        className="hidden lg:block sticky top-[calc(var(--topnav-height)+16px)] p-5 rounded-xl"
        style={{
          background: "rgba(243, 238, 230, 0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="wf-text font-semibold" style={{ color: "var(--color-ink)" }}>
            Filters
          </h3>
          {filterCount > 0 && (
            <span
              className="wf-text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--color-teal)", color: "#fff" }}
            >
              {filterCount}
            </span>
          )}
        </div>
        {filterContent}
      </div>

      {/* Mobile: toggle button + drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className={`wf-btn ${hasFilters ? "wf-btn-primary" : "wf-btn-secondary"} w-full`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {filterCount > 0 && (
            <span
              className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              {filterCount}
            </span>
          )}
        </button>

        {mobileOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <div
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] z-50 p-6 overflow-y-auto"
              style={{
                background: "var(--color-surface)",
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="wf-h3">Filters</h3>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              </div>
              {filterContent}
              <button
                onClick={() => setMobileOpen(false)}
                className="wf-btn wf-btn-primary w-full mt-6"
              >
                Show results
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
