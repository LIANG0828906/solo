import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { FlowerCard } from './FlowerCard';

export const BattleArena: React.FC = () => {
  const { currentBattle, phase } = useGameStore();

  if (phase !== 'battling' || !currentBattle) return null;

  const { playerFlower, aiFlower, result } = currentBattle;

  const isPlayerWinner = result === 'player';
  const isAIWinner = result === 'ai';
  const isDraw = result === 'draw';
  const hasResult = result !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(93, 64, 55, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        style={{
          background: 'linear-gradient(180deg, #fce4ec 0%, #c8e6c9 100%)',
          borderRadius: '24px',
          padding: '48px 64px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-strong)',
          border: '3px solid var(--color-border-brown)',
          maxWidth: '700px',
          width: '90%',
        }}
        className="silk-texture"
      >
        <motion.div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--color-accent-brown)',
            marginBottom: '32px',
          }}
          animate={!hasResult ? {
            textShadow: [
              '0 0 0 rgba(255, 179, 0, 0)',
              '0 0 20px rgba(255, 179, 0, 0.5)',
              '0 0 0 rgba(255, 179, 0, 0)',
            ],
          } : {}}
          transition={{ duration: 1, repeat: !hasResult ? Infinity : 0 }}
        >
          {!hasResult ? '⚔️ 对战开始！' : 
           isDraw ? '🤝 平局！' :
           isPlayerWinner ? '🎉 你赢了！' : '😢 你输了...'}
        </motion.div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            gap: '32px',
            marginBottom: '32px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                color: 'var(--color-accent-brown)',
                marginBottom: '16px',
              }}
            >
              你
            </div>
            <AnimatePresence mode="wait">
              {playerFlower && (
                <motion.div
                  key="player-flower"
                  initial={{ x: -100, opacity: 0, rotate: -30 }}
                  animate={{ x: 0, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <FlowerCard
                    flower={playerFlower}
                    size="large"
                    isWinner={hasResult && isPlayerWinner}
                    isLoser={hasResult && isAIWinner}
                    isBattling={!hasResult}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '48px',
              fontWeight: 700,
              color: hasResult 
                ? (isDraw ? 'var(--color-gold)' : isPlayerWinner ? '#4caf50' : '#f44336')
                : 'var(--color-border-brown)',
            }}
            animate={!hasResult ? {
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            } : {
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: !hasResult ? Infinity : 0,
              repeatType: 'reverse',
            }}
          >
            VS
          </motion.div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                color: 'var(--color-accent-brown)',
                marginBottom: '16px',
              }}
            >
              对手
            </div>
            <AnimatePresence mode="wait">
              {aiFlower && (
                <motion.div
                  key="ai-flower"
                  initial={{ x: 100, opacity: 0, rotate: 30 }}
                  animate={{ x: 0, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                >
                  <FlowerCard
                    flower={aiFlower}
                    size="large"
                    isWinner={hasResult && isAIWinner}
                    isLoser={hasResult && isPlayerWinner}
                    isBattling={!hasResult}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {hasResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: 'var(--color-border-brown)',
            }}
          >
            {isDraw ? '双方花草势均力敌，难分高下！' :
             isPlayerWinner ? `${playerFlower?.name} 力压 ${aiFlower?.name}，更胜一筹！` :
             `${aiFlower?.name} 略胜 ${playerFlower?.name} 一筹...`}
          </motion.div>
        )}

        {!hasResult && (
          <motion.div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: 'var(--color-border-brown)',
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            正在判定中...
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BattleArena;
