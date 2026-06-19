import React from 'react';
import { motion } from 'framer-motion';
import type { Theme } from '../types';
import { THEMES } from '../types';

interface ThemeSwitcherProps {
  currentThemeId: string;
  onThemeChange: (theme: Theme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentThemeId,
  onThemeChange
}) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        width: '100%',
        height: 60,
        backgroundColor: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '0 24px',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 2,
            background: 'linear-gradient(90deg, #FF00FF, #00D4FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          NEON STUDIO
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#555555',
            letterSpacing: 1,
            textTransform: 'uppercase'
          }}
        >
          霓虹灯艺术工作室
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        {THEMES.map((theme) => {
          const isActive = theme.id === currentThemeId;
          return (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onThemeChange(theme)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 10,
                backgroundColor: isActive ? '#1F1F1F' : 'transparent',
                border: isActive
                  ? `1px solid ${theme.primaryColor}60`
                  : '1px solid rgba(255,255,255,0.06)',
                boxShadow: isActive
                  ? `0 0 12px ${theme.primaryColor}30`
                  : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 2
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: theme.primaryColor,
                    boxShadow: `0 0 6px ${theme.primaryColor}CC`
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: theme.glowColor,
                    boxShadow: `0 0 6px ${theme.glowColor}CC`
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isActive ? '#FFFFFF' : '#888888',
                  letterSpacing: 0.5
                }}
              >
                {theme.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          right: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          color: '#555555',
          letterSpacing: 0.5
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#00FF41',
            boxShadow: '0 0 4px #00FF41',
            animation: 'pulse 2s infinite'
          }}
        />
        <span>就绪</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </motion.div>
  );
};

export default ThemeSwitcher;
