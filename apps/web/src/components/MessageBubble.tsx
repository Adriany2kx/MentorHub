import type { ChatMessage } from "../lib/api";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <div className="wf-avatar wf-avatar-xs mb-0.5">
          {message.sender.avatarUrl ? (
            <img src={message.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{(message.sender.firstName?.[0] ?? "?").toUpperCase()}</span>
          )}
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md ${isOwn ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        <div
          className={`px-3 py-2 wf-text whitespace-pre-wrap break-words ${
            isOwn
              ? "bg-ink text-paper"
              : "bg-paper border border-line text-ink"
          }`}
        >
          {message.content}
        </div>
        <span className="wf-text-xs text-ink-3">{time}</span>
      </div>
    </div>
  );
}
