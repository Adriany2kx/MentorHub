import { useState, useEffect, useCallback } from "react";
import { listPrograms } from "../lib/api";
import type { Program, Pagination } from "../lib/api";
import ProgramCard from "../components/ProgramCard";
import SearchBar from "../components/SearchBar";
import PaginationComponent from "../components/Pagination";

export default function ProgramList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listPrograms({ page, limit: 9, search: search || undefined });
      setPrograms(data.programs);
      setPagination(data.pagination);
    } catch {
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  function handleSearch(q: string) {
    setSearch(q);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="wf-page py-10">
        {/* Page header */}
        <div className="wf-page-header mb-8">
          <h1 className="wf-h1">Programs</h1>
          <p className="wf-text text-ink-2 mt-2">
            Structured mentorship programs designed to help you reach your goals.
          </p>
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
                <div key={i} className="wf-card animate-pulse space-y-3 p-6">
                  <div className="h-4 bg-paper-2 w-3/4" />
                  <div className="h-3 bg-paper-2" />
                  <div className="h-3 bg-paper-2 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ) : programs.length === 0 ? (
          <div className="wf-empty">
            <div className="wf-h3 mb-2">No programs found</div>
            <p className="wf-text-sm text-ink-3">Try adjusting your search.</p>
          </div>
        ) : (
          <>
            <p className="wf-text-xs text-ink-3 mb-4">
              {pagination?.total ?? 0} program{(pagination?.total ?? 0) !== 1 ? "s" : ""} available
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {programs.map((p) => (
                <ProgramCard key={p.id} program={p} />
              ))}
            </div>
            {pagination && (
              <PaginationComponent
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
