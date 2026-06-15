import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameBoard } from './components/GameBoard';
import { StatusPanel } from './components/StatusPanel';
import { DiceCast } from './components/DiceCast';
import { FishBoi } from './components/FishBoi';
import { Settlement } from './components/Settlement';
import { useGameStore } from './store/gameStore';
import { COLORS } from './utils/constants';

function App() {
  const [boardCenter, setBoardCenter] = useState({ x: 0, y: 0 });
  const [betAmount, setBetAmount] = useState(10);

  const { phase, startGame, resetGame, winner, fishCount, bets } = useGameStore();

  const handleBoardCenter = useCallback((center: { x: number; y: number }) => {
    setBoardCenter(center);
  }, []);

  const handleStartGame = () => {
    startGame(betAmount);
  };

  return (
    <div
      style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      backgroundImage: `
        radial-gradient(ellipse at center, rgba(184, 134, 11, 0.1) 0%, transparent 70%),
        repeating-linear-gradient(0deg, transparent 0px, transparent 24px, rgba(184, 134, 11, 0.05) 25px, transparent 26px),
        repeating-linear-gradient(90deg, transparent 0px, transparent 24px, rgba(184, 134, 11, 0.05) 25px, transparent 26px)
      `,
      padding: '20px',
      fontFamily: '"SimSun", "STSong", serif',
    }}
    >
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          textAlign: 'center',
          color: COLORS.darkGold,
          fontSize: '48px',
          margin: '0 0 30px 0',
          letterSpacing: '20px',
          textShadow: `0 0 30px rgba(184, 134, 11, 0.8)`,
          fontFamily: '"STKaiti", "KaiTi", serif',
        }}
      >
        六 博 棋 戏
      </motion.h1>

      <AnimatePresence>
        {phase === 'betting' && (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{
              backgroundColor: COLORS.inkBlack,
              padding: '50px',
              borderRadius: '12px',
              border: `4px solid ${COLORS.darkGold}`,
              textAlign: 'center',
              minWidth: '400px',
              boxShadow: `0 0 40px rgba(184, 134, 11, 0.3)`,
            }}
          >
            <h2
              style={{
                color: COLORS.gold,
                fontSize: '28px',
                margin: '0 0 30px 0',
                letterSpacing: '8px',
              }}
            >
                押 注 开 局
            </h2>

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
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                marginBottom: '20px',
              }}
            >
              <span style={{ color: COLORS.tigerRed, fontSize: '20px' }}>
                🐯 虎方
              </span>
              <span style={{ color: COLORS.darkGold, fontSize: '24px' }}>
                💰 {betAmount}
              </span>
              <span style={{ color: COLORS.darkGold, fontSize: '24px' }}>
                VS
              </span>
              <span style={{ color: COLORS.darkGold, fontSize: '24px' }}>
                💰 {betAmount}
              </span>
              <span style={{ color: COLORS.leopardBlue, fontSize: '20px' }}>
                豹方 🐆
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px',
              }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setBetAmount(Math.max(1, betAmount - 5))}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: COLORS.bronzeGreen,
                  color: 'white',
                  border: `2px solid ${COLORS.darkGold}`,
                  borderRadius: '4px',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                -
              </motion.button>
              <span
                style={{
                  color: COLORS.gold,
                  fontSize: '32px',
                  minWidth: '80px',
                  fontWeight: 'bold',
                }}
              >
                {betAmount}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setBetAmount(Math.min(100, betAmount + 5))}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: COLORS.bronzeGreen,
                  color: 'white',
                  border: `2px solid ${COLORS.darkGold}`,
                  borderRadius: '4px',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                +
              </motion.button>
            </div>
          </div>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: COLORS.bronzeYellow }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
              style={{
                padding: '16px 60px',
                backgroundColor: COLORS.bronzeGreen,
                color: 'white',
                border: `2px solid ${COLORS.darkGold}`,
                borderRadius: '4px',
                fontSize: '20px',
                cursor: 'pointer',
                fontFamily: '"SimSun", "STSong", serif',
                letterSpacing: '8px',
                boxShadow: `0 0 20px rgba(74, 124, 89, 0.5)`,
                transition: 'all 0.3s ease',
              }}
            >
              开 始 对 弈
            </motion.button>

            <p
              style={{
                color: COLORS.darkGold,
                marginTop: '20px',
                fontSize: '14px',
                opacity: 0.7,
              }}
            >
              规则：投箸行棋，落入博鱼位拔鱼，鱼多者胜
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {(phase === 'playing' || phase === 'settling' || phase === 'ended') && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '30px',
          flexWrap: 'wrap',
        }}
      >
        <StatusPanel />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '480px',
              marginBottom: '20px',
              padding: '10px 20px',
              backgroundColor: COLORS.inkBlack,
              border: `2px solid ${COLORS.darkGold}`,
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '24px' }}>💰</span>
              <span
                style={{
                  color: COLORS.tigerRed,
                  fontSize: '18px',
                }}
              >
                虎方：
              </span>
              <span
                style={{
                  color: COLORS.gold,
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                {bets.tiger}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  color: COLORS.leopardBlue,
                  fontSize: '18px',
                }}
              >
                豹方：
              </span>
              <span
                style={{
                  color: COLORS.gold,
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                {bets.leopard}
              </span>
              <span style={{ fontSize: '24px' }}>💰</span>
            </div>
          </div>

          <GameBoard onBoardCenter={handleBoardCenter} />

          {phase === 'ended' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              style={{
                marginTop: '20px',
                padding: '12px 40px',
                backgroundColor: COLORS.bronzeGreen,
                color: 'white',
                border: `2px solid ${COLORS.darkGold}`,
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                fontFamily: '"SimSun", "STSong", serif',
                letterSpacing: '4px',
                transition: 'all 0.3s ease',
              }}
            >
              返回押注界面
            </motion.button>
          )}
        </div>

        <DiceCast />
      </motion.div>
    )}

      <FishBoi boardCenter={boardCenter} />
      <Settlement boardCenter={boardCenter} />

      <AnimatePresence>
        {phase === 'ended' && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: COLORS.inkBlack,
              padding: '20px 40px',
              border: `2px solid ${COLORS.darkGold}`,
              borderRadius: '8px',
              textAlign: 'center',
              color: COLORS.darkGold,
              boxShadow: `0 0 20px rgba(184, 134, 11, 0.5)`,
            }}
          >
            <p style={{ margin: 0, fontSize: '18px', letterSpacing: '4px' }}>
              游戏结束！
              <span
                style={{
                  color: winner === 'tiger' ? COLORS.tigerRed : COLORS.leopardBlue }}
              >
                {' '}
                {winner === 'tiger' ? '朱红虎方' : '玄青豹方'}
              </span>{' '}
              获胜！
            </p>
            <p
              style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: 0.8 }}
            >
              最终比分：虎方 {fishCount.tiger} : {fishCount.leopard} 豹方
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
