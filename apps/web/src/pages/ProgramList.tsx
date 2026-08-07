import { useState, useEffect, useCallback } from "react";
import { listPrograms } from "../lib/api";
import type { Program, Pagination } from "../lib/api";
import ProgramCard from "../components/ProgramCard";
import SearchBar from "../components/SearchBar";
import PaginationComponent from "../components/Pagination";
import { withViewTransition } from "../lib/withViewTransition";
import { Search } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "career", label: "Career Growth" },
  { id: "leadership", label: "Leadership" },
  { id: "technical", label: "Technical" },
  { id: "business", label: "Business" },
  { id: "interview", label: "Interview Prep" },
];

export default function ProgramList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      // Category maps to topic search
      const topicSearch = category !== "all" ? category : undefined;
      const combinedSearch = [search, topicSearch].filter(Boolean).join(" ");
      const data = await listPrograms({
        page,
        limit: 9,
        search: combinedSearch || undefined,
      });
      setPrograms(data.programs);
      setPagination(data.pagination);
    } catch {
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  function handleSearch(q: string) {
    withViewTransition(() => {
      setSearch(q);
      setPage(1);
    });
  }

  function handleCategoryChange(cat: string) {
    withViewTransition(() => {
      setCategory(cat);
      setPage(1);
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page py-10">
        {/* Page header */}
        <div className="wf-page-header mb-8">
          <h1 className="wf-h1">Programs</h1>
          <p className="wf-text text-ink-2 mt-2">
            Structured mentorship programs designed to help you reach your goals.
          </p>
        </div>

        {/* Category tabs */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: category === cat.id ? "var(--color-teal)" : "var(--color-surface)",
                color: category === cat.id ? "#fff" : "var(--color-ink-2)",
                border: `1px solid ${category === cat.id ? "var(--color-teal)" : "var(--color-border)"}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8 max-w-lg">
          <SearchBar placeholder="Search programs..." onSearch={handleSearch} initialValue={search} />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
              <span className="wf-loading-spinner" aria-hidden="true" />
              <span>Loading programs...</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="wf-card space-y-3 p-6">
                  <div className="wf-skeleton wf-skeleton-title w-3/4" />
                  <div className="wf-skeleton wf-skeleton-text" />
                  <div className="wf-skeleton wf-skeleton-text w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ) : programs.length === 0 ? (
          <div className="wf-empty">
            <Search size={48} className="mx-auto mb-3" style={{ color: "var(--color-ink-3)" }} />
            <p className="wf-empty-title">No programs found</p>
            <p className="wf-empty-text">
              {search || category !== "all"
                ? "Try adjusting your search or selecting a different category."
                : "Check back soon — new programs are added regularly."}
            </p>
            {(search || category !== "all") && (
              <button
                className="wf-btn wf-btn-secondary mt-4"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="wf-text-xs text-ink-3 mb-4">
              {pagination?.total ?? 0} program{(pagination?.total ?? 0) !== 1 ? "s" : ""} available
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
              style={{ viewTransitionName: "program-results" }}
            >
              {programs.map((p) => (
                <ProgramCard key={p.id} program={p} />
              ))}
            </div>
            {pagination && (
              <PaginationComponent
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => withViewTransition(() => setPage(p))}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
