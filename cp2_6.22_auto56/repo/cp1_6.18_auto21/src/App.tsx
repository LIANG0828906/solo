import React, { useState, useEffect } from 'react';
import { usePoemStore } from '@/stores/poemStore';
import ParticleCanvas from '@/components/ParticleCanvas';
import { AnimationMode } from '@/utils/textToParticles';

const App: React.FC = () => {
  const { inputText, setInputText, generateParticles, animationMode, setAnimationMode, particles } =
    usePoemStore();

  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 150);
    generateParticles();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modes: { mode: AnimationMode; label: string; icon: string }[] = [
    { mode: 'ripple', label: '涟漪', icon: '◯' },
    { mode: 'spiral', label: '螺旋', icon: '⬡' },
    { mode: 'firework', label: '烟花', icon: '✦' },
  ];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '"Microsoft YaHei", "SimHei", sans-serif',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
    >
      <div
        style={{
          height: '20vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          position: 'relative',
          zIndex: 10,
          transform: isLoaded ? 'translateY(0)' : 'translateY(-30px)',
          transition: 'transform 600ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        <h1
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: '14px',
            fontWeight: 'normal',
            letterSpacing: '8px',
            margin: 0,
          }}
        >
          光影诗笺
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            maxWidth: '700px',
            justifyContent: 'center',
            marginTop: '20px',
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入诗句或短句（最多50字）..."
            maxLength={50}
            style={{
              width: '600px',
              maxWidth: '600px',
              padding: '16px 20px',
              background: '#1A1A2E',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 4px 30px rgba(102, 126, 234, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '20px',
              boxShadow: inputText.trim()
                ? '0 4px 20px rgba(102, 126, 234, 0.5), 0 0 40px rgba(118, 75, 162, 0.3)'
                : 'none',
              transform: isButtonPressed ? 'scale(0.9)' : 'scale(1)',
              transition: 'all 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              opacity: inputText.trim() ? 1 : 0.5,
            }}
          >
            ✦
          </button>
        </div>

        {particles.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '15px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '12px',
            }}
          >
            共 {particles.length} 个粒子 · 悬停查看详情 · 点击触发波纹
          </div>
        )}
      </div>

      <ParticleCanvas />

      <div
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          zIndex: 20,
          opacity: particles.length > 0 ? 1 : 0,
          pointerEvents: particles.length > 0 ? 'auto' : 'none',
          transition: 'opacity 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        {modes.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setAnimationMode(mode)}
            style={{
              width: '80px',
              height: '36px',
              borderRadius: '8px',
              background: animationMode === mode ? '#667eea' : '#2D2D44',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              boxShadow:
                animationMode === mode
                  ? '0 4px 20px rgba(102, 126, 234, 0.5)'
                  : '0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (animationMode !== mode) {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '14px' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          input {
            width: 90% !important;
            max-width: 90% !important;
          }
        }
        
        input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default App;
