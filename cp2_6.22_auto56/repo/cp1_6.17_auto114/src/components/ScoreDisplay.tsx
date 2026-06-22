import React, { useState, useEffect } from 'react';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  const [animate, setAnimate] = useState(false);
  const isPerfect = score === 100;

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 600);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div
      style={{
        textAlign: 'center',
        margin: '24px 0',
        padding: '20px',
        background: 'rgba(255, 248, 231, 0.8)',
        borderRadius: '12px',
        border: '2px solid #D7CCC8',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          color: '#6D4C41',
          marginBottom: '8px',
        }}
      >
        本次得分
      </div>
      <div
        className="score-number"
        style={{
          fontSize: '56px',
          fontWeight: 'bold',
          color: isPerfect ? '#FFD700' : '#3E2723',
          transform: animate ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          textShadow: isPerfect ? '0 2px 8px rgba(255, 215, 0, 0.5)' : 'none',
        }}
      >
        {score}
        <span style={{ fontSize: '28px', marginLeft: '4px' }}>分</span>
      </div>
      {isPerfect && (
        <div
          style={{
            fontSize: '24px',
            color: '#FFD700',
            fontWeight: 'bold',
            marginTop: '8px',
            textShadow: '0 1px 4px rgba(255, 215, 0, 0.3)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          ✨ 满分！太棒了！ ✨
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default ScoreDisplay;
