import { useMemo } from "react";

interface ConfettiProps {
  show: boolean;
  onDone?: () => void;
}

const COLORS = ["#6B21A8", "#F97316", "#A855F7", "#FB923C", "#EC4899", "#FBBF24"];

export default function Confetti({ show, onDone }: ConfettiProps) {
  const pieces = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 1.5,
      size: Math.random() * 8 + 4,
      rotate: Math.random() * 360,
    }));
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece absolute"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.size > 8 ? "50%" : "2px",
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      {setTimeout(() => onDone?.(), 3000) && null}
    </div>
  );
}
