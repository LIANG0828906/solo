import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store';
import { playClickSound } from './sound';

const ResultPanel: React.FC = () => {
  const { showResult, resultData, closeResult, resetGame } = useGameStore();

  const handleClose = () => {
    playClickSound();
    closeResult();
    resetGame();
  };

  if (!showResult || !resultData) return null;

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0分0秒';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: 'rgba(0, 0, 0, 0.7)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative p-8 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2b5e3c 0%, #1a4e2c 50%, #0d3a1e 100%)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-3"
              style={{
                background: 'linear-gradient(90deg, #c4a46c 0%, #8b5e3c 50%, #c4a46c 100%)'
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-3"
              style={{
                background: 'linear-gradient(90deg, #c4a46c 0%, #8b5e3c 50%, #c4a46c 100%)'
              }}
            />

            <div className="absolute top-3 left-3 w-6 h-6 rounded-full"
              style={{ background: '#c4a46c' }}
            />
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full"
              style={{ background: '#c4a46c' }}
            />
            <div className="absolute bottom-3 left-3 w-6 h-6 rounded-full"
              style={{ background: '#c4a46c' }}
            />
            <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full"
              style={{ background: '#c4a46c' }}
            />

            <div className="text-center py-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl mb-4"
              >
                {resultData.type === 'manual' ? '📜' : '⚫⚪'}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2"
                style={{ color: '#f5e6d3', fontFamily: '华文楷体, serif' }}
              >
                {resultData.type === 'manual' ? '打谱完成' : '对弈结束'}
              </motion.h2>

              {resultData.type === 'manual' && resultData.manualName && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg mb-4"
                  style={{ color: '#c4a46c' }}
                >
                  《{resultData.manualName}》
                </motion.p>
              )}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="my-6 py-4 px-6 rounded-lg inline-block"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '3px solid #c4a46c'
                }}
              >
                <span className="text-5xl font-bold" style={{ color: '#f5e6d3' }}>
                  {resultData.type === 'manual'
                    ? `${resultData.accuracy?.toFixed(1)}%`
                    : `${resultData.winRate?.toFixed(1)}%`}
                </span>
              </motion.div>

              {resultData.type === 'manual' && resultData.comment && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-xl font-bold mb-3"
                  style={{ color: '#ffd700' }}
                >
                  「{resultData.comment}」
                </motion.p>
              )}

              {resultData.type === 'free' && resultData.winner && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-xl font-bold mb-3"
                  style={{ color: resultData.winner === 'black' ? '#f5e6d3' : '#c0c0c0' }}
                >
                  {resultData.winner === 'black' ? '⚫ 黑方胜' : resultData.winner === 'white' ? '⚪ 白方胜' : '🤝 和棋'}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-sm"
                style={{ color: '#8b7d6b' }}
              >
                <p>
                  {resultData.type === 'manual' ? '正确率' : '黑方胜率'} · 
                  用时 {formatDuration(resultData.duration)}
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="mt-6 px-8 py-3 rounded-lg font-bold text-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #c4a46c 0%, #8b5e3c 100%)',
                  color: '#1a0a00',
                  border: '2px solid #f5e6d3',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}
              >
                再来一局
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResultPanel;
