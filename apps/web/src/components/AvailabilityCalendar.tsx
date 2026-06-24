import { useState } from "react";
import { Plus, X } from "lucide-react";
import { setAvailabilityBulk } from "../lib/api";
import type { Availability } from "../lib/api";

interface AvailabilityCalendarProps {
  availability: Availability[];
  timezone: string;
  onChange: (updated: Availability[]) => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMES = Array.from({ length: 24 * 2 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

interface SlotDraft {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function AvailabilityCalendar({
  availability,
  timezone,
  onChange,
}: AvailabilityCalendarProps) {
  const [drafts, setDrafts] = useState<SlotDraft[]>(
    availability.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function addSlot(day: number) {
    setDrafts((prev) => [...prev, { dayOfWeek: day, startTime: "09:00", endTime: "10:00" }]);
  }

  function updateSlot(index: number, field: "startTime" | "endTime", value: string) {
    setDrafts((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  }

  function removeSlot(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSuccess(false);

    // Validate all slots
    for (const slot of drafts) {
      if (slot.startTime >= slot.endTime) {
        setError("End time must be after start time for all slots");
        setIsSaving(false);
        return;
      }
    }

    try {
      const res = await setAvailabilityBulk({ slots: drafts, timezone });
      onChange(res.availability);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save availability");
    } finally {
      setIsSaving(false);
    }
  }

  const slotsByDay = DAYS.map((_, day) =>
    drafts
      .map((slot, index) => ({ ...slot, index }))
      .filter((slot) => slot.dayOfWeek === day)
  );

  return (
    <div className="space-y-3">
      {DAYS.map((day, dayIndex) => (
        <div key={day} className="border border-line p-4 bg-paper">
          <div className="flex items-center justify-between mb-3">
            <h4 className="wf-h3">{day}</h4>
            <button
              type="button"
              onClick={() => addSlot(dayIndex)}
              className="wf-btn wf-btn-link flex items-center gap-1"
            >
              <Plus size={12} />
              Add slot
            </button>
          </div>

          {slotsByDay[dayIndex].length === 0 ? (
            <p className="wf-text-sm text-ink-3 italic">No availability set</p>
          ) : (
            <div className="space-y-2">
              {slotsByDay[dayIndex].map(({ index, startTime, endTime }) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={startTime}
                    onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                    className="wf-select w-auto"
                  >
                    {TIMES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="wf-text-sm text-ink-3">to</span>
                  <select
                    value={endTime}
                    onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                    className="wf-select w-auto"
                  >
                    {TIMES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="text-ink-3 hover:text-error ml-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {error && <p className="wf-error-text">{error}</p>}
      {success && <p className="wf-text-sm text-success">Availability saved successfully!</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="wf-btn wf-btn-primary w-full"
      >
        {isSaving ? "Saving..." : "Save Availability"}
      </button>
    </div>
  );
}
