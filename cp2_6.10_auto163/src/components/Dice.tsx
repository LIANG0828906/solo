import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DiceValue } from '../types/game';
import { getDiceDots } from '../utils/gameLogic';
import './Dice.css';

interface DiceProps {
  value: DiceValue;
  isRevealing: boolean;
  delay: number;
}

const Dice = memo(function Dice({ value, isRevealing, delay }: DiceProps) {
  const dots = getDiceDots(value);

  return (
    <motion.div
      className="dice"
      initial={{ scale: 0, rotate: -180, y: -100, opacity: 0 }}
      animate={
        isRevealing
          ? {
              scale: 1,
              rotate: 0,
              y: 0,
              opacity: 1,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 15,
                delay,
                duration: 0.5,
              },
            }
          : { scale: 0, opacity: 0 }
      }
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
      }}
    >
      <div className="dice-face">
        {dots.map(([row, col], index) => (
          <motion.div
            key={index}
            className="dice-dot"
            initial={{ scale: 0 }}
            animate={isRevealing ? { scale: 1 } : { scale: 0 }}
            transition={{ delay: delay + 0.3 + index * 0.05, duration: 0.2 }}
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
            }}
          />
        ))}
      </div>
      {isRevealing && (
        <motion.div
          className="dice-glow"
          initial={{ opacity: 0, scale: 1 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [1, 1.5, 1.5, 1],
          }}
          transition={{
            delay: delay + 0.4,
            duration: 1,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
});

export default Dice;
