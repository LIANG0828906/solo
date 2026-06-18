import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiRefreshCw, FiStar, FiSettings } from 'react-icons/fi';

interface ControlPanelProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onExport: () => void;
  isExporting: boolean;
  isGenerated: boolean;
  particleCount: number;
  motionIntensity: number;
  onMotionIntensityChange?: (value: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  onReset,
  onExport,
  isExporting,
  isGenerated,
  particleCount,
  motionIntensity,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    onGenerate();
    setTimeout(() => setIsGenerating(false), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <motion.div
      className="control-panel"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '280px',
        backgroundColor: '#0F3460',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#E0E0E0',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div>
        <h3 style={{
          margin: 0,
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#E94560',
          fontFamily: '"Playfair Display", serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <FiStar /> 诗意文本
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入诗意文本，如：月光下的涟漪"
            rows={3}
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.6)',
              border: '1px solid #533483',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#E0E0E0',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#E94560';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#533483';
            }}
          />

          <motion.button
            whileHover={{ scale: prompt.trim() ? 1.02 : 1 }}
            whileTap={{ scale: prompt.trim() ? 0.98 : 1 }}
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            style={{
              backgroundColor: '#E94560',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: prompt.trim() && !isGenerating ? 'pointer' : 'not-allowed',
              opacity: prompt.trim() && !isGenerating ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease',
            }}
          >
            {isGenerating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <FiStar />
              </motion.div>
            ) : (
              <FiStar />
            )}
            {isGenerating ? '生成中...' : '生成画面'}
          </motion.button>
        </div>
      </div>

      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, #533483, transparent)',
      }} />

      <div>
        <h3 style={{
          margin: 0,
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#E94560',
          fontFamily: '"Playfair Display", serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <FiSettings /> 参数信息
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '13px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: 'rgba(26, 26, 46, 0.4)',
            borderRadius: '6px',
          }}>
            <span style={{ color: '#8892b0' }}>粒子数量</span>
            <span style={{ color: '#E0E0E0', fontWeight: 500 }}>
              {isGenerated ? particleCount : '--'}
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: 'rgba(26, 26, 46, 0.4)',
            borderRadius: '6px',
          }}>
            <span style={{ color: '#8892b0' }}>运动强度</span>
            <span style={{ color: '#E0E0E0', fontWeight: 500 }}>
              {isGenerated ? `${Math.round(motionIntensity * 100)}%` : '--'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <motion.button
          whileHover={{ scale: isGenerated && !isExporting ? 1.02 : 1 }}
          whileTap={{ scale: isGenerated && !isExporting ? 0.98 : 1 }}
          onClick={onExport}
          disabled={!isGenerated || isExporting}
          style={{
            backgroundColor: 'transparent',
            color: '#E94560',
            border: '1px solid #E94560',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: isGenerated && !isExporting ? 'pointer' : 'not-allowed',
            opacity: isGenerated && !isExporting ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (isGenerated && !isExporting) {
              e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {isExporting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <FiDownload />
            </motion.div>
          ) : (
            <FiDownload />
          )}
          {isExporting ? '导出中...' : '导出图片'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          style={{
            backgroundColor: 'transparent',
            color: '#8892b0',
            border: '1px solid #533483',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#E94560';
            e.currentTarget.style.color = '#E94560';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#533483';
            e.currentTarget.style.color = '#8892b0';
          }}
        >
          <FiRefreshCw /> 重置画布
        </motion.button>
      </div>

      <div style={{
        fontSize: '11px',
        color: '#533483',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        提示：拖拽平移画布 · 滚轮缩放
      </div>
    </motion.div>
  );
};
