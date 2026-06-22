import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { getSeedColor, generateParticleColors } from '@/utils/pixel';
import { randomInt } from '@/utils/random';
import type { SeedType } from '@/types';
import ToolBar from './ToolBar';
import styles from './Farm.module.css';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  type: SeedType;
  angle: number;
  distance: number;
}

const GRID_SIZE = 9;
const CELL_SIZE = 64;
const CELL_SIZE_MOBILE = 48;

const getCellSize = () => {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    return CELL_SIZE_MOBILE;
  }
  return CELL_SIZE;
};

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) + amount)));
  const g = Math.min(255, Math.max(0, (((num >> 8) & 0x00FF) + amount)));
  const b = Math.min(255, Math.max(0, ((num & 0x0000FF) + amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const CropSprite = ({
  state,
  seedType,
}: {
  state: string;
  seedType: SeedType | null;
}) => {
  if (!seedType || state === 'empty') return null;

  const color = getSeedColor(seedType);
  const darker = adjustColor(color, -30);
  const lighter = adjustColor(color, 30);

  if (state === 'sprout') {
    return (
      <motion.svg
        width="32"
        height="32"
        viewBox="0 0 16 16"
        className={styles.cropSprite}
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3, type: 'spring' }}
      >
        <rect x="7" y="10" width="2" height="4" fill={darker} />
        <rect x="5" y="8" width="2" height="3" fill={color} />
        <rect x="9" y="8" width="2" height="3" fill={color} />
        <rect x="7" y="6" width="2" height="2" fill={lighter} />
      </motion.svg>
    );
  }

  if (state === 'growing') {
    return (
      <motion.svg
        width="32"
        height="32"
        viewBox="0 0 16 16"
        className={styles.cropSprite}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <rect x="7" y="5" width="2" height="8" fill={darker} />
        <rect x="4" y="6" width="2" height="3" fill={color} />
        <rect x="10" y="6" width="2" height="3" fill={color} />
        <rect x="5" y="3" width="2" height="3" fill={lighter} />
        <rect x="9" y="3" width="2" height="3" fill={lighter} />
        <rect x="7" y="1" width="2" height="3" fill={color} />
      </motion.svg>
    );
  }

  if (state === 'mature') {
    return (
      <motion.svg
        width="32"
        height="32"
        viewBox="0 0 16 16"
        className={styles.cropSprite}
        animate={{
          scale: [1, 1.1, 1],
          transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <rect x="7" y="4" width="2" height="9" fill={darker} />
        <rect x="3" y="5" width="2" height="3" fill={color} />
        <rect x="11" y="5" width="2" height="3" fill={color} />
        <rect x="4" y="2" width="2" height="3" fill={lighter} />
        <rect x="10" y="2" width="2" height="3" fill={lighter} />
        <rect x="6" y="0" width="4" height="3" fill={color} />
        <rect x="5" y="1" width="2" height="2" fill={seedType === 'rare' ? '#FFD700' : lighter} />
        <rect x="9" y="1" width="2" height="2" fill={seedType === 'rare' ? '#FFD700' : lighter} />
        {seedType === 'magic' && (
          <>
            <rect x="7" y="0" width="2" height="2" fill="#FF69B4" />
            <rect x="2" y="6" width="1" height="1" fill="#FF69B4" />
            <rect x="13" y="6" width="1" height="1" fill="#FF69B4" />
          </>
        )}
      </motion.svg>
    );
  }

  return null;
};

export default function Farm() {
  const { farmGrid, coins, plantSeed, harvestCrop, updateCropGrowth, selectedSeedIndex } = useGameStore();
  const [particles, setParticles] = useState<Particle[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      updateCropGrowth();
    }, 100);
    return () => clearInterval(timer);
  }, [updateCropGrowth]);

  const spawnParticles = useCallback((x: number, y: number, seedType: SeedType) => {
    const cellSize = getCellSize();
    const colors = generateParticleColors(seedType);
    const newParticles: Particle[] = [];

    const gridRect = gridRef.current?.getBoundingClientRect();
    if (gridRect) {
      const centerX = gridRect.left + x * cellSize + cellSize / 2;
      const centerY = gridRect.top + y * cellSize + cellSize / 2;

      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const distance = randomInt(40, 80);
        newParticles.push({
          id: particleIdRef.current++,
          x: centerX,
          y: centerY,
          color: colors[i % colors.length],
          type: seedType,
          angle,
          distance,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
      }, 800);
    }
  }, []);

  const handleCellClick = (x: number, y: number) => {
    const cell = farmGrid[y][x];

    if (cell.state === 'empty') {
      plantSeed(x, y);
    } else if (cell.state === 'mature' && cell.seedType) {
      harvestCrop(x, y);
      spawnParticles(x, y, cell.seedType);
    }
  };

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = farmGrid[y][x];
        const isEmpty = cell.state === 'empty';
        const isMature = cell.state === 'mature';

        cells.push(
          <motion.div
            key={`${x}-${y}`}
            className={cn(styles.farmCell, isEmpty && styles.empty)}
            onClick={() => handleCellClick(x, y)}
            whileHover={{ scale: isMature ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            style={{ cursor: isEmpty && selectedSeedIndex !== null ? 'pointer' : 'default' }}
          >
            <div className={styles.crop}>
              <CropSprite state={cell.state} seedType={cell.seedType} />
            </div>
          </motion.div>
        );
      }
    }
    return cells;
  };

  const renderParticles = () => {
    return particles.map((particle) => {
      const isGolden = particle.type === 'rare';
      const isSpiral = particle.type === 'magic';

      if (isSpiral) {
        return (
          <motion.div
            key={particle.id}
            className={cn(styles.particle, styles.spiral)}
            initial={{
              left: particle.x,
              top: particle.y,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              left: particle.x + Math.cos(particle.angle) * particle.distance,
              top: particle.y + Math.sin(particle.angle) * particle.distance,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0],
              rotate: 720,
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
            style={{
              backgroundColor: particle.color,
              color: particle.color,
            }}
          />
        );
      }

      if (isGolden) {
        return (
          <motion.div
            key={particle.id}
            className={cn(styles.particle, styles.golden)}
            initial={{
              left: particle.x,
              top: particle.y,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              left: particle.x + Math.cos(particle.angle) * particle.distance,
              top: particle.y + Math.sin(particle.angle) * particle.distance - 30,
              scale: [0, 1.2, 0.5, 0],
              opacity: [1, 1, 0.5, 0],
            }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
            style={{
              color: particle.color,
            }}
          />
        );
      }

      return (
        <motion.div
          key={particle.id}
          className={styles.particle}
          initial={{
            left: particle.x,
            top: particle.y,
            scale: 0,
            opacity: 1,
          }}
          animate={{
            left: particle.x + Math.cos(particle.angle) * particle.distance,
            top: particle.y + Math.sin(particle.angle) * particle.distance,
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
          style={{
            backgroundColor: particle.color,
            color: particle.color,
          }}
        />
      );
    });
  };

  return (
    <div className={styles.farmContainer}>
      <div className={styles.coinDisplay}>💰 金币: {coins}</div>

      <ToolBar />

      <motion.div
        ref={gridRef}
        className={styles.farmGrid}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {renderGrid()}
      </motion.div>

      <div className={styles.particleContainer}>
        <AnimatePresence>{renderParticles()}</AnimatePresence>
      </div>
    </div>
  );
}
