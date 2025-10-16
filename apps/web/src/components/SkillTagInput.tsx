import { useState } from "react";

interface SkillTagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export default function SkillTagInput({
  label,
  tags,
  onChange,
  maxTags = 10,
  placeholder = "Type and press Enter",
}: SkillTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  function addTag() {
    const value = inputValue.trim();
    if (!value) return;
    if (tags.length >= maxTags) return;
    if (tags.includes(value)) {
      setInputValue("");
      return;
    }

    onChange([...tags, value]);
    setInputValue("");
  }

  function removeTag(tagToRemove: string) {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  }

  return (
    <div>
      <label className="wf-label">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="wf-tag wf-tag-active inline-flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:opacity-70"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>
      {tags.length < maxTags && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="wf-input flex-1"
          />
          <button
            type="button"
            onClick={addTag}
            className="wf-btn wf-btn-primary"
          >
            Add
          </button>
        </div>
      )}
      <p className="wf-help-text">
        {tags.length}/{maxTags} tags
      </p>
    </div>
  );
}
