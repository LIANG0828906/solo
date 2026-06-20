import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface SaveButtonProps {
  onSave: () => void;
  disabled: boolean;
}

export function SaveButton({ onSave, disabled }: SaveButtonProps) {
  const handleClick = () => {
    if (disabled) return;

    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#1a5276', '#a93226', '#f4d03f', '#f5f0e0', '#c1a87a'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
    onSave();
  };

  return (
    <motion.button
      className="paper-btn text-xl px-8 py-3"
      onClick={handleClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      🎨 保存图样
    </motion.button>
  );
}
