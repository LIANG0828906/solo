import { useGameStore } from '../store/gameStore';

function UpgradePanel() {
  const snapshot = useGameStore((s) => s.snapshot);
  const selectUpgrade = useGameStore((s) => s.selectUpgrade);

  if (!snapshot || snapshot.gameState !== 'wave_end') return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: '#CC000000',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 24, fontFamily: 'monospace', fontWeight: 'bold' }}>
          波次 {snapshot.wave} 完成!
        </div>
        <div style={{ color: '#FFD700', fontSize: 16, fontFamily: 'monospace' }}>
          能量碎片: {snapshot.fragmentCount}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {snapshot.upgradeOptions.map((opt, i) => {
            const canAfford = snapshot.fragmentCount >= opt.fragmentCost;
            return (
              <div
                key={i}
                onClick={() => canAfford && selectUpgrade(i)}
                style={{
                  width: 200,
                  height: 120,
                  background: canAfford
                    ? 'linear-gradient(135deg, #2A2A4A, #1E1E2E)'
                    : 'linear-gradient(135deg, #1A1A2A, #12121E)',
                  border: `1px solid ${canAfford ? '#6C63FF' : '#333'}`,
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  opacity: canAfford ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (canAfford) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = '#FF6B6B';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = canAfford ? '#6C63FF' : '#333';
                }}
              >
                <div style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 8 }}>
                  {opt.name}
                </div>
                <div style={{ color: '#AAAAAA', fontSize: 13, fontFamily: 'monospace', marginBottom: 8 }}>
                  {opt.description}
                </div>
                <div style={{ color: '#FFD700', fontSize: 14, fontFamily: 'monospace' }}>
                  💎 {opt.fragmentCost}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GameOverScreen() {
  const snapshot = useGameStore((s) => s.snapshot);
  const restartGame = useGameStore((s) => s.restartGame);

  if (!snapshot || snapshot.gameState !== 'game_over') return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
      }}
    >
      <div
        style={{
          background: '#CC000000',
          borderRadius: 12,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ color: '#FF6B6B', fontSize: 36, fontFamily: 'monospace', fontWeight: 'bold' }}>
          游戏结束
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontFamily: 'monospace' }}>
          得分: {snapshot.score}
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontFamily: 'monospace' }}>
          击毁: {snapshot.kills}
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 18, fontFamily: 'monospace' }}>
          存活波次: {snapshot.wave}
        </div>
        <button
          onClick={restartGame}
          style={{
            width: 200,
            height: 48,
            background: '#6C63FF',
            color: '#FFFFFF',
            fontSize: 18,
            fontFamily: 'monospace',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.2s',
            marginTop: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#7B73FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6C63FF';
          }}
        >
          重新开始
        </button>
      </div>
    </div>
  );
}

export default function HUD() {
  const snapshot = useGameStore((s) => s.snapshot);

  if (!snapshot) return null;

  const hearts = [];
  for (let i = 0; i < snapshot.player.maxHealth; i++) {
    hearts.push(
      <span
        key={i}
        style={{
          color: i < snapshot.player.health ? '#FF4444' : '#333',
          fontSize: 18,
          marginRight: 4,
        }}
      >
        ♥
      </span>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 5,
          fontFamily: 'monospace',
          color: '#FFFFFF',
          fontSize: 18,
          lineHeight: 1.6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>{hearts}</div>
        <div>得分: {snapshot.score}</div>
        <div style={{ color: '#FFD700' }}>💎 {snapshot.fragmentCount}</div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 5,
          fontFamily: 'monospace',
          color: '#FFFFFF',
          fontSize: 32,
          textShadow: '0 0 10px rgba(108,99,255,0.6), 0 0 20px rgba(108,99,255,0.3)',
        }}
      >
        波次 {snapshot.wave}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 36,
          background: '#1A1A2ECC',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
          zIndex: 5,
          fontFamily: 'monospace',
          fontSize: 13,
          color: '#8888AA',
        }}
      >
        <span>W/A/S/D 移动</span>
        <span>│</span>
        <span>空格 射击</span>
      </div>

      <UpgradePanel />
      <GameOverScreen />
    </>
  );
}
