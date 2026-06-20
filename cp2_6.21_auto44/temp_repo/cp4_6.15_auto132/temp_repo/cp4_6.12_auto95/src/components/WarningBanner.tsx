import React, { useState, useEffect } from 'react';

interface WarningBannerProps {
  visible: boolean;
  messages: string[];
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ visible, messages }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setAnimationKey((k) => k + 1);
      setShowAnimation(true);
    } else {
      setShowAnimation(false);
    }
  }, [visible, messages]);

  if (!visible || messages.length === 0) return null;

  const warningStyle: React.CSSProperties = {
    position: 'relative',
    padding: '10px 16px',
    backgroundColor: '#ff4444',
    color: '#ffffff',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(255, 68, 68, 0.4)',
    overflow: 'hidden',
    animation: 'warningShake 2s ease-in-out infinite',
  };

  const styleSheet = `
    @keyframes warningShake {
      0%, 100% {
        transform: translateY(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateY(-3px);
      }
      20%, 40%, 60%, 80% {
        transform: translateY(2px);
      }
    }
    @keyframes slideInOut {
      0% {
        opacity: 0;
        transform: translateX(-100%);
      }
      10%, 90% {
        opacity: 1;
        transform: translateX(0);
      }
      100% {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `;

  return (
    <>
      <style>{styleSheet}</style>
      <div key={animationKey} style={warningStyle}>
        <span style={{ marginRight: '6px' }}>⚠️</span>
        {messages.map((msg, idx) => (
          <span
            key={idx}
            style={{
              display: idx > 0 ? 'inline-block' : 'inline',
              marginLeft: idx > 0 ? '8px' : 0,
              animation: `slideInOut ${2 + idx * 0.3}s ease-in-out infinite`,
              animationDelay: `${idx * 0.5}s`,
            }}
          >
            {msg}
          </span>
        ))}
      </div>
    </>
  );
};
