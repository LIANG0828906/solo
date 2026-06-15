import { useEffect, useState } from 'react';
import { EventBus, StatsData } from '../bus/EventBus';

interface InfoPanelProps {
  bus: EventBus;
}

export default function InfoPanel({ bus }: InfoPanelProps) {
  const [stats, setStats] = useState<StatsData>({
    totalParticles: 0,
    aliveParticles: 0,
    gravitySources: 0,
    potentialEnergy: 0,
  });

  useEffect(() => {
    const unsub = bus.on('statsUpdate', (data) => {
      setStats(data as StatsData);
    });
    return unsub;
  }, [bus]);

  const handleReset = () => {
    bus.emit('reset');
  };

  const handleClear = () => {
    bus.emit('clear');
  };

  return (
    <div style={panelStyle}>
      <h2 style={titleStyle}>🌌 引力场监控</h2>

      <div style={dividerStyle} />

      <div style={statItemStyle}>
        <span style={statLabelStyle}>总粒子数量</span>
        <span style={statValueStyle}>{stats.totalParticles}</span>
      </div>

      <div style={statItemStyle}>
        <span style={statLabelStyle}>粒子存活数</span>
        <span style={{ ...statValueStyle, color: '#88ccff' }}>
          {stats.aliveParticles}
          <span style={{ ...smallStyle, color: '#666' }}>
            {' '}({((stats.aliveParticles / Math.max(stats.totalParticles, 1)) * 100).toFixed(1)}%)
          </span>
        </span>
      </div>

      <div style={statItemStyle}>
        <span style={statLabelStyle}>引力源数量</span>
        <span style={{ ...statValueStyle, color: '#ffcc88' }}>{stats.gravitySources}</span>
      </div>

      <div style={statItemStyle}>
        <span style={statLabelStyle}>系统势能</span>
        <span style={{ ...statValueStyle, color: '#cc88ff', fontSize: '14px' }}>
          {stats.potentialEnergy.toFixed(2)}
        </span>
      </div>

      <div style={dividerStyle} />

      <div style={{ padding: '0 8px' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px', lineHeight: '1.6' }}>
          💡 点击空白处放置引力源<br />
          ⏱️ 按住时间越长质量越大(10~50)<br />
          👆 点击选中后按 Delete 移除
        </div>
      </div>

      <div style={buttonContainerStyle}>
        <button style={buttonStyle} onClick={handleReset}>
          🔄 重置粒子
        </button>
        <button style={{ ...buttonStyle, background: 'rgba(255,80,80,0.3)', borderColor: 'rgba(255,100,100,0.5)' }} onClick={handleClear}>
          💥 清空引力源
        </button>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  left: '20px',
  top: '20px',
  width: '250px',
  background: 'rgba(20, 20, 35, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: '12px',
  padding: '20px',
  color: 'white',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  zIndex: 100,
  border: '1px solid rgba(100, 120, 200, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
  color: '#e0e8ff',
  textAlign: 'center',
  marginBottom: '4px',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(150,170,255,0.3), transparent)',
  margin: '12px 0',
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 4px',
  borderBottom: '1px solid rgba(100, 120, 200, 0.1)',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#a0a8c0',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#ffffff',
  fontVariantNumeric: 'tabular-nums',
};

const smallStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 400,
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '8px',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid rgba(100, 150, 255, 0.3)',
  borderRadius: '8px',
  background: 'rgba(60, 80, 160, 0.3)',
  color: 'white',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
};
