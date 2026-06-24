import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import type { Conversation } from "../lib/api";

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  activeId?: string;
}

export default function ConversationList({ conversations, currentUserId, activeId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <MessageSquare size={40} className="mx-auto mb-3" style={{ color: "var(--color-ink-3)" }} />
        <p className="wf-text font-medium mb-1" style={{ color: "var(--color-ink)" }}>No conversations yet</p>
        <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Book a program to start a conversation with your mentor.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-line">
      {conversations.map((conv) => {
        const other = conv.participant1Id === currentUserId ? conv.participant2 : conv.participant1;
        const otherName = [other.firstName, other.lastName].filter(Boolean).join(" ") || "User";
        const lastMsg = conv.messages[0];
        const isActive = conv.id === activeId;

        return (
          <Link
            key={conv.id}
            to={`/messages/${conv.id}`}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-paper-2 transition-colors no-underline ${isActive ? "bg-paper-2" : ""}`}
          >
            <div className="wf-avatar wf-avatar-sm">
              {other.avatarUrl ? (
                <img src={other.avatarUrl} alt={otherName} className="w-full h-full object-cover" />
              ) : (
                <span>{otherName[0]?.toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`wf-text truncate ${conv.unreadCount > 0 ? "font-semibold text-ink" : "text-ink-2"}`}>
                  {otherName}
                </p>
                <span className="wf-text-xs text-ink-3 shrink-0 ml-2">
                  {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={`wf-text-xs truncate ${conv.unreadCount > 0 ? "text-ink-2 font-medium" : "text-ink-3"}`}>
                  {lastMsg
                    ? `${lastMsg.senderId === currentUserId ? "You: " : ""}${lastMsg.content}`
                    : "No messages yet"}
                </p>
                {conv.unreadCount > 0 && (
                  <span className="ml-2 shrink-0 min-w-[18px] h-[18px] px-1 bg-ink text-paper wf-text-xs flex items-center justify-center">
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
