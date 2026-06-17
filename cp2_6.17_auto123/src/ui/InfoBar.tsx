import { useGameStore } from '../store/store';

export function InfoBar() {
  const wave = useGameStore((state) => state.wave);
  const totalWaves = useGameStore((state) => state.totalWaves);
  const gold = useGameStore((state) => state.gold);
  const lives = useGameStore((state) => state.lives);
  const monsters = useGameStore((state) => state.monsters);
  const waveActive = useGameStore((state) => state.waveActive);
  const startWave = useGameStore((state) => state.startWave);
  const gameOver = useGameStore((state) => state.gameOver);
  const victory = useGameStore((state) => state.victory);
  const fps = useGameStore((state) => state.fps);

  const canStartWave = !waveActive && !gameOver && !victory && wave < totalWaves;

  return (
    <div
      style={{
        height: 60,
        backgroundColor: '#1A1A10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '0 24px',
        color: '#C0C0C0',
        fontFamily: 'monospace',
        fontSize: 16,
        borderBottom: '2px solid #3A3A2A',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#6B8E23' }}>波次:</span>
        <span style={{ color: '#FFD700' }}>{wave}</span>
        <span>/</span>
        <span>{totalWaves}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#FFD700' }}>金币:</span>
        <span style={{ color: '#FFD700' }}>{gold}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#FF4444' }}>生命:</span>
        <span style={{ color: '#FF4444' }}>{lives}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#8B4513' }}>怪物:</span>
        <span>{monsters.length}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.6 }}>
        <span>FPS:</span>
        <span>{fps.toFixed(0)}</span>
      </div>

      <button
        onClick={startWave}
        disabled={!canStartWave}
        style={{
          width: 160,
          height: 44,
          backgroundColor: canStartWave ? '#6B8E23' : '#4A4A3A',
          color: '#FFFFFF',
          fontSize: 16,
          fontFamily: 'monospace',
          border: 'none',
          borderRadius: 4,
          cursor: canStartWave ? 'pointer' : 'not-allowed',
          transition: 'transform 0.1s, background-color 0.1s',
        }}
        onMouseDown={(e) => {
          if (canStartWave) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          if (canStartWave) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6B8E23';
          }
        }}
        onMouseEnter={(e) => {
          if (canStartWave) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#556B2F';
          }
        }}
      >
        {waveActive ? '进行中...' : wave >= totalWaves ? '已完成' : '开始'}
      </button>
    </div>
  );
}
