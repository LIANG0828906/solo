import React from 'react';

interface GameStatsProps {
  time: number;
  matchedCount: number;
  totalPairs: number;
  combo: number;
}

const GameStats: React.FC<GameStatsProps> = ({ time, matchedCount, totalPairs, combo }) => {
  const itemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 500,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#4FD1C5',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div style={{
      height: '64px',
      background: '#1A202C',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={itemStyle}>
        <span style={labelStyle}>⏱️ 用时</span>
        <span style={valueStyle}>{time.toFixed(1)}s</span>
      </div>
      <div style={{ width: '1px', height: '32px', background: '#2D3748' }} />
      <div style={itemStyle}>
        <span style={labelStyle}>✅ 配对</span>
        <span style={valueStyle}>{matchedCount}/{totalPairs}</span>
      </div>
      <div style={{ width: '1px', height: '32px', background: '#2D3748' }} />
      <div style={itemStyle}>
        <span style={labelStyle}>🔥 连击</span>
        <span style={{ ...valueStyle, color: combo >= 3 ? '#F6AD55' : '#4FD1C5' }}>
          {combo}x
        </span>
      </div>
    </div>
  );
};

export default GameStats;
