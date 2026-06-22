import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { FlowerCard } from './FlowerCard';

const MAX_HAND_SIZE = 5;

export const PlayerHand: React.FC = () => {
  const { playerHand, phase } = useGameStore();

  const emptySlots = MAX_HAND_SIZE - playerHand.length;

  return (
    <div
      style={{
        width: '100%',
        padding: '16px',
        background: 'linear-gradient(180deg, rgba(252, 228, 236, 0.8) 0%, rgba(200, 230, 201, 0.8) 100%)',
        borderRadius: '16px',
        border: '2px solid var(--color-border-brown)',
        boxShadow: 'var(--shadow-medium)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--color-accent-brown)',
          }}
        >
          🎋 手中花草
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--color-border-brown)',
          }}
        >
          {playerHand.length} / {MAX_HAND_SIZE}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: '140px',
          padding: '20px 0',
        }}
      >
        <AnimatePresence mode="popLayout">
          {playerHand.map((flower, index) => (
            <motion.div
              key={flower.instanceId}
              initial={{ opacity: 0, y: -50, rotate: -10, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                rotate: (index - 2) * 5,
                scale: 1,
              }}
              exit={{ 
                opacity: 0, 
                y: 50, 
                scale: 0.5,
                transition: { duration: 0.3 },
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: index * 0.05,
              }}
              style={{
                position: 'relative',
              }}
            >
              <FlowerCard flower={flower} size="medium" />
            </motion.div>
          ))}
        </AnimatePresence>

        {[...Array(emptySlots)].map((_, i) => (
          <motion.div
            key={`empty-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '3px dashed var(--color-border-brown)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              color: 'var(--color-border-brown)',
              fontSize: '24px',
              background: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            +
          </motion.div>
        ))}
      </div>

      {playerHand.length === 0 && phase === 'collecting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            color: 'var(--color-border-brown)',
            fontSize: '14px',
            marginTop: '8px',
          }}
        >
          点击花园中的花草进行采集
        </motion.div>
      )}

      {playerHand.length >= MAX_HAND_SIZE && phase === 'collecting' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-rarity-exotic)',
            fontSize: '16px',
            fontWeight: 600,
            marginTop: '8px',
          }}
        >
          ✨ 手牌已满，可以发起挑战！
        </motion.div>
      )}
    </div>
  );
};

export default PlayerHand;
