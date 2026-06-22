import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Flower } from '../types/game';
import { RARITY_LABEL, RARITY_COLOR } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { FlowerSVG } from './FlowerSVG';

interface PositionedFlower {
  flower: Flower;
  position: { x: number; y: number };
  rotation: number;
}

export const Garden: React.FC = () => {
  const { gardenFlowers, collectFlower, collectingFlowerId, phase } = useGameStore();
  const [positionedFlowers, setPositionedFlowers] = useState<PositionedFlower[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const generatePositions = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    setContainerSize({ width, height });

    const positions: PositionedFlower[] = [];
    const existingPositions: Array<{ x: number; y: number }> = [];
    const minDistance = 70;

    gardenFlowers.forEach((flower) => {
      const size = flower.rarity === 'exotic' ? 80 : flower.rarity === 'rare' ? 70 : 60;
      
      let attempts = 0;
      let x = 0, y = 0;
      
      while (attempts < 50) {
        x = Math.random() * (width - size - 20) + 10;
        y = Math.random() * (height - size - 20) + 10;
        
        const hasCollision = existingPositions.some(pos => {
          const dx = pos.x - x;
          const dy = pos.y - y;
          return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });
        
        if (!hasCollision) break;
        attempts++;
      }

      const rotation = (Math.random() - 0.5) * 25;

      positions.push({
        flower,
        position: { x, y },
        rotation,
      });
      existingPositions.push({ x, y });
    });

    setPositionedFlowers(positions);
  }, [gardenFlowers]);

  useEffect(() => {
    generatePositions();
    
    const handleResize = () => {
      generatePositions();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [generatePositions]);

  const handleCollect = (flower: Flower) => {
    if (phase !== 'collecting') return;
    collectFlower(flower.id);
  };

  const getFlowerSize = (flower: Flower) => {
    return flower.rarity === 'exotic' ? 70 : flower.rarity === 'rare' ? 60 : 50;
  };

  return (
    <div
      ref={containerRef}
      className="silk-texture"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '3px solid var(--color-border-brown)',
        boxShadow: 'var(--shadow-medium)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(circle at 10% 20%, rgba(200, 230, 201, 0.3) 0%, transparent 40%,
            radial-gradient(circle at 90% 80%, rgba(252, 228, 236, 0.3) 0%, transparent 40%
          `,
        }}
      />

      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          pointerEvents: 'none',
        }}
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        <path
          d="M0 20 Q25 10, 50 15 T100 12 L100 20 Z"
          fill="rgba(102, 187, 106, 0.2)"
        />
        <path
          d="M0 20 Q30 15, 60 18 T100 14 L100 20 Z"
          fill="rgba(76, 175, 80, 0.15)"
        />
      </svg>

      <AnimatePresence>
        {positionedFlowers.map(({ flower, position, rotation }) => {
          const size = getFlowerSize(flower);
          const isCollecting = collectingFlowerId === flower.id;

          return (
            <motion.div
              key={flower.id}
              className="flower-item"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: isCollecting ? 1.3 : 1,
                rotate: isCollecting ? 360 : rotation,
                x: position.x,
                y: position.y,
              }}
              exit={{
                opacity: 0,
                scale: 0,
                y: 100,
                transition: { duration: 0.4 },
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                rotate: { duration: isCollecting ? 0.4 : 0.5 },
              }}
              style={{
                position: 'absolute',
                cursor: phase === 'collecting' ? 'pointer' : 'default',
                zIndex: flower.rarity === 'exotic' ? 3 : flower.rarity === 'rare' ? 2 : 1,
              }}
              onClick={() => handleCollect(flower)}
              whileHover={phase === 'collecting' ? {
                scale: 1.15,
                transition: { duration: 0.2 },
              } : {}}
            >
              <motion.div
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div
                  style={{
                    filter: isCollecting
                      ? 'drop-shadow(0 0 20px rgba(255, 179, 0, 0.8))'
                      : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                    transition: 'filter 0.3s ease',
                  }}
                >
                  <FlowerSVG
                    pattern={flower.pattern}
                    color={flower.color}
                    secondaryColor={flower.secondaryColor}
                    size={size}
                  />
                </div>
              </motion.div>

              {isCollecting && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 2 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 224, 130, 0.6) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
              )}

              <div className="flower-tooltip">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {flower.name}
                </div>
                <div style={{ color: RARITY_COLOR[flower.rarity] }}>
                  {RARITY_LABEL[flower.rarity]}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {gardenFlowers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            color: 'var(--color-border-brown)',
          }}
        >
          花园中暂无花草，请等待下一轮...
        </motion.div>
      )}

      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          color: 'var(--color-accent-brown)',
          background: 'rgba(255, 255, 255, 0.7)',
          padding: '8px 16px',
          borderRadius: '20px',
          backdropFilter: 'blur(4px)',
        }}
      >
        🌸 剩余花草：{gardenFlowers.length} 株
      </div>
    </div>
  );
};

export default Garden;
