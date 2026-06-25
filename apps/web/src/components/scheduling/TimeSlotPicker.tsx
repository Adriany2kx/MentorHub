import { useState, useMemo } from "react";
import { Clock } from "lucide-react";

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  booked?: boolean;
}

interface TimeSlotPickerProps {
  date: Date;
  slots: TimeSlot[];
  selectedSlot?: string;
  onSlotSelect: (time: string) => void;
  duration?: number; // minutes
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

/**
 * TimeSlotPicker — Day view with selectable time slots
 *
 * Features:
 * - Grid of available time slots
 * - Visual distinction for available/booked/selected
 * - Smooth selection animation
 */
export default function TimeSlotPicker({
  date,
  slots,
  selectedSlot,
  onSlotSelect,
  duration = 60,
}: TimeSlotPickerProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const groupedSlots = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach((slot) => {
      const hour = parseInt(slot.time.split(":")[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [slots]);

  const availableCount = slots.filter((s) => s.available && !s.booked).length;

  const renderSlots = (slotGroup: TimeSlot[], label: string) => {
    if (slotGroup.length === 0) return null;

    return (
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-ink-3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 10,
          }}
        >
          {label}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
            gap: 8,
          }}
        >
          {slotGroup.map((slot) => {
            const isSelected = selectedSlot === slot.time;
            const isHovered = hoveredSlot === slot.time;
            const isDisabled = !slot.available || slot.booked;

            return (
              <button
                key={slot.time}
                onClick={() => !isDisabled && onSlotSelect(slot.time)}
                onMouseEnter={() => setHoveredSlot(slot.time)}
                onMouseLeave={() => setHoveredSlot(null)}
                disabled={isDisabled}
                style={{
                  padding: "10px 12px",
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 500,
                  border: `1px solid ${
                    isSelected
                      ? "var(--color-green)"
                      : isHovered && !isDisabled
                      ? "var(--color-green)"
                      : "var(--color-border)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  background: isSelected
                    ? "var(--color-green)"
                    : isHovered && !isDisabled
                    ? "var(--color-green-light)"
                    : slot.booked
                    ? "var(--color-border-soft)"
                    : "var(--color-surface)",
                  color: isSelected
                    ? "#fff"
                    : isDisabled
                    ? "var(--color-ink-3)"
                    : "var(--color-ink)",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.5 : 1,
                  transition: "all 150ms ease",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                }}
              >
                {formatTime(slot.time)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Clock size={16} style={{ color: "var(--color-ink-2)" }} />
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-ink)",
              margin: 0,
            }}
          >
            {formatDate(date)}
          </h3>
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--color-ink-3)",
            margin: 0,
          }}
        >
          {availableCount} slot{availableCount !== 1 ? "s" : ""} available · {duration} min sessions
        </p>
      </div>

      {/* Slots */}
      <div style={{ padding: 20 }}>
        {slots.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              color: "var(--color-ink-3)",
              padding: "20px 0",
            }}
          >
            No time slots available for this day
          </p>
        ) : (
          <>
            {renderSlots(groupedSlots.morning, "Morning")}
            {renderSlots(groupedSlots.afternoon, "Afternoon")}
            {renderSlots(groupedSlots.evening, "Evening")}
          </>
        )}
      </div>

      {/* Selected slot confirmation */}
      {selectedSlot && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-green-light)",
            animation: "slideUp 200ms ease-out",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-green-dark)",
              margin: 0,
            }}
          >
            Selected: {formatTime(selectedSlot)} - {formatTime(
              (() => {
                const [h, m] = selectedSlot.split(":").map(Number);
                const endMinutes = h * 60 + m + duration;
                const endH = Math.floor(endMinutes / 60);
                const endM = endMinutes % 60;
                return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
              })()
            )}
          </p>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes slideUp { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </div>
  );
}
