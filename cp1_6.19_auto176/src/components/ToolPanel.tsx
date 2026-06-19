import React from 'react';
import { motion } from 'framer-motion';
import type { AnimationMode } from '../types';
import { ANIMATION_MODE_LABELS } from '../types';

interface ToolPanelProps {
  colorPalette: string[];
  currentColor: string;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onClear: () => void;
  animationMode: AnimationMode;
  onModeChange: (mode: AnimationMode) => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({
  colorPalette,
  currentColor,
  onColorChange,
  onUndo,
  onClear,
  animationMode,
  onModeChange
}) => {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        width: 200,
        backgroundColor: '#222222',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
      }}
    >
      <div>
        <h3
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#888888',
            marginBottom: 12,
            letterSpacing: 1,
            textTransform: 'uppercase'
          }}
        >
          画笔颜色
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10
          }}
        >
          {colorPalette.map((color, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.88, y: 2 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => onColorChange(color)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 16,
                backgroundColor: color,
                border: currentColor === color
                  ? `2px solid #ffffff`
                  : '2px solid transparent',
                boxShadow: currentColor === color
                  ? `0 0 12px ${color}, 0 0 24px ${color}80`
                  : `0 0 6px ${color}60`,
                transition: 'box-shadow 0.2s ease'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <motion.button
          whileHover={{ backgroundColor: '#333333' }}
          whileTap={{ scale: 0.96 }}
          onClick={onUndo}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: '#2B2B2B',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            border: '1px solid #3A3A3A'
          }}
        >
          ↩ 撤销
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: '#4A1F1F' }}
          whileTap={{ scale: 0.96 }}
          onClick={onClear}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: '#3A1F1F',
            color: '#FF8888',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            border: '1px solid #5A2F2F'
          }}
        >
          ✕ 清除画布
        </motion.button>
      </div>

      <div>
        <h3
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#888888',
            marginBottom: 12,
            letterSpacing: 1,
            textTransform: 'uppercase'
          }}
        >
          动画模式
        </h3>
        <select
          value={animationMode}
          onChange={(e) => onModeChange(e.target.value as AnimationMode)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: '#2B2B2B',
            color: '#ffffff',
            fontSize: 12,
            border: '1px solid #3A3A3A',
            outline: 'none',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {Object.entries(ANIMATION_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: 12,
          borderRadius: 8,
          backgroundColor: '#1F1F1F',
          border: '1px solid #2A2A2A'
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: '#666666',
            marginBottom: 4,
            letterSpacing: 1
          }}
        >
          当前主色
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              backgroundColor: currentColor,
              boxShadow: `0 0 8px ${currentColor}80`
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: '#AAAAAA',
              fontWeight: 600,
              fontFamily: 'monospace'
            }}
          >
            {currentColor.toUpperCase()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ToolPanel;
