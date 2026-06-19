import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WarningTooltipProps {
  visible: boolean;
  nutrient: 'n' | 'p' | 'k';
  currentValue: number;
  threshold: number;
  recommendedFertilizer: string;
  onClose: () => void;
}

const NUTRIENT_NAMES: Record<string, string> = {
  n: '氮',
  p: '磷',
  k: '钾',
};

export const WarningTooltip: React.FC<WarningTooltipProps> = ({
  visible,
  nutrient,
  currentValue,
  threshold,
  recommendedFertilizer,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '20px',
              minWidth: '280px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              border: '2px solid #FFC107',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderBottom: '20px solid #FFC107',
                }}
              />
              <span style={{ fontWeight: 600, color: '#F57C00', fontSize: '16px' }}>
                养分预警
              </span>
            </div>

            <p style={{ margin: '8px 0', fontSize: '14px', color: '#333' }}>
              {NUTRIENT_NAMES[nutrient]}元素含量低于阈值
            </p>

            <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
              <div>当前含量：<strong style={{ color: '#F57C00' }}>{currentValue}%</strong></div>
              <div>最低阈值：{threshold}%</div>
            </div>

            <div
              style={{
                backgroundColor: '#FFF8E1',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 600, color: '#F57C00', marginBottom: '4px' }}>
                建议补充有机肥：
              </div>
              <div style={{ color: '#5D4037' }}>{recommendedFertilizer}</div>
            </div>

            <button
              onClick={onClose}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '8px 16px',
                backgroundColor: '#FFC107',
                color: '#5D4037',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              知道了
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
