import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, AlertCircle } from "lucide-react";
import { listMentors } from "../lib/api";
import type { MentorListItem, Pagination as PaginationType } from "../lib/api";
import MentorCard from "../components/MentorCard";
import MentorFilters from "../components/MentorFilters";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { withViewTransition } from "../lib/withViewTransition";

export default function MentorDirectory() {
  const [searchParams] = useSearchParams();
  const [mentors, setMentors] = useState<MentorListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [filters, setFilters] = useState<{
    expertise?: string;
    minRate?: number;
    maxRate?: number;
    minExperience?: number;
  }>({});

  const fetchMentors = useCallback(async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const data = await listMentors({
        page,
        limit: 9,
        search: search || undefined,
        ...filters,
      });
      setMentors(data.mentors);
      setPagination(data.pagination);
    } catch {
      setMentors([]);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  function handleSearch(q: string) {
    withViewTransition(() => {
      setSearch(q);
      setPage(1);
    });
  }

  function handleFilterChange(newFilters: typeof filters) {
    withViewTransition(() => {
      setFilters(newFilters);
      setPage(1);
    });
  }

  function handlePageChange(nextPage: number) {
    withViewTransition(() => {
      setPage(nextPage);
    });
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="wf-page py-10">
        {/* Page header */}
        <div className="wf-page-header mb-8">
          <h1 className="wf-h1">Find a Mentor</h1>
          <p className="wf-text text-ink-2 mt-2">
            Browse mentors across law, medicine, finance, tech, education, and beyond — all vetted, all ready to help.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <SearchBar
            placeholder="Search by field, role, or skill (e.g. nurse, solicitor, marketing)..."
            onSearch={handleSearch}
            initialValue={search}
          />
        </div>

        {/* Filters + Results layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* Filter sidebar */}
          <aside>
            <MentorFilters onFilterChange={handleFilterChange} initialFilters={filters} />
          </aside>

          {/* Results */}
          <div>
            {isLoading ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
                  <span className="wf-loading-spinner" aria-hidden="true" />
                  <span>Loading mentors...</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="wf-card animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-paper-2 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-paper-2 w-3/4" />
                          <div className="h-3 bg-paper-2 w-full" />
                          <div className="h-3 bg-paper-2 w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : fetchError ? (
              <div className="wf-empty">
                <AlertCircle size={48} className="mx-auto mb-3" style={{ color: "var(--color-ink-3)" }} />
                <p className="wf-empty-title">Couldn't load mentors</p>
                <p className="wf-empty-text">Check your connection and try again.</p>
                <button className="wf-btn wf-btn-secondary mt-4" onClick={fetchMentors}>
                  Retry
                </button>
              </div>
            ) : mentors.length === 0 ? (
              <div className="wf-empty">
                <Search size={48} className="mx-auto mb-3" style={{ color: "var(--color-ink-3)" }} />
                <p className="wf-empty-title">No mentors found</p>
                <p className="wf-empty-text">Try a broader term — like "finance", "healthcare", or "law" — or clear your filters to browse all mentors.</p>
              </div>
            ) : (
              <>
                <p className="wf-text-xs text-ink-3 mb-4">
                  {pagination?.total ?? 0} mentor{(pagination?.total ?? 0) !== 1 ? "s" : ""} found
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8" style={{ viewTransitionName: "mentor-results" }}>
                  {mentors.map((mentor) => (
                    <MentorCard key={mentor.id} mentor={mentor} />
                  ))}
                </div>
                {pagination && (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
