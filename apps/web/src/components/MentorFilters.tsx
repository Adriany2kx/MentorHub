import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);

  function handleApply() {
    onFilterChange({
      expertise: expertise || undefined,
      minRate: minRate ? parseFloat(minRate) : undefined,
      maxRate: maxRate ? parseFloat(maxRate) : undefined,
      minExperience: minExperience ? parseInt(minExperience, 10) : undefined,
    });
    setIsOpen(false);
  }

  function handleClear() {
    setExpertise("");
    setMinRate("");
    setMaxRate("");
    setMinExperience("");
    onFilterChange({});
    setIsOpen(false);
  }

  const hasFilters = expertise || minRate || maxRate || minExperience;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`wf-btn ${hasFilters ? "wf-btn-primary" : "wf-btn-secondary"}`}
      >
        <SlidersHorizontal size={14} />
        Filters
        {hasFilters && (
          <span className="w-1.5 h-1.5 bg-current" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 wf-card p-4 z-10">
          <div className="space-y-4">
            <div>
              <label className="wf-label">
                Field or skill
              </label>
              <select
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                className="wf-select"
              >
                <option value="">Any field or skill</option>
                {POPULAR_EXPERTISE.map((exp) => (
                  <option key={exp} value={exp}>
                    {exp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="wf-label">
                Hourly Rate ($)
              </label>
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
              <label className="wf-label">
                Min. Years Experience
              </label>
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

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleClear}
                className="wf-btn wf-btn-secondary flex-1"
              >
                Clear
              </button>
              <button
                onClick={handleApply}
                className="wf-btn wf-btn-primary flex-1"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
