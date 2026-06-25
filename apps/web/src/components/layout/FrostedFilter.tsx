import { useState } from "react";
import { X, Filter, ChevronDown, Check } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
}

interface FrostedFilterProps {
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  onChange: (groupId: string, values: string[]) => void;
  onClear: () => void;
  onApply?: () => void;
  loading?: boolean;
}

/**
 * FrostedFilter — Glass morphism filter menu
 *
 * Features:
 * - Glass morphism effect (backdrop-filter: blur)
 * - Filter chips with remove animation
 * - Clear all button
 * - Apply button with loading state
 */
export default function FrostedFilter({
  groups,
  selected,
  onChange,
  onClear,
  onApply,
  loading = false,
}: FrostedFilterProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const totalSelected = Object.values(selected).flat().length;

  const toggleOption = (groupId: string, value: string, multiSelect: boolean) => {
    const current = selected[groupId] || [];
    if (multiSelect) {
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange(groupId, newValues);
    } else {
      onChange(groupId, current.includes(value) ? [] : [value]);
    }
  };

  const removeFilter = (groupId: string, value: string) => {
    const current = selected[groupId] || [];
    onChange(
      groupId,
      current.filter((v) => v !== value)
    );
  };

  const getLabel = (groupId: string, value: string): string => {
    const group = groups.find((g) => g.id === groupId);
    const option = group?.options.find((o) => o.value === value);
    return option?.label || value;
  };

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={16} style={{ color: "var(--color-ink-2)" }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-ink)",
            }}
          >
            Filters
          </span>
          {totalSelected > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 10,
                background: "var(--color-green)",
                color: "#fff",
              }}
            >
              {totalSelected}
            </span>
          )}
        </div>

        {totalSelected > 0 && (
          <button
            onClick={onClear}
            style={{
              fontSize: 12,
              color: "var(--color-ink-3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-border-soft)";
              e.currentTarget.style.color = "var(--color-error)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--color-ink-3)";
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {totalSelected > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: "1px solid var(--color-border-soft)",
          }}
        >
          {Object.entries(selected).flatMap(([groupId, values]) =>
            values.map((value) => (
              <span
                key={`${groupId}-${value}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px 4px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                  background: "var(--color-green-light)",
                  color: "var(--color-green-dark)",
                  borderRadius: 20,
                  animation: "chipIn 200ms ease-out",
                }}
              >
                {getLabel(groupId, value)}
                <button
                  onClick={() => removeFilter(groupId, value)}
                  style={{
                    width: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "50%",
                    color: "var(--color-green-dark)",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-green)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.color = "var(--color-green-dark)";
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>
      )}

      {/* Filter groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {groups.map((group) => {
          const isExpanded = expandedGroup === group.id;
          const groupSelected = selected[group.id] || [];

          return (
            <div key={group.id}>
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: isExpanded ? "var(--color-border-soft)" : "transparent",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.background = "var(--color-border-soft)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-ink)",
                  }}
                >
                  {group.label}
                  {groupSelected.length > 0 && (
                    <span style={{ color: "var(--color-ink-3)", fontWeight: 400 }}>
                      {" "}
                      ({groupSelected.length})
                    </span>
                  )}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: "var(--color-ink-3)",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 200ms ease",
                  }}
                />
              </button>

              {isExpanded && (
                <div
                  style={{
                    padding: "8px 0 8px 12px",
                    animation: "filterGroupIn 200ms ease-out",
                  }}
                >
                  {group.options.map((option) => {
                    const isSelected = groupSelected.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          toggleOption(group.id, option.value, group.multiSelect ?? true)
                        }
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          background: "none",
                          border: "none",
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
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: group.multiSelect ? 4 : 9,
                            border: `2px solid ${
                              isSelected ? "var(--color-green)" : "var(--color-border)"
                            }`,
                            background: isSelected ? "var(--color-green)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 150ms ease",
                          }}
                        >
                          {isSelected && <Check size={12} style={{ color: "#fff" }} />}
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            color: isSelected ? "var(--color-ink)" : "var(--color-ink-2)",
                            fontWeight: isSelected ? 500 : 400,
                          }}
                        >
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Apply button */}
      {onApply && (
        <button
          onClick={onApply}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: loading ? "var(--color-ink-3)" : "var(--color-green)",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 150ms ease",
          }}
        >
          {loading ? "Applying..." : "Apply Filters"}
        </button>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes chipIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes filterGroupIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes chipIn { from, to { opacity: 1; transform: none; } }
          @keyframes filterGroupIn { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </div>
  );
}
