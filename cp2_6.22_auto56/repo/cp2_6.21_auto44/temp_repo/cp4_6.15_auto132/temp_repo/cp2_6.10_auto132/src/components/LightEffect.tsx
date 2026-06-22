import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLampStore } from '../store/lampStore';

export const LightEffect: React.FC = () => {
  const { brightness, speed } = useLampStore();

  const glowRadius = useMemo(() => {
    return 60 + (brightness / 100) * 240;
  }, [brightness]);

  const glowOpacity = useMemo(() => {
    return 0.1 + (brightness / 100) * 0.7;
  }, [brightness]);

  const flickerDuration = useMemo(() => {
    return 2 - (speed / 100) * 1.8;
  }, [speed]);

  const flameKeyframes = `
    @keyframes flameFlicker {
      0% { transform: scale(1) translateY(0); opacity: 0.9; }
      8.33% { transform: scale(1.05) translateY(-2px); opacity: 1; }
      16.66% { transform: scale(0.95) translateY(1px); opacity: 0.85; }
      25% { transform: scale(1.08) translateY(-3px); opacity: 0.95; }
      33.33% { transform: scale(0.92) translateY(2px); opacity: 0.8; }
      41.66% { transform: scale(1.03) translateY(-1px); opacity: 1; }
      50% { transform: scale(0.98) translateY(0); opacity: 0.9; }
      58.33% { transform: scale(1.06) translateY(-2px); opacity: 0.95; }
      66.66% { transform: scale(0.94) translateY(1px); opacity: 0.85; }
      75% { transform: scale(1.07) translateY(-3px); opacity: 1; }
      83.33% { transform: scale(0.93) translateY(2px); opacity: 0.8; }
      91.66% { transform: scale(1.04) translateY(-1px); opacity: 0.95; }
      100% { transform: scale(1) translateY(0); opacity: 0.9; }
    }
  `;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      <style>{flameKeyframes}</style>

      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: glowRadius * 2,
          height: glowRadius * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255, 183, 77, ${glowOpacity}) 0%, rgba(230, 81, 0, ${glowOpacity * 0.5}) 40%, rgba(230, 81, 0, 0) 70%)`,
          filter: 'blur(10px)',
          willChange: 'width, height, opacity'
        }}
        animate={{
          scale: [1, 1.02, 0.98, 1.01, 1],
          opacity: [glowOpacity, glowOpacity * 1.1, glowOpacity * 0.9, glowOpacity]
        }}
        transition={{
          duration: flickerDuration,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: glowRadius,
          height: glowRadius,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255, 165, 0, ${glowOpacity * 0.8}) 0%, rgba(255, 69, 0, ${glowOpacity * 0.4}) 50%, transparent 100%)`,
          filter: 'blur(5px)',
          willChange: 'width, height'
        }}
        animate={{
          scale: [1, 1.05, 0.97, 1.03, 1]
        }}
        transition={{
          duration: flickerDuration * 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.1
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '40px',
          height: '60px',
          animation: `flameFlicker ${flickerDuration}s ease-in-out infinite`
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#ffeb3b',
            boxShadow: '0 0 15px #ffeb3b, 0 0 30px #ffc107',
            zIndex: 3
          }}
        />
        <svg
          width="40"
          height="50"
          viewBox="0 0 40 50"
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '0',
            filter: 'drop-shadow(0 0 8px rgba(255, 165, 0, 0.8))'
          }}
        >
          <defs>
            <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffa500" />
              <stop offset="30%" stopColor="#ff8c00" />
              <stop offset="60%" stopColor="#ff4500" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path
            d="M20 0 C28 10, 35 20, 32 32 C30 40, 25 45, 20 50 C15 45, 10 40, 8 32 C5 20, 12 10, 20 0 Z"
            fill="url(#flameGradient)"
          />
          <path
            d="M20 10 C25 18, 29 25, 27 33 C25 40, 22 43, 20 46 C18 43, 15 40, 13 33 C11 25, 15 18, 20 10 Z"
            fill="#ffff8d"
            opacity="0.6"
          />
          <ellipse cx="20" cy="40" rx="5" ry="4" fill="#fff" opacity="0.8" />
        </svg>
      </div>

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#ffeb3b',
            boxShadow: '0 0 6px #ffc107'
          }}
          animate={{
            x: [0, Math.cos(i * Math.PI / 4) * glowRadius * 0.8],
            y: [0, Math.sin(i * Math.PI / 4) * glowRadius * 0.8 - 20],
            opacity: [0.8, 0],
            scale: [1, 0.5]
          }}
          transition={{
            duration: flickerDuration * 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
};
