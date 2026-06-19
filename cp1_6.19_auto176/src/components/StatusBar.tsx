import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnimationMode } from '../types';
import { ANIMATION_MODE_LABELS } from '../types';

interface StatusBarProps {
  segmentCount: number;
  animationMode: AnimationMode;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <polygon points="3,1 13,7 3,13" />
  </svg>
);

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="2" y="1" width="3.5" height="12" rx="0.8" />
    <rect x="8.5" y="1" width="3.5" height="12" rx="0.8" />
  </svg>
);

const StatusBar: React.FC<StatusBarProps> = ({
  segmentCount,
  animationMode,
  isPlaying,
  onTogglePlay
}) => {
  const modePlaying = animationMode !== 'static';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      style={{
        width: '100%',
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.67)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 24,
        paddingLeft: 20,
        paddingRight: 20,
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: segmentCount > 0 ? '#00FF41' : '#444444',
            boxShadow: segmentCount > 0 ? '0 0 8px #00FF41' : 'none'
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#CCCCCC',
            letterSpacing: 0.5
          }}
        >
          已绘制 {segmentCount} 段灯管
        </span>
      </div>

      <div
        style={{
          width: 1,
          height: 20,
          backgroundColor: 'rgba(255,255,255,0.1)'
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#888888',
            letterSpacing: 0.5
          }}
        >
          模式:
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={animationMode}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: modePlaying ? '#00D4FF' : '#AAAAAA',
              letterSpacing: 1
            }}
          >
            {ANIMATION_MODE_LABELS[animationMode]}
            {modePlaying && isPlaying && ' 进行中'}
            {modePlaying && !isPlaying && ' 已暂停'}
          </motion.span>
        </AnimatePresence>
      </div>

      <div style={{ marginLeft: 'auto' }}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onTogglePlay}
          disabled={!modePlaying}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: modePlaying
              ? (isPlaying ? '#FF007F' : '#00D4FF')
              : '#333333',
            color: modePlaying ? '#ffffff' : '#666666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: modePlaying
              ? (isPlaying ? '0 0 16px #FF007F80' : '0 0 16px #00D4FF80')
              : 'none',
            cursor: modePlaying ? 'pointer' : 'not-allowed',
            opacity: modePlaying ? 1 : 0.5
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isPlaying ? 'pause' : 'play'}
              initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StatusBar;
