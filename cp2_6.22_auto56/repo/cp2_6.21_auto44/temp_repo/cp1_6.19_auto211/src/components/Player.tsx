import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { MOVE_DURATION } from '@/constants';

interface PlayerProps {
  cellSize: number;
}

export default function Player({ cellSize }: PlayerProps) {
  const player = useGameStore((state) => state.player);
  const movePlayer = useGameStore((state) => state.movePlayer);
  const isComplete = useGameStore((state) => state.isComplete);
  const isPlaying = useGameStore((state) => state.isPlaying);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isComplete || isPlaying) return;

      const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        W: 'up',
        s: 'down',
        S: 'down',
        a: 'left',
        A: 'left',
        d: 'right',
        D: 'right',
      };

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        movePlayer(direction);
      }
    },
    [movePlayer, isComplete, isPlaying]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const playerSize = 24;
  const offset = (cellSize - playerSize) / 2;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: playerSize,
        height: playerSize,
        backgroundColor: '#FFD700',
        boxShadow: '0 0 12px 2px rgba(255, 255, 255, 0.6), 0 0 20px 4px rgba(255, 215, 0, 0.4)',
        zIndex: 10,
        left: player.x * cellSize + offset,
        top: player.y * cellSize + offset,
      }}
      animate={{
        left: player.x * cellSize + offset,
        top: player.y * cellSize + offset,
      }}
      transition={{
        duration: MOVE_DURATION,
        ease: 'easeOut',
      }}
    />
  );
}
