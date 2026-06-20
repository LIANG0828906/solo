import React from 'react';
import { motion } from 'framer-motion';
import type { Flower, HandFlower } from '../types/game';
import { RARITY_LABEL, RARITY_COLOR } from '../types/game';
import { FlowerSVG } from './FlowerSVG';

interface FlowerCardProps {
  flower: Flower | HandFlower;
  size?: 'small' | 'medium' | 'large';
  showInfo?: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
  isBattling?: boolean;
}

export const FlowerCard: React.FC<FlowerCardProps> = ({
  flower,
  size = 'medium',
  showInfo = true,
  isWinner = false,
  isLoser = false,
  isBattling = false,
}) => {
  const sizeMap = {
    small: { card: 70, svg: 45, name: 10 },
    medium: { card: 100, svg: 65, name: 12 },
    large: { card: 140, svg: 90, name: 14 },
  };

  const { card: cardSize, svg: svgSize, name: nameSize } = sizeMap[size];

  return (
    <motion.div
      className={`fan-card rarity-glow-${flower.rarity}`}
      style={{
        width: cardSize,
        height: cardSize,
      }}
      animate={{
        scale: isWinner ? [1, 1.1, 1] : isLoser ? [1, 0.8] : 1,
        rotate: isLoser ? [0, -10] : 0,
        filter: isLoser ? ['saturate(1)', 'saturate(0) brightness(0.6)'] : 'none',
      }}
      transition={{
        duration: 1,
        ease: 'easeOut',
      }}
    >
      <motion.div
        animate={isWinner ? {
          filter: [
            'drop-shadow(0 0 10px currentColor)',
            'drop-shadow(0 0 30px currentColor)',
            'drop-shadow(0 0 10px currentColor)',
          ],
        } : {}}
        transition={{
          duration: 1,
          repeat: isWinner ? 1 : 0,
        }}
        style={{ color: flower.color }}
      >
        <FlowerSVG
          pattern={flower.pattern}
          color={flower.color}
          secondaryColor={flower.secondaryColor}
          size={svgSize}
        />
      </motion.div>

      {isWinner && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '50%', pointerEvents: 'none' }}>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="leaf-particle"
              style={{
                left: '50%',
                top: '50%',
                backgroundColor: i % 2 === 0 ? flower.color : flower.secondaryColor,
                borderRadius: '50%',
                '--tx': `${(Math.random() - 0.5) * 200}px`,
                '--ty': `${(Math.random() - 0.5) * 200}px`,
                '--rot': `${Math.random() * 720 - 360}deg`,
              } as React.CSSProperties}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
          ))}
        </div>
      )}

      {showInfo && (
        <div
          style={{
            position: 'absolute',
            bottom: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: nameSize,
              fontWeight: 600,
              color: 'var(--color-ink-black)',
            }}
          >
            {flower.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: nameSize - 2,
              color: RARITY_COLOR[flower.rarity],
              fontWeight: 500,
            }}
          >
            {RARITY_LABEL[flower.rarity]}
          </div>
        </div>
      )}

      {isBattling && !isWinner && !isLoser && (
        <motion.div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '3px solid var(--color-gold)',
            pointerEvents: 'none',
          }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(255, 179, 0, 0.4)',
              '0 0 0 15px rgba(255, 179, 0, 0)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
};

export default FlowerCard;
