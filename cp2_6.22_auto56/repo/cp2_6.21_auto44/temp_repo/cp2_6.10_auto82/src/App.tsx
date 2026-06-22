import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Board from './Board';
import Bookshelf from './Bookshelf';
import GameLibrary from './GameLibrary';
import ResultPanel from './ResultPanel';
import { useGameStore } from './store';
import { playClickSound } from './sound';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { gameMode, resetGame, toggleMode } = useGameStore();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleReset = () => {
    playClickSound();
    resetGame();
  };

  const handleToggleMode = () => {
    playClickSound();
    toggleMode();
  };

  const getModeText = () => {
    if (gameMode === 'idle') return '请选择模式';
    if (gameMode === 'manual') return '📜 打谱模式';
    return '⚫ 对弈模式';
  };

  return (
    <div className="min-h-screen py-6 px-4"
      style={{
        background: `
          radial-gradient(ellipse at top, #faf0e6 0%, transparent 50%),
          radial-gradient(ellipse at bottom, #e8d5b7 0%, transparent 50%),
          linear-gradient(180deg, #f5e6d3 0%, #e8d5b7 100%)
        `
      }}>
      
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2"
          style={{
            color: '#1a0a00',
            fontFamily: '华文楷体, "Noto Serif SC", serif',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
          忘忧清乐集
        </h1>
        <p className="text-sm" style={{ color: '#5c3a1e' }}>
          唐代翰林院棋待诏 · 珍珑棋谱打谱与对弈
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center gap-3 mb-4"
      >
        <div className="px-4 py-2 rounded-full text-sm font-bold"
          style={{
            background: 'linear-gradient(135deg, #c4a46c 0%, #b8956a 100%)',
            color: '#1a0a00',
            border: '2px solid #8b5e3c'
          }}>
          {getModeText()}
        </div>
        
        {gameMode !== 'idle' && (
          <>
            <button
              onClick={handleToggleMode}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8b7d6b 0%, #6b5d4b 100%)',
                color: '#f5e6d3',
                border: '2px solid #5c3a1e'
              }}
            >
              {gameMode === 'manual' ? '切换对弈' : '返回书架'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8b0000 0%, #5c0000 100%)',
                color: '#f5e6d3',
                border: '2px solid #3c0000'
              }}
            >
              重新开始
            </button>
          </>
        )}
      </motion.div>

      {isMobile && (
        <Bookshelf isMobile={true} />
      )}

      <div className={`flex gap-6 justify-center items-start ${isMobile ? 'flex-col' : ''}`}>
        {!isMobile && (
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-shrink-0"
          >
            <Bookshelf />
          </motion.aside>
        )}

        <motion.main
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex-shrink-0"
        >
          {gameMode === 'idle' ? (
            <div
              className="flex flex-col items-center justify-center rounded-lg p-12 text-center"
              style={{
                width: isMobile ? '100%' : '540px',
                height: '540px',
                background: `
                  linear-gradient(135deg, rgba(196, 164, 108, 0.2) 0%, rgba(139, 94, 60, 0.2) 100%)
                `,
                border: '4px dashed #8b7d6b'
              }}
            >
              <div className="text-6xl mb-4">🏯</div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1a0a00' }}>
                欢迎来到纹枰之间
              </h2>
              <p className="text-sm mb-6 max-w-xs" style={{ color: '#5c3a1e' }}>
                您是唐代翰林院的棋待诏，请从左侧书架选择一份珍珑棋谱，
                或进入对弈模式与AI一较高下。
              </p>
              {!isMobile && (
                <div className="text-xs space-y-1" style={{ color: '#8b7d6b' }}>
                  <p>📖 打谱模式：按棋谱着法一步步落子</p>
                  <p>⚫ 对弈模式：执黑子与AI对弈</p>
                  <p>📚 棋谱库：查看历史对局记录</p>
                </div>
              )}
            </div>
          ) : (
            <Board />
          )}
        </motion.main>

        {!isMobile && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-shrink-0"
          >
            <GameLibrary />
          </motion.aside>
        )}
      </div>

      {isMobile && (
        <GameLibrary isMobile={true} />
      )}

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center mt-8 text-xs"
        style={{ color: '#8b7d6b' }}
      >
        <p>忘忧清乐集 · 围棋打谱系统</p>
        <p className="mt-1">基于 TypeScript + React + Canvas 实现</p>
      </motion.footer>

      <ResultPanel />
    </div>
  );
};

export default App;
