import { motion } from 'framer-motion';

interface ColorBadgeProps {
  color: string;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
}

export function ColorBadge({
  color,
  size = 24,
  selected = false,
  onClick,
}: ColorBadgeProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: onClick ? 1.1 : 1 }}
      whileTap={{ scale: onClick ? 0.95 : 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        border: selected ? `3px solid #ffd700` : `2px solid rgba(255,255,255,0.3)`,
        boxShadow: selected
          ? `0 0 12px ${color}, 0 0 24px rgba(255, 215, 0, 0.5)`
          : `0 2px 4px rgba(0,0,0,0.3)`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
    />
  );
}
