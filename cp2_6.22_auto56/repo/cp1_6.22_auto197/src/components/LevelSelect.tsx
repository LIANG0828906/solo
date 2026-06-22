import { LEVELS } from '../levelData';

interface LevelSelectProps {
  completedLevels: Set<number>;
  onSelectLevel: (id: number) => void;
  onBack: () => void;
}

export default function LevelSelect({ completedLevels, onSelectLevel, onBack }: LevelSelectProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 40,
        maxWidth: '100%'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 40
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            color: '#A0AEC0',
            backgroundColor: 'rgba(226, 232, 240, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.15)',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E2E8F0';
            e.currentTarget.style.backgroundColor = 'rgba(226, 232, 240, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#A0AEC0';
            e.currentTarget.style.backgroundColor = 'rgba(226, 232, 240, 0.08)';
          }}
        >
          ← 返回
        </button>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#E2E8F0',
            margin: 0,
            letterSpacing: 2
          }}
        >
          选择关卡
        </h2>
        <div style={{ width: 78 }} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 120px)',
          gap: 24,
          justifyContent: 'center',
          maxWidth: 800
        }}
      >
        {LEVELS.map((level) => (
          <LevelCard
            key={level.id}
            id={level.id}
            name={level.name}
            completed={completedLevels.has(level.id)}
            onClick={() => onSelectLevel(level.id)}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: 48,
          padding: 16,
          backgroundColor: 'rgba(99, 179, 237, 0.1)',
          border: '1px solid rgba(99, 179, 237, 0.2)',
          borderRadius: 12,
          maxWidth: 500
        }}
      >
        <p style={{ color: '#A0AEC0', fontSize: 13, margin: 0, textAlign: 'center' }}>
          💡 提示：按 <span style={{ color: '#63B3ED', fontWeight: 600 }}>T</span> 键开始记录时间线，
          走到压力板位置后再次按 <span style={{ color: '#63B3ED', fontWeight: 600 }}>T</span> 回到起点，
          你的分身会帮你踩住压力板！
        </p>
      </div>
    </div>
  );
}

interface LevelCardProps {
  id: number;
  name: string;
  completed: boolean;
  onClick: () => void;
}

function LevelCard({ id, name, completed, onClick }: LevelCardProps) {
  const colors = [
    { bg: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)', accent: '#68D391' },
    { bg: 'linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)', accent: '#90CDF4' },
    { bg: 'linear-gradient(135deg, #B794F4 0%, #9F7AEA 100%)', accent: '#D6BCFA' }
  ];
  const color = colors[(id - 1) % colors.length];

  return (
    <div
      onClick={onClick}
      style={{
        width: 120,
        height: 160,
        borderRadius: 8,
        backgroundColor: '#2D3748',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
      }}
    >
      <div
        style={{
          height: 80,
          background: color.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          {id}
        </span>
        {completed && (
          <svg
            width="50"
            height="50"
            viewBox="0 0 50 50"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          >
            <defs>
              <clipPath id={`diag-${id}`}>
                <path d="M0,0 L50,0 L50,12 L12,50 L0,50 Z" />
              </clipPath>
            </defs>
            <rect
              x="0" y="0" width="50" height="50"
              fill="#68D391"
              clipPath={`url(#diag-${id})`}
              opacity="0.85"
            />
            <path
              d="M35,10 L40,15 L15,40 L10,35 Z"
              fill="white"
              opacity="0.95"
            />
          </svg>
        )}
      </div>
      <div
        style={{
          flex: 1,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: color.accent,
            fontWeight: 600,
            marginBottom: 4
          }}
        >
          LEVEL {id}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#E2E8F0',
            fontWeight: 500,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {name.split(' · ')[1] || name}
        </div>
      </div>
    </div>
  );
}
