import React from 'react';

interface WaveInfoProps {
  currentWave: number;
  waveInProgress: boolean;
  onStartWave: () => void;
}

const WaveInfo: React.FC<WaveInfoProps> = ({
  currentWave,
  waveInProgress,
  onStartWave,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#4A3B32',
        padding: 16,
        borderRadius: 4,
        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        minWidth: 240,
      }}
    >
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '2px solid #D35400',
        }}
      >
        <h3 style={{ color: '#D35400', fontSize: 12, margin: 0 }}>波次信息</h3>
      </div>

      <div style={{ fontSize: 10, color: '#E8D5B7', marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>当前波次: {currentWave} / 10</div>
        <div>
          状态:{' '}
          <span style={{ color: waveInProgress ? '#E74C3C' : '#2ECC71' }}>
            {waveInProgress ? '进行中' : '准备中'}
          </span>
        </div>
      </div>

      <button
        onClick={onStartWave}
        disabled={waveInProgress || currentWave >= 10}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: waveInProgress || currentWave >= 10 ? '#3A3A3A' : '#D35400',
          border: '2px solid #2C1810',
          borderRadius: 4,
          color: waveInProgress || currentWave >= 10 ? '#666' : '#E8D5B7',
          fontSize: 10,
          fontFamily: "'Press Start 2P', sans-serif",
          cursor: waveInProgress || currentWave >= 10 ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          transform: 'translateY(0)',
        }}
        onMouseEnter={(e) => {
          if (!waveInProgress && currentWave < 10) {
            e.currentTarget.style.backgroundColor = '#555555';
          }
        }}
        onMouseLeave={(e) => {
          if (!waveInProgress && currentWave < 10) {
            e.currentTarget.style.backgroundColor = '#D35400';
          }
        }}
        onMouseDown={(e) => {
          if (!waveInProgress && currentWave < 10) {
            e.currentTarget.style.transform = 'translateY(2px)';
          }
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {currentWave >= 10 ? '已完成' : waveInProgress ? '战斗中...' : '开始下一波'}
      </button>

      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '2px solid #D35400',
        }}
      >
        <h4 style={{ color: '#D35400', fontSize: 10, marginBottom: 12 }}>怪物图鉴</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 8, color: '#95A5A6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>💀</span>
            <span>骷髅兵 - HP:50 速:2 金:5</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🗿</span>
            <span>石巨人 - HP:200 速:0.8 金:15</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>👻</span>
            <span>幽灵 - HP:30 速:3 物免 金:10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveInfo;
