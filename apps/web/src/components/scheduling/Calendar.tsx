import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarEvent {
  id: string;
  date: Date;
  startTime?: string; // "09:00"
  endTime?: string; // "10:00"
  title?: string;
  status: "available" | "busy" | "pending" | "booked";
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  selectedDate?: Date;
  view?: "month" | "week";
  minDate?: Date;
  maxDate?: Date;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS = {
  available: { bg: "var(--color-green-light)", border: "var(--color-green)", dot: "var(--color-green)" },
  busy: { bg: "var(--color-border-soft)", border: "var(--color-border)", dot: "var(--color-ink-3)" },
  pending: { bg: "var(--color-warn-bg, #fef3c7)", border: "var(--color-warn, #f59e0b)", dot: "var(--color-warn, #f59e0b)" },
  booked: { bg: "var(--color-green-light)", border: "var(--color-green-dark)", dot: "var(--color-green-dark)" },
};

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add padding days from next month
  const endPadding = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Calendar — Viewport-style calendar UI
 *
 * Features:
 * - Month view with availability indicators
 * - Week view with time slots
 * - Color coding: available, busy, pending, booked
 * - Date selection with hover effects
 */
export default function Calendar({
  events = [],
  onDateSelect,
  onEventClick,
  selectedDate,
  view = "month",
  minDate,
  maxDate,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const days = useMemo(() => {
    if (view === "month") {
      return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    }
    return getWeekDays(currentDate);
  }, [currentDate, view]);

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((e) => isSameDay(new Date(e.date), date));
  };

  const isDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const navigate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === "month") {
        next.setMonth(next.getMonth() + (direction === "next" ? 1 : -1));
      } else {
        next.setDate(next.getDate() + (direction === "next" ? 7 : -7));
      }
      return next;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--color-ink)",
              margin: 0,
            }}
          >
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={goToToday}
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "4px 10px",
              background: "var(--color-border-soft)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-ink-2)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-green-light)";
              e.currentTarget.style.color = "var(--color-green-dark)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-border-soft)";
              e.currentTarget.style.color = "var(--color-ink-2)";
            }}
          >
            Today
          </button>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => navigate("prev")}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-border-soft)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            <ChevronLeft size={16} style={{ color: "var(--color-ink-2)" }} />
          </button>
          <button
            onClick={() => navigate("next")}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-border-soft)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            <ChevronRight size={16} style={{ color: "var(--color-ink-2)" }} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {DAYS.map((day) => (
          <div
            key={day}
            style={{
              padding: "10px 0",
              textAlign: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-ink-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
        }}
      >
        {days.map((date, index) => {
          const dayEvents = getEventsForDay(date);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const disabled = isDisabled(date);
          const inMonth = isCurrentMonth(date);

          return (
            <button
              key={index}
              onClick={() => !disabled && onDateSelect?.(date)}
              disabled={disabled}
              style={{
                position: "relative",
                aspectRatio: "1",
                minHeight: 60,
                padding: 4,
                background: isSelected
                  ? "var(--color-green-light)"
                  : "transparent",
                border: "none",
                borderRight: (index + 1) % 7 !== 0 ? "1px solid var(--color-border-soft)" : "none",
                borderBottom: index < 35 ? "1px solid var(--color-border-soft)" : "none",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.3 : inMonth ? 1 : 0.4,
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isSelected) {
                  e.currentTarget.style.background = "var(--color-border-soft)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {/* Date number */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontSize: 13,
                  fontWeight: isToday || isSelected ? 600 : 400,
                  color: isToday
                    ? "#fff"
                    : isSelected
                    ? "var(--color-green-dark)"
                    : "var(--color-ink)",
                  background: isToday ? "var(--color-green)" : "transparent",
                  margin: "0 auto",
                }}
              >
                {date.getDate()}
              </div>

              {/* Event indicators */}
              {dayEvents.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                    marginTop: 4,
                    flexWrap: "wrap",
                  }}
                >
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div
                      key={event.id || i}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: STATUS_COLORS[event.status].dot,
                        cursor: "pointer",
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--color-ink-3)",
                      }}
                    >
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          padding: "12px 20px",
          borderTop: "1px solid var(--color-border)",
          flexWrap: "wrap",
        }}
      >
        {(Object.entries(STATUS_COLORS) as [keyof typeof STATUS_COLORS, typeof STATUS_COLORS[keyof typeof STATUS_COLORS]][]).map(
          ([status, colors]) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: colors.dot,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--color-ink-3)",
                  textTransform: "capitalize",
                }}
              >
                {status}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
