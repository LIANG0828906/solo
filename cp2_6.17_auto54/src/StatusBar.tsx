import { useGameStore } from './gameStore';

export default function StatusBar() {
  const { turn, turnDuration, turnStartTime, players, currentPlayerId } = useGameStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  
  const elapsed = (Date.now() - turnStartTime) / 1000;
  const remaining = Math.max(0, turnDuration - elapsed);
  const remainingSeconds = Math.ceil(remaining);

  const hpPercent = currentPlayer ? (currentPlayer.hp / currentPlayer.maxHp) * 100 : 0;
  const energyPercent = currentPlayer ? (currentPlayer.energy / currentPlayer.maxEnergy) * 100 : 0;

  return (
    <div
      style={{
        height: 60,
        backgroundColor: '#1A252F',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '2px solid #1ABC9C',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>
          回合 <span style={{ color: '#1ABC9C', fontWeight: 'bold', fontSize: 20 }}>{turn}</span>
        </div>
        <div style={{ fontSize: 14, color: '#BDC3C7' }}>
          当前玩家：<span style={{ color: '#1ABC9C' }}>{currentPlayer?.name || '-'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: '#BDC3C7' }}>剩余时间</span>
          <span
            style={{
              color: '#E74C3C',
              fontWeight: 'bold',
              fontSize: 22,
              minWidth: 40,
              textAlign: 'center',
            }}
          >
            {remainingSeconds}
          </span>
          <span style={{ fontSize: 14, color: '#BDC3C7' }}>秒</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, color: '#BDC3C7', display: 'flex', justifyContent: 'space-between', width: 200 }}>
            <span>生命值</span>
            <span style={{ color: '#E74C3C' }}>{currentPlayer?.hp || 0} / {currentPlayer?.maxHp || 100}</span>
          </div>
          <div
            style={{
              width: 200,
              height: 20,
              backgroundColor: '#1A252F',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${hpPercent}%`,
                backgroundColor: '#E74C3C',
                transition: 'width 0.3s ease',
                boxShadow: '0 0 10px rgba(231,76,60,0.5)',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, color: '#BDC3C7', display: 'flex', justifyContent: 'space-between', width: 200 }}>
            <span>能量</span>
            <span style={{ color: '#3498DB' }}>{Math.floor(currentPlayer?.energy || 0)} / {currentPlayer?.maxEnergy || 100}</span>
          </div>
          <div
            style={{
              width: 200,
              height: 20,
              backgroundColor: '#1A252F',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${energyPercent}%`,
                backgroundColor: '#3498DB',
                transition: 'width 0.3s ease',
                boxShadow: '0 0 10px rgba(52,152,219,0.5)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
