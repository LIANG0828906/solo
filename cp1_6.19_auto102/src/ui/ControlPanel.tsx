import React, { useState, useEffect } from 'react';
import { useSceneStore, SwarmMode } from '../store/sceneStore';

const ControlPanel: React.FC = () => {
  const { swarmMode, setSwarmMode, resetScene, stats } = useSceneStore();
  const [modeAnim, setModeAnim] = useState(false);
  const [resetAnim, setResetAnim] = useState(false);
  const [gatherHover, setGatherHover] = useState(false);
  const [disperseHover, setDisperseHover] = useState(false);
  const [resetHover, setResetHover] = useState(false);

  useEffect(() => {
    setModeAnim(true);
    const t = setTimeout(() => setModeAnim(false), 300);
    return () => clearTimeout(t);
  }, [swarmMode]);

  const lighten = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  };

  const GATHER_COLOR = '#2ECC71';
  const DISPERSE_COLOR = '#E74C3C';
  const RESET_COLOR = '#7F8C8D';

  const handleReset = () => {
    setResetAnim(true);
    setTimeout(() => setResetAnim(false), 100);
    resetScene();
  };

  const handleModeChange = (mode: SwarmMode) => {
    if (mode !== swarmMode) {
      setSwarmMode(mode);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#2A2C2E',
    borderRadius: 12,
    padding: 20,
    boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const modeButtonStyle = (
    active: boolean,
    color: string,
    hover: boolean
  ): React.CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: `2px solid ${active ? color : '#555'}`,
    background: active ? color : hover ? lighten('#3A3C3E', 15) : '#3A3C3E',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    transform: active && modeAnim ? 'rotate(180deg)' : 'rotate(0deg)',
    padding: 0,
    flexShrink: 0,
  });

  const resetButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: resetHover ? lighten(RESET_COLOR, 15) : RESET_COLOR,
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'background 0.15s ease',
    transform: resetAnim ? 'scale(0.95)' : 'scale(1)',
  };

  const statsCardStyle: React.CSSProperties = {
    background: '#333538',
    borderRadius: 12,
    padding: 16,
    marginTop: 'auto',
  };

  const statRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    fontSize: 13,
  };

  const iconContainerStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    transition: 'transform 0.3s ease',
    transform: modeAnim ? 'rotate(180deg)' : 'rotate(0deg)',
  };

  return (
    <div className="control-panel-container">
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#ddd' }}>
          群体模式
        </div>
        <div style={buttonRowStyle}>
          <button
            style={modeButtonStyle(swarmMode === 'gather', GATHER_COLOR, gatherHover)}
            onMouseEnter={() => setGatherHover(true)}
            onMouseLeave={() => setGatherHover(false)}
            onClick={() => handleModeChange('gather')}
            title="聚集模式"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={swarmMode === 'gather' ? '#fff' : '#ccc'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div style={iconContainerStyle}>
            {swarmMode === 'gather' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GATHER_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="4" x2="10" y2="10"></line>
                <line x1="20" y1="4" x2="14" y2="10"></line>
                <line x1="4" y1="20" x2="10" y2="14"></line>
                <line x1="20" y1="20" x2="14" y2="14"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DISPERSE_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="10" y1="10" x2="4" y2="4"></line>
                <line x1="14" y1="10" x2="20" y2="4"></line>
                <line x1="10" y1="14" x2="4" y2="20"></line>
                <line x1="14" y1="14" x2="20" y2="20"></line>
              </svg>
            )}
          </div>

          <button
            style={modeButtonStyle(swarmMode === 'disperse', DISPERSE_COLOR, disperseHover)}
            onMouseEnter={() => setDisperseHover(true)}
            onMouseLeave={() => setDisperseHover(false)}
            onClick={() => handleModeChange('disperse')}
            title="分散模式"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={swarmMode === 'disperse' ? '#fff' : '#ccc'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#888' }}>
          {swarmMode === 'gather' ? '当前：聚集模式（点击地面设置目标点）' : '当前：分散模式（随机游走）'}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#ddd' }}>
          场景控制
        </div>
        <button
          style={resetButtonStyle}
          onMouseEnter={() => setResetHover(true)}
          onMouseLeave={() => setResetHover(false)}
          onClick={handleReset}
        >
          🔄 重置场景
        </button>
      </div>

      <div style={statsCardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#2ECC71' }}>
          统计数据
        </div>
        <div style={statRowStyle}>
          <span style={{ color: '#999' }}>个体数量</span>
          <span style={{ fontWeight: 600 }}>{stats.count}</span>
        </div>
        <div style={statRowStyle}>
          <span style={{ color: '#999' }}>平均速度</span>
          <span style={{ fontWeight: 600 }}>{stats.avgSpeed} u/s</span>
        </div>
        <div style={statRowStyle}>
          <span style={{ color: '#999' }}>已探索</span>
          <span style={{ fontWeight: 600 }}>{stats.exploredArea}%</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#666', textAlign: 'center', padding: 8 }}>
        💡 左键点击地面添加目标点
      </div>
    </div>
  );
};

export default ControlPanel;
