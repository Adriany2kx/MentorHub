import { useState, useEffect } from "react";
import { getMyAvailability } from "../lib/api";
import type { Availability } from "../lib/api";
import AvailabilityCalendar from "../components/AvailabilityCalendar";

export default function ManageAvailability() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [timezone, setTimezone] = useState("UTC");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const availData = await getMyAvailability();
        setAvailability(availData.availability);
        if (availData.availability.length > 0) {
          setTimezone(availData.availability[0].timezone);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load availability");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Australia/Sydney",
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="wf-h1">My Availability</h1>
            <p className="wf-text-sm mt-1">
              Set the times you're available for mentoring sessions each week.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
              <span className="wf-loading-spinner" aria-hidden="true" />
              <span>Loading availability...</span>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="wf-card">
                <div className="h-4 w-1/4" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="wf-text" style={{ color: "var(--color-error)" }}>{error}</p>
        ) : (
          <div className="wf-card">
            <div className="mb-6">
              <label className="wf-label">Your Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="wf-select"
                style={{ width: "auto" }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className="wf-divider" />

            <div className="mt-6">
              <AvailabilityCalendar
                availability={availability}
                timezone={timezone}
                onChange={setAvailability}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
