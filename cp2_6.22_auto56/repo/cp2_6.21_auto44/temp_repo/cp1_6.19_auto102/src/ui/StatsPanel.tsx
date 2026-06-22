import React from 'react';
import { useSceneStore } from '../store/sceneStore';

const StatsPanel: React.FC = () => {
  const stats = useSceneStore((s) => s.stats);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'rgba(20, 20, 20, 0.75)',
    borderRadius: 12,
    padding: '16px 20px',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 13,
    zIndex: 10,
    backdropFilter: 'blur(8px)',
    minWidth: 180,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    gap: 16,
  };

  const labelStyle: React.CSSProperties = {
    color: '#aaa',
    fontWeight: 400,
  };

  const valueStyle: React.CSSProperties = {
    color: '#fff',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#2ECC71' }}>
        实时统计
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>个体数量</span>
        <span style={valueStyle}>{stats.count}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>平均速度</span>
        <span style={valueStyle}>{stats.avgSpeed} 单位/秒</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>已探索面积</span>
        <span style={valueStyle}>{stats.exploredArea}%</span>
      </div>
    </div>
  );
};

export default StatsPanel;
