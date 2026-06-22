import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiSquare,
  FiDownload,
  FiPlus,
  FiCheck
} from 'react-icons/fi';

interface ControlBarProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onExport: () => void;
  onAddTrack: () => void;
  showExportBtn: boolean;
}

const ControlBar: React.FC<ControlBarProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onExport,
  onAddTrack,
  showExportBtn
}) => {
  const baseButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    transition: 'all 0.2s ease-out',
    color: '#CDD6F4',
    position: 'relative',
    fontSize: 14,
    fontWeight: 500,
    gap: 8
  };

  return (
    <div style={{
      background: '#2D2D44',
      borderTop: '1px solid #45475A',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      height: 72,
      flexShrink: 0,
      position: 'relative',
      zIndex: 10
    }}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isPlaying ? onPause : onPlay}
        style={{
          ...baseButtonStyle,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#27AE60',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#2ECC71')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#27AE60')}
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? (
          <>
            <FiPause size={22} />
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid #27AE60',
                pointerEvents: 'none'
              }}
            />
          </>
        ) : (
          <FiPlay size={22} style={{ marginLeft: 3 }} />
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStop}
        style={{
          ...baseButtonStyle,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#1E1E2E',
          border: '1px solid #45475A'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFFFF20')}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#1E1E2E';
        }}
        title="停止"
      >
        <FiSquare size={16} color="#E74C3C" />
      </motion.button>

      <div style={{ width: 1, height: 32, background: '#45475A', margin: '0 8px' }} />

      <motion.button
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddTrack}
        style={{
          ...baseButtonStyle,
          height: 44,
          padding: '0 16px',
          background: '#1E1E2E',
          border: '1px solid #45475A'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFFFF20')}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#1E1E2E';
        }}
        title="新建轨道"
      >
        <FiPlus size={16} color="#F4D03F" />
        <span>新建轨道</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05, x: 2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onExport}
        style={{
          ...baseButtonStyle,
          height: 44,
          padding: '0 16px',
          background: '#1E1E2E',
          border: '1px solid #45475A'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFFFF20')}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#1E1E2E';
        }}
        title="导出 JSON"
      >
        <FiDownload size={16} color="#3498DB" />
        <span>导出乐谱</span>
      </motion.button>

      <AnimatePresence>
        {showExportBtn && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              bottom: 88,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#27AE60',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 20px rgba(39, 174, 96, 0.4)',
              fontSize: 13,
              fontWeight: 500,
              zIndex: 50,
              pointerEvents: 'none'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FiCheck size={14} />
            </motion.div>
            乐谱文件已生成并下载
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ControlBar;
