import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Sticker, StickerType } from '@/types';

interface StickerItemProps {
  sticker: Sticker;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Sticker>) => void;
  onRemove: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const stickerPaths: Record<StickerType, JSX.Element> = {
  cloud: (
    <g>
      <path
        d="M25,35 C15,35 10,28 10,20 C10,12 18,8 25,12 C28,5 38,5 40,12 C48,10 55,18 52,26 C58,30 56,40 48,40 L25,40 Z"
        fill="#8B4513"
        opacity="0.8"
      />
      <path
        d="M27,32 C18,32 14,26 14,19 C14,12 21,9 27,12 C29,6 37,6 39,12 C45,10 51,17 49,24 C54,27 52,35 45,35 L27,35 Z"
        fill="#D2691E"
      />
    </g>
  ),
  crane: (
    <g>
      <ellipse cx="30" cy="35" rx="18" ry="12" fill="#2F4F4F" />
      <circle cx="42" cy="28" r="8" fill="#2F4F4F" />
      <path d="M48,26 L58,22 L50,30 Z" fill="#FF6347" />
      <circle cx="45" cy="26" r="2" fill="#FFD700" />
      <path d="M12,35 Q0,25 5,40 Q10,45 18,38 Z" fill="#1C1C1C" />
      <path d="M30,47 L28,58 L32,58 Z" fill="#2F4F4F" />
      <path d="M34,47 L36,58 L32,58 Z" fill="#2F4F4F" />
      <path d="M20,32 Q30,20 40,28" stroke="#FFD700" strokeWidth="1" fill="none" />
    </g>
  ),
  peony: (
    <g>
      <circle cx="30" cy="30" r="22" fill="#FFB6C1" opacity="0.6" />
      <ellipse cx="30" cy="18" rx="10" ry="8" fill="#FF69B4" />
      <ellipse cx="18" cy="26" rx="10" ry="8" fill="#FF69B4" transform="rotate(-45 18 26)" />
      <ellipse cx="42" cy="26" rx="10" ry="8" fill="#FF69B4" transform="rotate(45 42 26)" />
      <ellipse cx="22" cy="40" rx="10" ry="8" fill="#FF69B4" transform="rotate(-135 22 40)" />
      <ellipse cx="38" cy="40" rx="10" ry="8" fill="#FF69B4" transform="rotate(135 38 40)" />
      <circle cx="30" cy="30" r="10" fill="#FF1493" />
      <circle cx="30" cy="30" r="5" fill="#FFD700" />
      <path d="M30,27 L30,33 M27,30 L33,30" stroke="#FFA500" strokeWidth="1.5" />
    </g>
  ),
  wave: (
    <g>
      <path
        d="M5,30 Q15,20 25,30 Q35,40 45,30 Q55,20 55,30"
        stroke="#4682B4"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M5,40 Q15,30 25,40 Q35,50 45,40 Q55,30 55,40"
        stroke="#5F9EA0"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M5,20 Q15,10 25,20 Q35,30 45,20 Q55,10 55,20"
        stroke="#87CEEB"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="30" cy="30" r="3" fill="#FFD700" opacity="0.5" />
      <circle cx="15" cy="25" r="2" fill="#FFD700" opacity="0.5" />
      <circle cx="45" cy="35" r="2" fill="#FFD700" opacity="0.5" />
    </g>
  ),
  meander: (
    <g>
      <rect x="8" y="8" width="44" height="44" fill="none" stroke="#8B0000" strokeWidth="3" />
      <path
        d="M15,15 L15,25 L25,25 L25,15 L35,15 L35,25 L45,25 L45,15"
        stroke="#8B0000"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M15,25 L15,35 L25,35 L25,45 L35,45 L35,35 L45,35 L45,45"
        stroke="#8B0000"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M25,25 L25,35 M35,25 L35,35"
        stroke="#DAA520"
        strokeWidth="1.5"
        fill="none"
      />
      <rect x="20" y="28" width="20" height="4" fill="#DAA520" opacity="0.6" />
    </g>
  ),
  lotus: (
    <g>
      <ellipse cx="30" cy="50" rx="25" ry="8" fill="#228B22" opacity="0.7" />
      <ellipse cx="30" cy="32" rx="6" ry="8" fill="#FFC0CB" />
      <ellipse cx="22" cy="36" rx="6" ry="8" fill="#FFB6C1" transform="rotate(-30 22 36)" />
      <ellipse cx="38" cy="36" rx="6" ry="8" fill="#FFB6C1" transform="rotate(30 38 36)" />
      <ellipse cx="18" cy="42" rx="5" ry="7" fill="#FFC0CB" transform="rotate(-50 18 42)" />
      <ellipse cx="42" cy="42" rx="5" ry="7" fill="#FFC0CB" transform="rotate(50 42 42)" />
      <ellipse cx="30" cy="28" rx="4" ry="6" fill="#FFF0F5" />
      <circle cx="30" cy="35" r="4" fill="#FFD700" />
      <circle cx="30" cy="35" r="2" fill="#FFA500" />
      <path d="M30,20 L30,10" stroke="#228B22" strokeWidth="2" />
      <ellipse cx="30" cy="8" rx="4" ry="2" fill="#228B22" />
    </g>
  ),
};

export default function StickerItem({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  containerRef,
}: StickerItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onUpdate({ rotation: (sticker.rotation + 45) % 360 });
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onRemove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, sticker.rotation, onUpdate, onRemove]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!isSelected) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(2.0, sticker.scale + delta));
    onUpdate({ scale: Number(newScale.toFixed(2)) });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);

    const rect = itemRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      };
    }
  };

  useEffect(() => {
    if (!isDragging || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const x = e.clientX - containerRect.left - dragOffset.current.x - 30;
      const y = e.clientY - containerRect.top - dragOffset.current.y - 30;

      const boundedX = Math.max(0, Math.min(containerRect.width - 60, x));
      const boundedY = Math.max(0, Math.min(containerRect.height - 60, y));

      onUpdate({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, containerRef, onUpdate]);

  return (
    <motion.div
      ref={itemRef}
      className="absolute cursor-grab active:cursor-grabbing select-none"
      style={{
        left: sticker.x,
        top: sticker.y,
        width: 60,
        height: 60,
        transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
        transformOrigin: 'center center',
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      whileHover={{ scale: sticker.scale * 1.05 }}
      animate={{
        boxShadow: isSelected
          ? '0 0 0 3px #FFD700, 0 4px 12px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
      transition={{ duration: 0.15 }}
    >
      <div
        className="w-full h-full rounded-lg bg-white/20 backdrop-blur-sm overflow-hidden"
        style={{
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-lg">
          {stickerPaths[sticker.type]}
        </svg>
      </div>
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
          ✓
        </div>
      )}
    </motion.div>
  );
}

export { stickerPaths };
