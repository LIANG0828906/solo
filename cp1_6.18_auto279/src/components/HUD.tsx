import { useGameStore } from '../store';

export default function HUD() {
  const { score, ship, timeRemaining, oreCounts, isPlaying, isGameOver } = useGameStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const shieldPercentage = (ship.shield / ship.maxShield) * 100;

  const getShieldColor = (percentage: number): string => {
    if (percentage > 60) return '#6BCB77';
    if (percentage > 30) return '#FFD93D';
    return '#FF6B6B';
  };

  if (!isPlaying && !isGameOver) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '10px',
        color: '#E0E0E0',
        minWidth: '200px',
        backdropFilter: 'blur(5px)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>
          分数
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#00E5FF',
            textShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
          }}
        >
          {score}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
          护盾
        </div>
        <div
          style={{
            width: '100%',
            height: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to right, #6BCB77, #FFD93D, #FF6B6B)',
              transformOrigin: 'left',
              transform: `scaleX(${shieldPercentage / 100})`,
              borderRadius: '6px',
              transition: 'transform 0.3s ease',
            }}
          />
        </div>
        <div
          style={{
            fontSize: '12px',
            marginTop: '4px',
            color: getShieldColor(shieldPercentage),
            textAlign: 'right',
          }}
        >
          {ship.shield}/{ship.maxShield}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>
          剩余时间
        </div>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#FF6B6B',
            textShadow: '0 0 10px rgba(255, 107, 107, 0.5)',
          }}
        >
          {formatTime(timeRemaining)}
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px' }}>
        <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
          矿石收集
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#FF6B6B',
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '13px' }}>红色矿石</span>
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{oreCounts.red}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#FFD93D',
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '13px' }}>黄色矿石</span>
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{oreCounts.yellow}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#6BCB77',
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '13px' }}>绿色矿石</span>
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{oreCounts.green}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#4D96FF',
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '13px' }}>蓝色矿石</span>
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{oreCounts.blue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
