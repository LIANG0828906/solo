import { useGameStore } from './store';
import { COLOR_NAMES, COLORS, ColorTarget } from './gameEngine';

function ProgressBar({ target, progress, color, name }: { target: ColorTarget; progress: number; color: string; name: string }) {
  const pct = Math.min(100, (progress / target.target) * 100);

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
        <span style={{ color, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {name}
        </span>
        <span style={{ color: '#aaa', fontSize: '12px' }}>
          {progress} / {target.target}
        </span>
      </div>
      <div
        style={{
          height: '20px',
          borderRadius: '4px',
          border: `2px solid ${color}`,
          background: 'transparent',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="progress-fill"
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function ScorePanel() {
  const score = useGameStore(s => s.score);
  const level = useGameStore(s => s.level);
  const targets = useGameStore(s => s.targets);
  const progress = useGameStore(s => s.progress);
  const isWin = useGameStore(s => s.isWin);
  const nextLevel = useGameStore(s => s.nextLevel);
  const resetGame = useGameStore(s => s.resetGame);

  return (
    <div
      style={{
        width: '220px',
        background: '#16213E',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        border: '1px solid #2C3E50',
      }}
    >
      <div>
        <div style={{ color: '#8892b0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
          Level
        </div>
        <div style={{ color: '#00D2D3', fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>
          {level}
        </div>
      </div>

      <div style={{ height: '1px', background: '#2C3E50' }} />

      <div>
        <div style={{ color: '#8892b0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
          Score
        </div>
        <div style={{ color: '#fff', fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>
          {score.toLocaleString()}
        </div>
      </div>

      <div style={{ height: '1px', background: '#2C3E50' }} />

      <div>
        <div style={{ color: '#8892b0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
          Targets
        </div>
        {targets.map((t, i) => (
          <ProgressBar
            key={i}
            target={t}
            progress={progress[t.color] || 0}
            color={t.color}
            name={t.name}
          />
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {isWin && (
        <button
          className="next-level-btn"
          onClick={nextLevel}
        >
          Next Level →
        </button>
      )}

      <button
        className="reset-btn"
        onClick={resetGame}
      >
        Reset Game
      </button>
    </div>
  );
}
