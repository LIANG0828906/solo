import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store';
import { GameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';
import GameCanvas from './components/GameCanvas';
import Hud from './components/Hud';

function App() {
  const { gameState, score, startGame, resetGame } = useGameStore();

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleRestart = () => {
    resetGame();
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0D0F1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          boxShadow: '0 0 60px rgba(74, 144, 217, 0.3)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <GameCanvas />
        <Hud />

        <AnimatePresence>
          {gameState === GameState.GAME_OVER && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Press Start 2P', cursive",
                zIndex: 100,
              }}
            >
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{
                  fontSize: '36px',
                  color: '#E74C3C',
                  textShadow: '4px 4px 0px #000000',
                  marginBottom: '30px',
                }}
              >
                游戏结束
              </motion.div>

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{
                  fontSize: '16px',
                  color: '#AAAAAA',
                  marginBottom: '10px',
                }}
              >
                最终分数
              </motion.div>

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{
                  fontSize: '64px',
                  color: '#FFFFFF',
                  textShadow: '4px 4px 0px #000000',
                  marginBottom: '40px',
                }}
              >
                {score}
              </motion.div>

              <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                whileHover={{ scale: 1.05, background: '#5DADE2' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestart}
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '14px',
                  color: '#FFFFFF',
                  background: '#4A90D9',
                  border: '4px solid #2E86AB',
                  padding: '16px 32px',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px #1A5276',
                  transition: 'all 0.2s',
                }}
              >
                再试一次
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '20px',
          color: '#4A90D9',
          textShadow: '2px 2px 0px #1A1D2E',
          whiteSpace: 'nowrap',
        }}
      >
        符文魔法师
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '10px',
          color: '#666666',
          textAlign: 'center',
          lineHeight: '1.8',
        }}
      >
        <div>在下方灰色区域绘制符文手势来释放魔法</div>
        <div style={{ marginTop: '4px', fontSize: '8px', color: '#444444' }}>
          圆形=防护罩 | 三角形=爆炸 | 闪电=闪电链 | 螺旋=减速 | 星形=散射
        </div>
      </div>
    </div>
  );
}

export default App;
