import { useState } from "react";
import { Search, X } from "lucide-react";

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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink w-10 h-10 inline-flex items-center justify-center"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
