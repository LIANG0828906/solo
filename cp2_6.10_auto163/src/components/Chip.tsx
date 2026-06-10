import { memo } from 'react';
import { motion } from 'framer-motion';
import './Chip.css';

interface ChipProps {
  amount: number;
  isFlying?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const Chip = memo(function Chip({ amount, isFlying, onClick, disabled }: ChipProps) {
  const getChipColor = (value: number) => {
    if (value >= 100) return { main: '#ffd700', dark: '#b8860b', light: '#fff176' };
    if (value >= 50) return { main: '#e53935', dark: '#b71c1c', light: '#ef9a9a' };
    if (value >= 20) return { main: '#1e88e5', dark: '#0d47a1', light: '#90caf9' };
    if (value >= 10) return { main: '#43a047', dark: '#1b5e20', light: '#a5d6a7' };
    return { main: '#8e24aa', dark: '#4a148c', light: '#ce93d8' };
  };

  const colors = getChipColor(amount);

  return (
    <motion.button
      className={`chip ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        '--chip-main': colors.main,
        '--chip-dark': colors.dark,
        '--chip-light': colors.light,
      } as React.CSSProperties}
      whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      animate={
        isFlying
          ? {
              y: [0, -30, -10],
              opacity: [1, 0.8, 1],
              transition: { duration: 0.4, ease: 'easeOut' },
            }
          : {}
      }
      initial={isFlying ? { scale: 0 } : {}}
      style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
    >
      <div className="chip-inner">
        <div className="chip-ring" />
        <span className="chip-value">{amount}</span>
      </div>
      {!disabled && (
        <motion.div
          className="chip-shine"
          initial={{ opacity: 0 }}
          whileHover={{
            opacity: [0, 0.5, 0],
            x: ['-100%', '100%'],
            transition: { duration: 0.6, ease: 'easeInOut' },
          }}
        />
      )}
    </motion.button>
  );
});

export default Chip;
