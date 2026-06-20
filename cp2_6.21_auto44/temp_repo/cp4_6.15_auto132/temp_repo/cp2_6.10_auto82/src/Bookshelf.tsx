import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { chessManuals } from './data/chessManuals';
import { ChessManual } from './types';
import { useGameStore } from './store';
import { playClickSound } from './sound';

interface BookshelfProps {
  isMobile?: boolean;
}

const Bookshelf: React.FC<BookshelfProps> = ({ isMobile = false }) => {
  const { selectManual, selectedManual, startFreeMode, gameMode } = useGameStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSelect = (manual: ChessManual) => {
    playClickSound();
    selectManual(manual);
    if (isMobile) setShowDropdown(false);
  };

  const handleFreeMode = () => {
    playClickSound();
    startFreeMode();
    if (isMobile) setShowDropdown(false);
  };

  const bookColors = [
    { bg: 'linear-gradient(135deg, #4a2c0a 0%, #2d1a05 100%)', spine: '#3a2208' },
    { bg: 'linear-gradient(135deg, #5c1a1a 0%, #3a0d0d 100%)', spine: '#4a1515' },
    { bg: 'linear-gradient(135deg, #1a3a2a 0%, #0d2a1a 100%)', spine: '#153020' },
  ];

  if (isMobile) {
    return (
      <div className="w-full mb-4">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full px-4 py-3 rounded font-bold text-left flex justify-between items-center"
            style={{
              background: 'linear-gradient(135deg, #5c3a1e 0%, #3a2208 100%)',
              color: '#f5e6d3',
              border: '2px solid #8b7d6b'
            }}
          >
            <span>📜 选择棋谱</span>
            <span>{showDropdown ? '▲' : '▼'}</span>
          </button>
          
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 rounded shadow-xl z-50 overflow-hidden"
              style={{ background: '#5c3a1e', border: '2px solid #8b7d6b' }}
            >
              {chessManuals.map((manual, idx) => (
                <button
                  key={manual.id}
                  onClick={() => handleSelect(manual)}
                  className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                    selectedManual?.id === manual.id ? 'bg-opacity-30' : ''
                  }`}
                  style={{
                    background: selectedManual?.id === manual.id ? bookColors[idx].spine : 'transparent',
                    color: '#f5e6d3',
                    borderBottom: '1px solid #8b7d6b'
                  }}
                >
                  <span className="text-2xl">📖</span>
                  <div>
                    <div className="font-bold">{manual.name}</div>
                    <div className="text-xs opacity-75">{manual.dynasty} · {manual.author}</div>
                  </div>
                </button>
              ))}
              <button
                onClick={handleFreeMode}
                className="w-full px-4 py-3 text-left transition-colors flex items-center gap-3"
                style={{
                  background: gameMode === 'free' ? '#2b5e3c' : 'transparent',
                  color: '#f5e6d3'
                }}
              >
                <span className="text-2xl">⚫</span>
                <div>
                  <div className="font-bold">自由对弈</div>
                  <div className="text-xs opacity-75">与AI一较高下</div>
                </div>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-lg min-w-[200px]"
      style={{
        background: `
          linear-gradient(90deg, #3a2208 0%, #5c3a1e 50%, #4a2c0a 100%),
          repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          )
        `,
        backgroundBlendMode: 'multiply',
        border: '3px solid #8b7d6b',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      <h2 className="text-lg font-bold text-center mb-4 pb-2 border-b-2"
        style={{ color: '#f5e6d3', borderColor: '#8b7d6b' }}>
        📚 珍珑棋谱
      </h2>

      <div className="space-y-3">
        {chessManuals.map((manual, idx) => (
          <motion.div
            key={manual.id}
            onMouseEnter={() => setHoveredId(manual.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleSelect(manual)}
            animate={{
              x: hoveredId === manual.id ? -8 : 0,
              scale: hoveredId === manual.id ? 1.02 : 1
            }}
            transition={{ duration: 0.3 }}
            className={`
              relative p-3 rounded cursor-pointer
              ${selectedManual?.id === manual.id ? 'ring-2 ring-yellow-400' : ''}
            `}
            style={{
              background: bookColors[idx].bg,
              borderLeft: `6px solid ${bookColors[idx].spine}`,
              boxShadow: hoveredId === manual.id
                ? '5px 5px 15px rgba(0, 0, 0, 0.4)'
                : '2px 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📖</span>
              <span className="font-bold" style={{ color: '#f5e6d3', fontFamily: '华文楷体, serif' }}>
                {manual.name}
              </span>
            </div>
            <div className="text-xs mb-1" style={{ color: '#c4a46c' }}>
              {manual.dynasty} · {manual.author}
            </div>
            <div className="text-xs" style={{ color: '#8b7d6b' }}>
              {manual.totalMoves} 手
            </div>
            {selectedManual?.id === manual.id && (
              <div className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-xs">
                ✓
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t-2" style={{ borderColor: '#8b7d6b' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFreeMode}
          className={`
            w-full py-3 rounded font-bold flex items-center justify-center gap-2
            ${gameMode === 'free' ? 'ring-2 ring-yellow-400' : ''}
          `}
          style={{
            background: gameMode === 'free'
              ? 'linear-gradient(135deg, #3a6a4a 0%, #2b5e3c 100%)'
              : 'linear-gradient(135deg, #2b5e3c 0%, #1a4e2c 100%)',
            color: '#f5e6d3',
            border: '2px solid #8b7d6b'
          }}
        >
          <span className="text-xl">⚫⚪</span>
          <span>对弈模式</span>
        </motion.button>
      </div>

      <div className="mt-4 p-3 rounded text-xs"
        style={{ background: 'rgba(0, 0, 0, 0.2)', color: '#c4a46c' }}>
        <p className="mb-1">💡 <strong>打谱模式：</strong></p>
        <p className="mb-2">选择棋谱后自动加载前30手，点击「下一手」继续。</p>
        <p className="mb-1">💡 <strong>对弈模式：</strong></p>
        <p>执黑子先行，与AI对弈，挑战贪心策略。</p>
      </div>
    </div>
  );
};

export default Bookshelf;
