import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { COLORS, CELL_SIZE } from '../utils/constants';
import { createSplashParticles } from '../utils/helpers';

interface FishBoiProps {
  boardCenter: { x: number; y: number };
}

export const FishBoi = ({ boardCenter }: FishBoiProps) => {
  const {
    showFishBoi,
    boiPosition,
    catchFish,
    skipFishBoi,
    addParticles,
    currentPlayer,
  } = useGameStore();

  const [showFishAnimation, setShowFishAnimation] = useState(false);
  const [caughtFish, setCaughtFish] = useState<{ id: string; poolIndex: number } | null>(null);

  useEffect(() => {
    if (showFishBoi) {
      setShowFishAnimation(false);
      setCaughtFish(null);
    }
  }, [showFishBoi]);

  const handleCatchFish = () => {
    if (!boiPosition) return;

    setShowFishAnimation(true);
    setCaughtFish({ id: 'temp', poolIndex: Math.floor(Math.random() * 12) });

    const centerX = boardCenter.x + boiPosition.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = boardCenter.y + boiPosition.y * CELL_SIZE + CELL_SIZE / 2;
    const particles = createSplashParticles(centerX, centerY);
    addParticles(particles);

    setTimeout(() => {
      catchFish();
      setTimeout(() => {
        setShowFishAnimation(false);
        setCaughtFish(null);
      }, 800);
    }, 600);
  };

  if (!showFishBoi || !boiPosition) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        <motion.div
          initial={{ scale: 0.5, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.5, y: 50 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{
            backgroundColor: COLORS.inkBlack,
            padding: '40px',
            borderRadius: '12px',
            border: `4px solid ${COLORS.darkGold}`,
            textAlign: 'center',
            minWidth: '300px',
            fontFamily: '"SimSun", "STSong", serif',
          }}
        >
          <motion.h2
            animate={{
              color: [COLORS.gold, COLORS.bronzeYellow, COLORS.gold],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              fontSize: '32px',
              margin: '0 0 20px 0',
              letterSpacing: '8px',
            }}
          >
            博 鱼
          </motion.h2>

          <div style={{ position: 'relative', height: '120px', margin: '20px 0' }}>
            <AnimatePresence>
              {showFishAnimation && caughtFish && (
                <motion.div
                  initial={{ y: 100, rotate: 0, opacity: 0 }}
                  animate={{ y: -50, rotate: 180, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '80px',
                  }}
                >
                  🐟
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '24px',
                      color: COLORS.gold,
                      fontWeight: 'bold',
                      textShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                    }}
                  >
                    +1
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showFishAnimation && (
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '60px' }}
              >
                🎣
              </motion.div>
            )}
          </div>

          <p
            style={{
              color: COLORS.darkGold,
              fontSize: '16px',
              marginBottom: '30px',
              letterSpacing: '2px',
            }}
          >
            {currentPlayer === 'tiger' ? '朱红虎方' : '玄青豹方'} 落入博鱼位
          </p>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: COLORS.bronzeYellow }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCatchFish}
              disabled={showFishAnimation}
              style={{
                padding: '12px 30px',
                backgroundColor: showFishAnimation ? '#666' : COLORS.bronzeGreen,
                color: 'white',
                border: `2px solid ${COLORS.darkGold}`,
                borderRadius: '4px',
                fontSize: '16px',
                cursor: showFishAnimation ? 'not-allowed' : 'pointer',
                fontFamily: '"SimSun", "STSong", serif',
                letterSpacing: '4px',
                transition: 'all 0.3s ease',
              }}
            >
              {showFishAnimation ? '拔鱼中...' : '拔鱼'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={skipFishBoi}
              disabled={showFishAnimation}
              style={{
                padding: '12px 30px',
                backgroundColor: 'transparent',
                color: COLORS.darkGold,
                border: `2px solid ${COLORS.darkGold}`,
                borderRadius: '4px',
                fontSize: '16px',
                cursor: showFishAnimation ? 'not-allowed' : 'pointer',
                fontFamily: '"SimSun", "STSong", serif',
                letterSpacing: '4px',
                transition: 'all 0.3s ease',
              }}
            >
              跳过
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
