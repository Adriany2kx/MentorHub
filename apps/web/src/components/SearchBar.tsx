import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  initialValue?: string;
  live?: boolean;
}

export default function SearchBar({
  placeholder = "Search...",
  onSearch,
  initialValue = "",
  live = false,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(value.trim());
  }

  function handleClear() {
    setValue("");
    onSearch("");
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const nextValue = e.target.value;
            setValue(nextValue);
            if (live) onSearch(nextValue.trim());
          }}
          placeholder={placeholder}
          className="wf-input-box pl-9 pr-11 min-h-11"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink w-10 h-10 inline-flex items-center justify-center"
            aria-label="Clear search"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
