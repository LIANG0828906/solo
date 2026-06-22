import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Enemy } from '@/types';
import styles from './Enemy.module.css';

interface EnemyProps {
  enemy: Enemy;
  isAttacking: boolean;
  isHurt: boolean;
}

const slimeFrames = [
  [
    0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0,
    0, 0, 1, 2, 2, 3, 3, 2, 2, 3, 3, 1, 0, 0, 0, 0,
    0, 1, 2, 2, 3, 4, 4, 3, 3, 4, 4, 2, 1, 0, 0, 0,
    0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0, 0,
    1, 2, 2, 3, 4, 4, 4, 4, 4, 4, 4, 3, 2, 2, 1, 0,
    1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0,
    1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0,
    1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0,
    1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0,
    0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0, 0,
    0, 1, 2, 2, 3, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0, 0,
    0, 0, 1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0,
    0, 0, 1, 2, 2, 3, 3, 2, 2, 3, 3, 1, 0, 0, 0, 0,
    0, 1, 2, 2, 3, 4, 4, 3, 3, 4, 4, 2, 1, 0, 0, 0,
    0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0, 0,
    1, 2, 2, 3, 4, 4, 4, 4, 4, 4, 4, 3, 2, 2, 1, 0,
    1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0,
    1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0,
    0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0, 0,
    0, 1, 2, 2, 3, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0, 0,
    0, 0, 1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
];

function getShades(color: string): string[] {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [
    'transparent',
    `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`,
    `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`,
    color,
    `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`,
  ];
}

const Enemy = React.memo(function Enemy({ enemy, isAttacking, isHurt }: EnemyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % slimeFrames.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const shades = getShades(enemy.color);
    const frame = slimeFrames[currentFrame];

    ctx.clearRect(0, 0, 16, 16);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const pixelIndex = y * 16 + x;
        const colorIndex = frame[pixelIndex];
        if (colorIndex > 0) {
          ctx.fillStyle = shades[colorIndex];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [currentFrame, enemy.color]);

  const containerClasses = [
    styles.enemyContainer,
    isHurt ? styles.hurtFlash : '',
    isAttacking ? styles.attacking : '',
  ].filter(Boolean).join(' ');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={containerClasses}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.enemySprite}>
          <canvas
            ref={canvasRef}
            width={16}
            height={16}
            className={styles.pixelCanvas}
            style={{
              width: '64px',
              height: '64px',
              imageRendering: 'pixelated',
            }}
          />
        </div>
        <div className={styles.hpBar}>
          <motion.div
            className={styles.hpFill}
            initial={false}
            animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default Enemy;
