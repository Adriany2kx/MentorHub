import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

const SIZE = { sm: 12, md: 20, lg: 28 };

export default function StarRating({ value, onChange, size = "md", readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [popped, setPopped] = useState(0);

  function handleClick(star: number) {
    if (readonly) return;
    onChange?.(star === value ? 0 : star);
    setPopped(star);
    setTimeout(() => setPopped(0), 280);
  }

  const display = hovered || value;

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          className={`${popped === star ? "star-pop" : ""} ${readonly ? "cursor-default" : "focus:outline-none cursor-pointer"}`}
          style={{ background: "none", border: "none", padding: 0, lineHeight: 0 }}
        >
          <Star
            size={SIZE[size]}
            className="transition-colors"
            fill={star <= display ? "currentColor" : "none"}
            style={{
              color: star <= display
                ? (readonly ? "var(--color-ink)" : "var(--color-blue)")
                : "var(--color-border)",
            }}
          />
        </button>
      ))}
    </div>
  );
}
