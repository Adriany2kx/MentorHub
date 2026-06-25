import { useState, useRef } from "react";
import { Trophy, Target, Star, Users, MessageSquare, Calendar, ChevronLeft, ChevronRight, Lock } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: "trophy" | "target" | "star" | "users" | "message" | "calendar";
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number; // 0-100 for locked achievements
}

interface AchievementCarouselProps {
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
}

const ICONS = {
  trophy: Trophy,
  target: Target,
  star: Star,
  users: Users,
  message: MessageSquare,
  calendar: Calendar,
};

const COLORS = {
  trophy: { bg: "#fef3c7", icon: "#d97706", ring: "#f59e0b" },
  target: { bg: "#dcfce7", icon: "#16a34a", ring: "#22c55e" },
  star: { bg: "#fce7f3", icon: "#db2777", ring: "#ec4899" },
  users: { bg: "#dbeafe", icon: "#2563eb", ring: "#3b82f6" },
  message: { bg: "#e0e7ff", icon: "#4f46e5", ring: "#6366f1" },
  calendar: { bg: "#f3e8ff", icon: "#9333ea", ring: "#a855f7" },
};

function AchievementCard({
  achievement,
  onClick,
}: {
  achievement: Achievement;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = ICONS[achievement.icon];
  const colors = COLORS[achievement.icon];
  const progress = achievement.progress ?? 0;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        flex: "0 0 auto",
        width: 140,
        padding: 16,
        border: `1px solid ${achievement.unlocked ? colors.ring : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)",
        background: achievement.unlocked ? colors.bg : "var(--color-surface)",
        cursor: "pointer",
        textAlign: "center",
        transition: "all 200ms ease",
        transform: isHovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: isHovered
          ? "0 8px 24px rgba(0,0,0,0.1)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        opacity: achievement.unlocked ? 1 : 0.7,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Progress ring for locked achievements */}
      <div
        style={{
          position: "relative",
          width: 56,
          height: 56,
          margin: "0 auto 12px",
        }}
      >
        {!achievement.unlocked && progress > 0 && (
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              transform: "rotate(-90deg)",
            }}
          >
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="var(--color-border-soft)"
              strokeWidth="4"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke={colors.ring}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * 150.8} 150.8`}
              style={{ transition: "stroke-dasharray 500ms ease" }}
            />
          </svg>
        )}

        <div
          style={{
            position: "absolute",
            inset: achievement.unlocked ? 0 : 4,
            borderRadius: "50%",
            background: achievement.unlocked ? colors.bg : "var(--color-border-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: achievement.unlocked && isHovered ? "badgeBounce 400ms ease" : "none",
          }}
        >
          {achievement.unlocked ? (
            <Icon size={24} style={{ color: colors.icon }} />
          ) : (
            <Lock size={20} style={{ color: "var(--color-ink-3)" }} />
          )}
        </div>

        {/* Unlock glow effect */}
        {achievement.unlocked && (
          <div
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${colors.ring}40 0%, transparent 70%)`,
              animation: "badgeGlow 2s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: achievement.unlocked ? colors.icon : "var(--color-ink-2)",
          margin: "0 0 4px",
          lineHeight: 1.3,
        }}
      >
        {achievement.title}
      </p>

      <p
        style={{
          fontSize: 11,
          color: "var(--color-ink-3)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {achievement.unlocked
          ? achievement.unlockedAt
            ? `Unlocked ${new Date(achievement.unlockedAt).toLocaleDateString()}`
            : "Unlocked!"
          : achievement.description}
      </p>

      {/* Keyframes */}
      <style>{`
        @keyframes badgeBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        @keyframes badgeGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes badgeBounce { from, to { transform: scale(1); } }
          @keyframes badgeGlow { from, to { opacity: 0.7; } }
        }
      `}</style>
    </button>
  );
}

/**
 * AchievementCarousel — AllTrails-style achievements display
 *
 * Features:
 * - Horizontal swipeable carousel (mobile)
 * - Card snap-to-center behavior
 * - Badge unlock animation (scale + glow)
 * - Progress ring around locked badges
 */
export default function AchievementCarousel({
  achievements,
  onAchievementClick,
}: AchievementCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 160; // card width + gap
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--color-ink)",
              margin: 0,
            }}
          >
            Achievements
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-ink-3)",
              margin: "2px 0 0",
            }}
          >
            {unlockedCount} of {achievements.length} unlocked
          </p>
        </div>

        {/* Navigation arrows (desktop) */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-surface)",
              cursor: canScrollLeft ? "pointer" : "not-allowed",
              opacity: canScrollLeft ? 1 : 0.4,
              transition: "all 150ms ease",
            }}
          >
            <ChevronLeft size={16} style={{ color: "var(--color-ink-2)" }} />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-surface)",
              cursor: canScrollRight ? "pointer" : "not-allowed",
              opacity: canScrollRight ? 1 : 0.4,
              transition: "all 150ms ease",
            }}
          >
            <ChevronRight size={16} style={{ color: "var(--color-ink-2)" }} />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollPaddingLeft: 4,
          paddingBottom: 8,
          marginBottom: -8,
          // Hide scrollbar
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            style={{ scrollSnapAlign: "start" }}
          >
            <AchievementCard
              achievement={achievement}
              onClick={() => onAchievementClick?.(achievement)}
            />
          </div>
        ))}
      </div>

      {/* Hide webkit scrollbar */}
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
