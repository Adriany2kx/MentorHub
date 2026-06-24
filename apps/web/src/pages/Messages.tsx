import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MessageSquare, ChevronLeft, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listConversations,
  getMessages,
  sendMessage,
  getMentorReviews,
} from "../lib/api";
import type { Conversation, ChatMessage } from "../lib/api";
import ConversationList from "../components/ConversationList";
import MessageBubble from "../components/MessageBubble";
import StarRating from "../components/StarRating";
import SearchBar from "../components/SearchBar";
import ReportModal from "../components/ReportModal";

export default function Messages() {
  const { id: activeId } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [otherRating, setOtherRating] = useState<number | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    listConversations()
      .then((d) => setConversations(d.conversations))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setLoadingMsgs(true);
    getMessages(activeId)
      .then((d) => {
        // API returns oldest-first (asc order)
        setMessages(d.messages);
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));

    // Update unread count locally
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Load active contact's mentor rating (for right panel)
  const activeConv = conversations.find((c) => c.id === activeId);
  const other = activeConv
    ? activeConv.participant1Id === user?.id
      ? activeConv.participant2
      : activeConv.participant1
    : null;

  const otherId = other?.id;
  useEffect(() => {
    if (!otherId) { setOtherRating(null); return; }
    getMentorReviews(otherId)
      .then((d) => setOtherRating(d.averageRating))
      .catch(() => setOtherRating(null));
  }, [otherId]);

  const otherName = other
    ? [other.firstName, other.lastName].filter(Boolean).join(" ") || "User"
    : "";

  const filteredConvs = conversations.filter((c) => {
    const p = c.participant1Id === user?.id ? c.participant2 : c.participant1;
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await sendMessage(activeId, content);
      setMessages((prev) => [...prev, res.message]);
      // Update conversation last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                lastMessageAt: res.message.createdAt,
                messages: [
                  { id: res.message.id, content: res.message.content, senderId: res.message.senderId, isRead: false, createdAt: res.message.createdAt },
                ],
              }
            : c
        )
      );
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-57px)] flex overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* Left panel — conversation list */}
      <aside
        className={`flex flex-col w-full sm:w-72 shrink-0 border-r ${activeId ? "hidden sm:flex" : "flex"}`}
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h1 className="wf-h3 mb-3">Messages</h1>
          <SearchBar
            placeholder="Search conversations..."
            onSearch={setSearch}
            initialValue={search}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="wf-avatar wf-avatar-sm shrink-0" style={{ background: "var(--color-bg)" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-1/2 border" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }} />
                    <div className="h-2 w-3/4 border" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ConversationList
              conversations={filteredConvs}
              currentUserId={user.id}
              activeId={activeId}
            />
          )}
        </div>
      </aside>

      {/* Center panel — chat */}
      <main className={`flex flex-col flex-1 min-w-0 ${!activeId ? "hidden sm:flex" : "flex"}`}>
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <MessageSquare size={44} className="mx-auto mb-4" style={{ color: "var(--color-border)" }} />
              <p className="wf-text font-medium mb-1" style={{ color: "var(--color-ink)" }}>Choose a conversation</p>
              <p className="wf-text-sm" style={{ color: "var(--color-ink-3)" }}>Messages between you and your mentors or mentees appear here.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/messages")}
                  className="sm:hidden wf-btn wf-btn-secondary px-2 py-1"
                >
                  <ChevronLeft size={16} />
                </button>
                {other && (
                  <div className="wf-avatar wf-avatar-sm shrink-0">
                    {other.avatarUrl ? (
                      <img src={other.avatarUrl} alt={otherName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{otherName[0]?.toUpperCase()}</span>
                    )}
                  </div>
                )}
                <span className="wf-text font-semibold">{otherName}</span>
              </div>
              {other && (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="wf-btn wf-btn-secondary px-2 py-1"
                  title="Report user"
                >
                  <AlertCircle size={16} />
                </button>
              )}
            </div>

            {/* Messages area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <div className="wf-text" style={{ color: "var(--color-ink-3)" }}>Loading...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="wf-text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user.id} />
                ))
              )}
            </div>

            {/* Input bar */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 px-4 py-3 border-t shrink-0"
              style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 wf-input-box"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="wf-btn wf-btn-primary"
              >
                Send
              </button>
            </form>
          </>
        )}
      </main>

      {/* Right panel — contact info (desktop only) */}
      {activeId && other && (
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-l p-5" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
          <div className="flex flex-col items-center text-center mb-5">
            <div className="wf-avatar wf-avatar-lg mb-3">
              {other.avatarUrl ? (
                <img src={other.avatarUrl} alt={otherName} className="w-full h-full object-cover" />
              ) : (
                <span>{otherName[0]?.toUpperCase()}</span>
              )}
            </div>
            <p className="wf-text font-semibold">{otherName}</p>
            {otherRating !== null && (
              <div className="mt-2">
                <StarRating value={Math.round(otherRating)} readonly size="sm" />
                <p className="wf-text-xs mt-1">{otherRating.toFixed(1)} avg</p>
              </div>
            )}
          </div>

          <div className="wf-divider" />

          <div className="space-y-2 mt-4">
            <Link
              to={`/users/${other.id}`}
              className="wf-btn wf-btn-secondary w-full"
            >
              View Profile
            </Link>
            <Link
              to="/programs"
              className="wf-btn wf-btn-primary w-full"
            >
              Book Session
            </Link>
          </div>
        </aside>
      )}

      {/* Report modal */}
      {other && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportedId={other.id}
        />
      )}
    </div>
  );
}
