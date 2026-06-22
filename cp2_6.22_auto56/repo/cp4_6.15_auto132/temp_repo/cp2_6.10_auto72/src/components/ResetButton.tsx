import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

const ResetButton: React.FC = () => {
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <motion.button
      className="reset-button"
      onClick={resetGame}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '10px 20px',
        fontFamily: "'ZCOOL XiaoWei', 'Noto Serif SC', serif",
        fontSize: '16px',
        color: '#d4a76a',
        letterSpacing: '4px',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '40px',
            background: 'linear-gradient(90deg, #8b4513 0%, #d4a76a 50%, #8b4513 100%)',
            borderRadius: '4px 0 0 4px',
            boxShadow: '2px 0 4px rgba(0,0,0,0.3)',
          }}
        />
        <div
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(180deg, #f5e6d3 0%, #e8d5b7 50%, #d4c4a8 100%)',
            border: '1px solid #8b6f47',
            borderRadius: '2px',
            boxShadow: `
              0 4px 8px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.5)
            `,
            color: '#5c4033',
            textShadow: '0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          重 置
        </div>
        <div
          style={{
            width: '20px',
            height: '40px',
            background: 'linear-gradient(90deg, #8b4513 0%, #d4a76a 50%, #8b4513 100%)',
            borderRadius: '0 4px 4px 0',
            boxShadow: '-2px 0 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </motion.button>
  );
};

export default ResetButton;
