import { useGameStore } from '@/store/gameStore';

export default function StatsPanel() {
  const matchResults = useGameStore(s => s.matchResults);
  const targetBlocks = useGameStore(s => s.targetBlocks);
  const history = useGameStore(s => s.history);
  const reset = useGameStore(s => s.reset);

  const completion = targetBlocks.length > 0
    ? matchResults.length / targetBlocks.length
    : 0;

  const avgDeltaE = matchResults.length > 0
    ? matchResults.reduce((sum, r) => sum + r.deltaE, 0) / matchResults.length
    : 0;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - completion);

  const recentHistory = history.slice(-7);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      padding: '16px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          <circle
            cx={60} cy={60} r={radius}
            fill="none"
            stroke="#e8e4dc"
            strokeWidth={8}
          />
          <circle
            cx={60} cy={60} r={radius}
            fill="none"
            stroke="#4ECDC4"
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <text x={60} y={54} textAnchor="middle" fontSize={16} fontWeight={600} fill="#333">
            {Math.round(completion * 100)}%
          </text>
          <text x={60} y={72} textAnchor="middle" fontSize={11} fill="#888">
            ΔE {avgDeltaE.toFixed(1)}
          </text>
        </svg>
        <button
          onClick={reset}
          style={{
            background: '#FF6B6B',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '8px 20px',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#E55A5A'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#FF6B6B'}
        >
          重置
        </button>
      </div>
      {recentHistory.length > 0 && (
        <div
          className="history-scroll"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            maxWidth: '100%',
            padding: '4px 0',
          }}
        >
          {recentHistory.map((record, i) => (
            <div
              key={i}
              style={{
                minWidth: 120,
                height: 80,
                background: '#FFFFFF',
                borderRadius: 8,
                boxShadow: '0 1px 4px #00000010',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, color: '#999' }}>{record.date}</div>
              <div style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>ΔE {record.averageDeltaE.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{record.duration}s</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
