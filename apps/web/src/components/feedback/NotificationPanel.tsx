import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  X,
  Calendar,
  MessageSquare,
  Target,
  CreditCard,
  Star,
  AlertCircle,
  Check,
  ChevronRight,
} from "lucide-react";

export type NotificationType =
  | "booking"
  | "message"
  | "goal"
  | "payment"
  | "review"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
}

const typeIcons: Record<NotificationType, React.ElementType> = {
  booking: Calendar,
  message: MessageSquare,
  goal: Target,
  payment: CreditCard,
  review: Star,
  system: AlertCircle,
};

const typeColors: Record<NotificationType, string> = {
  booking: "var(--color-green)",
  message: "var(--color-blue)",
  goal: "var(--color-warning)",
  payment: "var(--color-success)",
  review: "var(--color-gold)",
  system: "var(--color-ink-3)",
};

/**
 * NotificationPanel — Slide-down notification panel
 *
 * Features:
 * - Grouped by type (bookings, messages, system)
 * - Mark all as read
 * - Click to navigate + dismiss
 * - Badge count on bell icon
 * - Slide animation
 */
export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function formatTime(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        style={{
          position: "relative",
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isOpen ? "var(--color-border-soft)" : "transparent",
          border: "none",
          borderRadius: "var(--radius-full)",
          cursor: "pointer",
          color: "var(--color-ink-2)",
          transition: "all 150ms ease",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = "var(--color-border-soft)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = "transparent";
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--color-error)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "notifBadgePop 300ms ease-out",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxHeight: 480,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-dropdown)",
            overflow: "hidden",
            animation: "notifPanelIn 200ms ease-out",
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)", margin: 0 }}>
              Notifications
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--color-green)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-green-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  color: "var(--color-ink-3)",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "var(--color-ink-3)",
                }}
              >
                <Bell size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif, index) => {
                const Icon = typeIcons[notif.type];
                const content = (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) onMarkAsRead(notif.id);
                      if (notif.link) setIsOpen(false);
                    }}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px 16px",
                      background: notif.read ? "transparent" : "var(--color-green-light)",
                      borderBottom:
                        index < notifications.length - 1
                          ? "1px solid var(--color-border-soft)"
                          : "none",
                      cursor: notif.link ? "pointer" : "default",
                      transition: "background 150ms ease",
                      animation: `notifItemIn 200ms ease-out ${index * 30}ms both`,
                    }}
                    onMouseEnter={(e) => {
                      if (notif.read) {
                        e.currentTarget.style.background = "var(--color-border-soft)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.read
                        ? "transparent"
                        : "var(--color-green-light)";
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "var(--radius-sm)",
                        background: `color-mix(in oklab, ${typeColors[notif.type]} 15%, var(--color-surface))`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} style={{ color: typeColors[notif.type] }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: notif.read ? 400 : 600,
                          color: "var(--color-ink)",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {notif.title}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--color-ink-3)",
                          margin: "2px 0 0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {notif.message}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--color-muted)",
                          margin: "4px 0 0",
                        }}
                      >
                        {formatTime(notif.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notif.id);
                          }}
                          title="Mark as read"
                          style={{
                            width: 24,
                            height: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "none",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            cursor: "pointer",
                            color: "var(--color-ink-3)",
                          }}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {notif.link && <ChevronRight size={14} style={{ color: "var(--color-ink-3)" }} />}
                    </div>
                  </div>
                );

                return notif.link ? (
                  <Link key={notif.id} to={notif.link} style={{ textDecoration: "none" }}>
                    {content}
                  </Link>
                ) : (
                  content
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--color-border)",
                textAlign: "center",
              }}
            >
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--color-green)",
                  textDecoration: "none",
                }}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes notifPanelIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes notifItemIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes notifBadgePop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes notifPanelIn { from, to { opacity: 1; transform: none; } }
          @keyframes notifItemIn { from, to { opacity: 1; transform: none; } }
          @keyframes notifBadgePop { from, to { transform: scale(1); } }
        }
      `}</style>
    </div>
  );
}
