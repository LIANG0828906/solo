import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { COLORS, CELL_SIZE } from '../utils/constants';

interface SettlementProps {
  boardCenter: { x: number; y: number };
}

export const Settlement = ({ boardCenter }: SettlementProps) => {
  const {
    showSettlement,
    winner,
    fishCount,
    bets,
    settleBets,
    resetGame,
  } = useGameStore();

  const [showLightBeam, setShowLightBeam] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showCoins, setShowCoins] = useState(false);

  useEffect(() => {
    if (showSettlement) {
      setShowLightBeam(false);
      setShowResult(false);
      setShowCoins(false);

      setTimeout(() => setShowLightBeam(true), 300);
      setTimeout(() => setShowResult(true), 1100);
      setTimeout(() => setShowCoins(true), 1500);
    }
  }, [showSettlement]);

  if (!showSettlement || !winner) return null;

  const fishDiff = Math.abs(fishCount.tiger - fishCount.leopard);
  const winAmount = bets[winner] * Math.max(1, fishDiff);
  const loser = winner === 'tiger' ? 'leopard' : 'tiger';

  const fallingCoins = Array.from({ length: Math.min(20, winAmount) }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          overflow: 'hidden',
        }}
      >
        <AnimatePresence>
          {showLightBeam && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%) scaleY(0)',
                transformOrigin: 'center bottom',
                width: '120px',
                height: '80vh',
                background: `linear-gradient(to top, ${COLORS.gold} 0%, rgba(255, 215, 0, 0.6) 30%, rgba(255, 215, 0, 0.2) 70%, transparent 100%)`,
                boxShadow: `0 0 60px ${COLORS.gold}, 0 0 120px ${COLORS.gold}`,
                pointerEvents: 'none',
              }}
            >
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scaleX: [1, 1.2, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '60px',
                  filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
                }}
              >
                {winner === 'tiger' ? '🐯' : '🐆'}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCoins && (
            <>
              {fallingCoins.map((coin) => (
                <motion.div
                  key={coin.id}
                  initial={{ y: -100, opacity: 0, rotate: 0 }}
                  animate={{
                    y: window.innerHeight + 100,
                    opacity: [0, 1, 1, 0],
                    rotate: coin.rotation + 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: coin.delay,
                    ease: 'easeIn',
                  }}
                  style={{
                    position: 'absolute',
                    left: `${coin.x}%`,
                    fontSize: '30px',
                    pointerEvents: 'none',
                  }}
                >
                  💰
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              style={{
                backgroundColor: COLORS.inkBlack,
                padding: '50px',
                borderRadius: '16px',
                border: `4px solid ${COLORS.gold}`,
                textAlign: 'center',
                minWidth: '400px',
                fontFamily: '"SimSun", "STSong", serif',
                boxShadow: `0 0 40px rgba(255, 215, 0, 0.5)`,
                zIndex: 10,
              }}
            >
              <motion.h1
                animate={{
                  scale: [1, 1.1, 1],
                  textShadow: [
                    `0 0 20px ${COLORS.gold}`,
                    `0 0 40px ${COLORS.gold}`,
                    `0 0 20px ${COLORS.gold}`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  color: COLORS.gold,
                  fontSize: '48px',
                  margin: '0 0 20px 0',
                  letterSpacing: '12px',
                }}
              >
                {winner === 'tiger' ? '朱红虎方' : '玄青豹方'}
              </motion.h1>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  color: COLORS.bronzeYellow,
                  fontSize: '36px',
                  margin: '0 0 30px 0',
                  letterSpacing: '8px',
                }}
              >
                胜 利！
              </motion.h2>

              <div
                style={{
                  margin: '30px 0',
                  padding: '20px',
                  borderTop: `2px solid ${COLORS.darkGold}`,
                  borderBottom: `2px solid ${COLORS.darkGold}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '15px',
                    fontSize: '18px',
                    color: COLORS.darkGold,
                  }}
                >
                  <span style={{ color: COLORS.tigerRed }}>🐯 虎方鱼牌：</span>
                  <span style={{ color: COLORS.gold, fontWeight: 'bold' }}>
                    {fishCount.tiger} 枚
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '15px',
                    fontSize: '18px',
                    color: COLORS.darkGold,
                  }}
                >
                  <span style={{ color: COLORS.leopardBlue }}>🐆 豹方鱼牌：</span>
                  <span style={{ color: COLORS.gold, fontWeight: 'bold' }}>
                    {fishCount.leopard} 枚
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '20px',
                    color: COLORS.bronzeYellow,
                  }}
                >
                  <span>赢取筹码：</span>
                  <span style={{ color: COLORS.gold, fontWeight: 'bold' }}>
                    💰 +{winAmount}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: COLORS.bronzeYellow }}
                  whileTap={{ scale: 0.95 }}
                  onClick={settleBets}
                  style={{
                    padding: '14px 40px',
                    backgroundColor: COLORS.bronzeGreen,
                    color: 'white',
                    border: `2px solid ${COLORS.darkGold}`,
                    borderRadius: '4px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    fontFamily: '"SimSun", "STSong", serif',
                    letterSpacing: '4px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  结算
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  style={{
                    padding: '14px 40px',
                    backgroundColor: 'transparent',
                    color: COLORS.darkGold,
                    border: `2px solid ${COLORS.darkGold}`,
                    borderRadius: '4px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    fontFamily: '"SimSun", "STSong", serif',
                    letterSpacing: '4px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  再来一局
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
