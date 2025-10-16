interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  // Show ellipsis if there's a gap
  if (page > 3) {
    pages.push("...");
  }

  // Show pages around current page
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Show ellipsis if there's a gap
  if (page < totalPages - 2) {
    pages.push("...");
  }

  // Always show last page
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 font-mono">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center border border-line text-ink-2 hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((p, index) =>
        p === "..." ? (
          <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center wf-text-xs text-ink-3">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 flex items-center justify-center wf-text-sm border ${
              p === page
                ? "bg-ink text-paper border-ink"
                : "border-line text-ink-2 hover:bg-paper-2"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center border border-line text-ink-2 hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
