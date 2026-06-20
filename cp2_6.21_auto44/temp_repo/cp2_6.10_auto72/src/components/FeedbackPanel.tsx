import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

const FeedbackPanel: React.FC = () => {
  const attempts = useGameStore((state) => state.attempts);
  const maxAttempts = useGameStore((state) => state.maxAttempts);
  const isLocked = useGameStore((state) => state.isLocked);
  const lockTimer = useGameStore((state) => state.lockTimer);
  const isSolved = useGameStore((state) => state.isSolved);
  const currentCombination = useGameStore((state) => state.getCurrentCombination());
  const targetCombination = useGameStore((state) => state.targetCombination);

  return (
    <motion.div
      className="feedback-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      style={{
        position: 'relative',
        background: 'linear-gradient(145deg, #8b4513, #6b3410)',
        border: '3px solid #5c2c0a',
        borderRadius: '8px',
        padding: '20px 30px',
        marginTop: '30px',
        minWidth: '320px',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
      }}
    >
      <div
        className="rivet"
        style={{ position: 'absolute', top: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'radial-gradient(circle, #d4a76a 0%, #8b6f47 100%)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}
      />
      <div
        className="rivet"
        style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'radial-gradient(circle, #d4a76a 0%, #8b6f47 100%)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}
      />
      <div
        className="rivet"
        style={{ position: 'absolute', bottom: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'radial-gradient(circle, #d4a76a 0%, #8b6f47 100%)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}
      />
      <div
        className="rivet"
        style={{ position: 'absolute', bottom: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'radial-gradient(circle, #d4a76a 0%, #8b6f47 100%)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}
      />

      <div
        className="panel-title"
        style={{
          fontFamily: "'ZCOOL XiaoWei', 'Noto Serif SC', serif",
          fontSize: '18px',
          color: '#d4a76a',
          textAlign: 'center',
          marginBottom: '16px',
          letterSpacing: '4px',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        铜 质 铭 牌
      </div>

      <div
        className="combination-display"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {currentCombination.map((symbol, index) => (
          <motion.div
            key={index}
            className="symbol-display"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '8px',
              background: 'linear-gradient(145deg, #2c2c3e, #1a1a2e)',
              border: '2px solid #d4a76a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'ZCOOL XiaoWei', 'Noto Serif SC', serif",
              fontSize: '24px',
              color: isSolved ? '#2ecc71' : '#ffd700',
              textShadow: isSolved ? '0 0 10px #2ecc71' : '0 0 8px rgba(255, 215, 0, 0.5)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {symbol}
          </motion.div>
        ))}
      </div>

      <div
        className="attempts-display"
        style={{
          textAlign: 'center',
          fontFamily: "'Noto Serif SC', serif",
          fontSize: '16px',
          color: '#e74c3c',
          marginBottom: '12px',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        尝试次数：{attempts} / {maxAttempts}
      </div>

      <AnimatePresence mode="wait">
        {isLocked && (
          <motion.div
            key="locked"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lock-status"
            style={{
              textAlign: 'center',
              fontFamily: "'Noto Serif SC', serif",
              fontSize: '18px',
              color: '#e74c3c',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(231, 76, 60, 0.8)',
              padding: '8px 0',
            }}
          >
            🔒 机关锁死！{lockTimer} 秒后解锁
          </motion.div>
        )}

        {isSolved && (
          <motion.div
            key="solved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="success-status"
            style={{
              textAlign: 'center',
              fontFamily: "'ZCOOL XiaoWei', 'Noto Serif SC', serif",
              fontSize: '20px',
              color: '#2ecc71',
              fontWeight: 'bold',
              textShadow: '0 0 15px rgba(46, 204, 113, 0.8)',
              padding: '8px 0',
            }}
          >
            ✨ 机关已开！石门缓缓开启...
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="hint"
        style={{
          textAlign: 'center',
          fontFamily: "'Noto Serif SC', serif",
          fontSize: '12px',
          color: 'rgba(212, 167, 106, 0.6)',
          marginTop: '12px',
          fontStyle: 'italic',
        }}
      >
        提示：{targetCombination.join(' - ')}
      </div>
    </motion.div>
  );
};

export default FeedbackPanel;
