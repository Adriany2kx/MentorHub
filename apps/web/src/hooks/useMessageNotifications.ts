import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { listConversations } from "../lib/api";

const POLL_INTERVAL = 30000; // 30 seconds

/**
 * Polls for new messages and shows toast notifications.
 * Skips notifications when user is on the /messages page.
 */
export function useMessageNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const prevUnreadRef = useRef<number | null>(null);
  const initialLoadRef = useRef(true);

  const checkMessages = useCallback(async () => {
    if (!user) return;

    try {
      const { conversations } = await listConversations();
      const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

      // Skip notification on initial load or when on messages page
      const isOnMessagesPage = location.pathname.startsWith("/messages");

      if (prevUnreadRef.current !== null && !initialLoadRef.current) {
        const newMessages = totalUnread - prevUnreadRef.current;

        if (newMessages > 0 && !isOnMessagesPage) {
          // Find who sent the new message(s)
          const convWithUnread = conversations.find((c) => c.unreadCount > 0);
          if (convWithUnread) {
            const sender = convWithUnread.participant1Id === user.id
              ? convWithUnread.participant2
              : convWithUnread.participant1;
            const name = [sender.firstName, sender.lastName].filter(Boolean).join(" ") || "Someone";

            toast(
              newMessages === 1
                ? `New message from ${name}`
                : `${newMessages} new messages`,
              "info"
            );
          }
        }
      }

      prevUnreadRef.current = totalUnread;
      initialLoadRef.current = false;
    } catch {
      // Silently fail - don't spam errors for background polling
    }
  }, [user, location.pathname, toast]);

  useEffect(() => {
    if (!user) return;

    // Initial check
    checkMessages();

    // Set up polling
    const interval = setInterval(checkMessages, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user, checkMessages]);

  // Reset when navigating to messages page (marks as read)
  useEffect(() => {
    if (location.pathname.startsWith("/messages")) {
      // Small delay to let the page mark messages as read
      setTimeout(() => {
        prevUnreadRef.current = 0;
      }, 1000);
    }
  }, [location.pathname]);
}
