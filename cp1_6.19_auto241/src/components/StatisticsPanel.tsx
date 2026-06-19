import React from 'react';
import { motion } from 'framer-motion';
import { useSimulationStore } from '../store';

const StatisticsPanel: React.FC = () => {
  const {
    totalRainfall,
    totalEvaporated,
    totalInfiltrated,
    activeParticles,
    reset,
  } = useSimulationStore();

  const panelStyle: React.CSSProperties = {
    backgroundColor: 'rgba(44, 62, 80, 0.8)',
    borderRadius: '12px',
    padding: '16px',
    color: '#ECF0F1',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#BDC3C7',
    fontWeight: 500,
  };

  const resetButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 16px',
    backgroundColor: '#E74C3C',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s ease',
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={panelStyle}
    >
      <h3 style={titleStyle}>数据统计</h3>
      
      <div style={statItemStyle}>
        <span style={statLabelStyle}>累计降水量</span>
        <motion.span
          key={totalRainfall}
          initial={{ scale: 1.2, color: '#3498DB' }}
          animate={{ scale: 1, color: '#3498DB' }}
          style={{ fontSize: '16px', fontWeight: 700, color: '#3498DB' }}
        >
          {formatNumber(totalRainfall)} 滴
        </motion.span>
      </div>

      <div style={statItemStyle}>
        <span style={statLabelStyle}>已蒸发量</span>
        <motion.span
          key={totalEvaporated}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{ fontSize: '16px', fontWeight: 700, color: '#ECF0F1' }}
        >
          {formatNumber(totalEvaporated)} 滴
        </motion.span>
      </div>

      <div style={statItemStyle}>
        <span style={statLabelStyle}>已渗透量</span>
        <motion.span
          key={totalInfiltrated}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{ fontSize: '16px', fontWeight: 700, color: '#95A5A6' }}
        >
          {formatNumber(totalInfiltrated)} 滴
        </motion.span>
      </div>

      <div style={statItemStyle}>
        <span style={statLabelStyle}>当前存留粒子</span>
        <motion.span
          key={activeParticles}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{ fontSize: '16px', fontWeight: 700, color: '#1ABC9C' }}
        >
          {formatNumber(activeParticles)} 颗
        </motion.span>
      </div>

      <motion.button
        style={resetButtonStyle}
        onClick={reset}
        whileHover={{ backgroundColor: '#C0392B', scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        🔄 重置
      </motion.button>
    </motion.div>
  );
};

export default StatisticsPanel;
