import { motion } from 'framer-motion';
import { ClothPiece } from '../types';
import { useGameStore } from '../store/gameStore';
import { BookOpen } from 'lucide-react';

interface ClothCardProps {
  piece: ClothPiece;
  isSelected?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  showStory?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function ClothCard({
  piece,
  isSelected,
  onClick,
  onDragStart,
  showStory = false,
  size = 'medium'
}: ClothCardProps) {
  const { feedback } = useGameStore((state) => ({
    feedback: state.feedback
  }));

  const isError = feedback.type === 'error' && feedback.clothId === piece.id;
  const isSuccess = feedback.type === 'success' && feedback.clothId === piece.id;

  const sizeClasses = {
    small: 'w-20 h-28',
    medium: 'w-full h-36',
    large: 'w-48 h-64'
  };

  const textSizes = {
    small: 'text-[10px]',
    medium: 'text-xs',
    large: 'text-sm'
  };

  return (
    <motion.div
      className={`
        relative ${sizeClasses[size]} rounded-lg cursor-pointer
        border-2 transition-all duration-300
        ${isSelected ? 'border-[#f5e6b8] glow-gold scale-105' : 'border-[#b87333] hover:border-[#f5e6b8]'}
        ${isError ? 'shake glow-error border-red-500' : ''}
        ${isSuccess ? 'glow-success' : ''}
      `}
      style={{
        background: `linear-gradient(145deg, ${piece.color}dd 0%, ${piece.color}88 100%)`,
        backdropFilter: 'blur(10px)'
      }}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isError ? 0.5 : 1, 
        y: 0,
        filter: isError ? 'grayscale(0.7)' : 'grayscale(0)'
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 opacity-30 overflow-hidden rounded-lg">
        <svg width="100%" height="100%">
          <pattern id={`pattern-${piece.id}`} patternUnits="userSpaceOnUse" width="20" height="20">
            {piece.pattern === '条纹' && (
              <>
                <line x1="0" y1="0" x2="0" y2="20" stroke="#fff" strokeWidth="1" opacity="0.3" />
                <line x1="10" y1="0" x2="10" y2="20" stroke="#fff" strokeWidth="1" opacity="0.3" />
              </>
            )}
            {piece.pattern === '波点' && (
              <circle cx="10" cy="10" r="3" fill="#fff" opacity="0.3" />
            )}
            {piece.pattern === '几何' && (
              <polygon points="10,2 18,18 2,18" fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
            )}
            {piece.pattern === '花纹' && (
              <path d="M10 2 Q18 10, 10 18 Q2 10, 10 2" fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
            )}
          </pattern>
          <rect width="100%" height="100%" fill={`url(#pattern-${piece.id})`} />
        </svg>
      </div>

      <div className="relative z-10 h-full p-2 flex flex-col justify-between">
        <div className={`${textSizes[size]} font-bold text-white truncate`}>
          {piece.title}
        </div>

        {size !== 'small' && (
          <div className={`${textSizes[size]} text-white/80`}>
            <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px]">
              {piece.eraLabel}
            </span>
          </div>
        )}

        {(showStory || isSelected) && size === 'large' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 bg-black/80 rounded-lg p-4 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} className="text-[#f5e6b8]" />
              <span className="font-bold text-[#f5e6b8]">{piece.title}</span>
            </div>
            <p className="text-xs text-white/90 leading-relaxed flex-1 overflow-auto scrollbar-thin">
              {piece.story}
            </p>
            <div className="mt-2 text-[10px] text-[#b87333] flex justify-between">
              <span>时代: {piece.eraLabel}</span>
              <span>图案: {piece.pattern}</span>
            </div>
          </motion.div>
        )}

        {onDragStart && (
          <div className="absolute top-1 right-1 w-4 h-4 border border-white/50 rounded flex items-center justify-center">
            <div className="w-2 h-2 bg-white/50 rounded-full" />
          </div>
        )}
      </div>

      <div className="absolute inset-0 border border-white/20 rounded-lg pointer-events-none" />
    </motion.div>
  );
}
