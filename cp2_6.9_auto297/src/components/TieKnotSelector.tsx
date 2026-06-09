import { motion } from 'framer-motion';
import { TieKnotType, TIE_KNOT_INFO } from '../utils/types';

interface TieKnotSelectorProps {
  selectedKnot: TieKnotType | null;
  onSelect: (knot: TieKnotType) => void;
  disabled: boolean;
  isAnimating: boolean;
}

const KNOT_ICONS: Record<TieKnotType, string> = {
  bundle: '🪢',
  stitch: '🧵',
  fold: '📜',
};

export function TieKnotSelector({ selectedKnot, onSelect, disabled, isAnimating }: TieKnotSelectorProps) {
  const knots: TieKnotType[] = ['bundle', 'stitch', 'fold'];

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xl text-[#3e2723]">扎结方式</h3>
      <div className="flex gap-6">
        {knots.map((knot) => (
          <motion.div
            key={knot}
            className={`knot-card ${selectedKnot === knot ? 'active' : ''}`}
            onClick={() => !disabled && onSelect(knot)}
            whileHover={!disabled ? { y: -6 } : {}}
            animate={isAnimating && selectedKnot === knot ? getAnimation(knot) : {}}
          >
            <span className="knot-icon">{KNOT_ICONS[knot]}</span>
            <span className="knot-name">{TIE_KNOT_INFO[knot].name}</span>
            <span className="text-xs opacity-70">{TIE_KNOT_INFO[knot].pattern}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function getAnimation(knot: TieKnotType) {
  switch (knot) {
    case 'bundle':
      return {
        rotate: [0, 540],
        transition: { duration: 1.5, ease: 'easeOut' },
      };
    case 'stitch':
      return {
        x: [0, 20, 40, 20, 0, 20, 40, 20, 0],
        y: [0, -10, 0, 10, 0, -10, 0, 10, 0],
        transition: { duration: 1.6, ease: 'easeInOut' },
      };
    case 'fold':
      return {
        scaleX: [1, 0.5, 1],
        rotateY: [0, 90, 0],
        transition: { duration: 0.8, ease: 'easeInOut' },
      };
    default:
      return {};
  }
}
