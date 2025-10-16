import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { listMyBookings } from "../lib/api";
import type { Booking } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BookingCard from "../components/BookingCard";
import { withViewTransition } from "../lib/withViewTransition";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listMyBookings()
      .then((d) => setBookings(d.bookings))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load bookings"))
      .finally(() => setIsLoading(false));
  }, []);

  const viewAs = user?.role === "MENTOR" || user?.role === "ADMIN" ? "mentor" : "mentee";

  const tabs = ["Upcoming", "Past", "Cancelled"] as const;
  type Tab = typeof tabs[number];
  const [activeTab, setActiveTab] = useState<Tab>("Upcoming");
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(680);
  const listRef = useRef<HTMLDivElement>(null);

  const upcomingBookings = bookings.filter((b) => ["PENDING", "CONFIRMED", "ACTIVE"].includes(b.status));
  const pastBookings = bookings.filter((b) => b.status === "COMPLETED");
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED");

  const tabBookings: Record<Tab, typeof bookings> = {
    Upcoming: upcomingBookings,
    Past: pastBookings,
    Cancelled: cancelledBookings,
  };
  const visibleBookings = tabBookings[activeTab];

  const ROW_HEIGHT = 172;
  const ROW_GAP = 12;
  const ITEM_HEIGHT = ROW_HEIGHT + ROW_GAP;
  const VIRTUALIZE_AT = 24;
  const shouldVirtualize = visibleBookings.length >= VIRTUALIZE_AT;

  useEffect(() => {
    const list = listRef.current;
    if (!list || !shouldVirtualize) return;

    const observer = new ResizeObserver(() => {
      setViewportHeight(list.clientHeight);
    });

    observer.observe(list);
    setViewportHeight(list.clientHeight);

    return () => observer.disconnect();
  }, [shouldVirtualize, activeTab, visibleBookings.length]);

  const virtualWindow = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        start: 0,
        end: visibleBookings.length,
        offsetY: 0,
        totalHeight: 0,
      };
    }

    const overscan = 5;
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - overscan);
    const visibleCount = Math.ceil(viewportHeight / ITEM_HEIGHT) + overscan * 2;
    const end = Math.min(visibleBookings.length, start + visibleCount);

    return {
      start,
      end,
      offsetY: start * ITEM_HEIGHT,
      totalHeight: visibleBookings.length * ITEM_HEIGHT,
    };
  }, [shouldVirtualize, visibleBookings.length, scrollTop, ITEM_HEIGHT, viewportHeight]);

  const virtualSlice = shouldVirtualize
    ? visibleBookings.slice(virtualWindow.start, virtualWindow.end)
    : visibleBookings;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page max-w-3xl mx-auto">
        {/* Page header */}
        <div className="wf-page-header">
          <p className="wf-eyebrow mb-1">
            {viewAs === "mentor" ? "Mentor" : "Mentee"}
          </p>
          <h1 className="wf-h1">My Bookings</h1>
          <p className="wf-text-sm mt-1">
            {viewAs === "mentor" ? "Manage incoming booking requests." : "Track your mentorship program bookings."}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6 flex gap-6" style={{ borderColor: "var(--color-border)" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                withViewTransition(() => {
                  setActiveTab(tab);
                  setScrollTop(0);
                });
              }}
              className={`pb-2 wf-text font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 font-semibold"
                  : "border-b-2 border-transparent"
              }`}
              style={{
                ...(activeTab === tab
                  ? { borderColor: "var(--color-ink)", color: "var(--color-ink)" }
                  : { color: "var(--color-ink-3)" }),
                viewTransitionName: activeTab === tab ? "bookings-active-tab" : undefined,
              }}
            >
              {tab}
              {tabBookings[tab].length > 0 && (
                <span className="ml-1.5 wf-text-xs" style={{ color: "var(--color-ink-3)" }}>({tabBookings[tab].length})</span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
              <span className="wf-loading-spinner" aria-hidden="true" />
              <span>Loading bookings...</span>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="wf-card animate-pulse">
                <div className="h-4 w-1/2 mb-3" style={{ background: "var(--color-bg)" }} />
                <div className="h-3 w-1/3" style={{ background: "var(--color-bg)" }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="wf-error-text">{error}</p>
        ) : visibleBookings.length === 0 ? (
          <div className="wf-empty">
            <p className="wf-empty-title">
              {activeTab === "Upcoming" ? "No upcoming bookings" : activeTab === "Past" ? "No completed sessions yet" : "No cancelled bookings"}
            </p>
            <p className="wf-empty-text">
              {activeTab === "Upcoming" && viewAs === "mentee" && "Find a mentor and choose a program to book your first session."}
              {activeTab === "Upcoming" && viewAs === "mentor" && "No booking requests yet. Make sure your programs are published and your profile is complete."}
              {activeTab === "Past" && "Sessions you complete will appear here."}
              {activeTab === "Cancelled" && "Any cancelled bookings will appear here."}
            </p>
            {activeTab === "Upcoming" && viewAs === "mentee" && (
              <Link to="/programs" className="wf-btn wf-btn-secondary mt-4">
                Browse programs
              </Link>
            )}
          </div>
        ) : (
          shouldVirtualize ? (
            <div>
              <p className="wf-text-xs mb-3" style={{ color: "var(--color-ink-3)" }}>
                Performance mode: virtualized list enabled for {visibleBookings.length} bookings.
              </p>
              <div
                ref={listRef}
                className="wf-overdrive-scroll"
                style={{
                  maxHeight: "min(68vh, 920px)",
                  overflowY: "auto",
                  overflowX: "hidden",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
              >
                <div style={{ height: virtualWindow.totalHeight, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      transform: `translateY(${virtualWindow.offsetY}px)`,
                      padding: 16,
                    }}
                  >
                    <div className="space-y-4">
                      {virtualSlice.map((b) => (
                        <BookingCard key={b.id} booking={b} viewAs={viewAs} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4" style={{ viewTransitionName: "bookings-list" }}>
              {visibleBookings.map((b) => (
                <BookingCard key={b.id} booking={b} viewAs={viewAs} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
