import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];

  pages.push(1);

  if (page > 3) {
    pages.push("...");
  }

  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (page < totalPages - 2) {
    pages.push("...");
  }

  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-surface)",
          color: "var(--color-ink-2)",
          cursor: page === 1 ? "not-allowed" : "pointer",
          opacity: page === 1 ? 0.4 : 1,
        }}
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((p, index) =>
        p === "..." ? (
          <span
            key={`ellipsis-${index}`}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "var(--color-ink-3)",
            }}
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              background: p === page ? "var(--color-ink)" : "var(--color-surface)",
              color: p === page ? "var(--color-surface)" : "var(--color-ink-2)",
              cursor: "pointer",
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-surface)",
          color: "var(--color-ink-2)",
          cursor: page === totalPages ? "not-allowed" : "pointer",
          opacity: page === totalPages ? 0.4 : 1,
        }}
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}
