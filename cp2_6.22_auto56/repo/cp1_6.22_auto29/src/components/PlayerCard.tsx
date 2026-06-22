import { Player } from '../types';

interface Props {
  player: Player;
  isMe: boolean;
  isCurrent: boolean;
  index: number;
}

function hashColor(seed: number) {
  const h = (seed * 137.5) % 360;
  const h2 = (h + 40 + seed % 60) % 360;
  const h3 = (h2 + 80) % 360;
  return `linear-gradient(135deg, hsl(${h}, 55%, 35%), hsl(${h2}, 60%, 45%), hsl(${h3}, 55%, 40%))`;
}

const AVATAR_PATTERNS = [
  '竹', '梅', '兰', '菊', '松', '鹤', '云', '月', '琴', '剑', '诗', '酒', '山', '水', '风', '雨',
];

export default function PlayerCard({ player, isMe, isCurrent, index }: Props) {
  const pattern = AVATAR_PATTERNS[player.avatarSeed % AVATAR_PATTERNS.length];
  const gradient = hashColor(player.avatarSeed);

  const size = 64;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 3;

  return (
    <div
      className={`player-card ${isCurrent ? 'answering' : ''}`}
      style={
        {
          animationDelay: `${index * 0.08}s`,
          ['--profile-gradient' as any]: gradient,
        } as React.CSSProperties
      }
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ margin: '0 auto 0.6rem', display: 'block' }}>
        <defs>
          <linearGradient id={`grad-${player.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={player.isHost ? '#d4a84a' : '#ebe3d0'} />
            <stop offset="100%" stopColor={player.isHost ? '#b88c2f' : '#d9ccaf'} />
          </linearGradient>
          <radialGradient id={`bg-${player.id}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fdfaf3" />
            <stop offset="100%" stopColor="#ebe3d0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#bg-${player.id})`} stroke="#1a1a1a" strokeWidth="1.5" />
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontFamily="'Ma Shan Zheng', 'STKaiti', serif"
          fontSize="30"
          fill="#1a1a1a"
          style={{ filter: 'drop-shadow(1px 1px 0 rgba(201,48,44,0.15))' }}
        >
          {pattern}
        </text>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`url(#grad-${player.id})`} strokeWidth="2.5" opacity="0.85" />
      </svg>

      {player.isHost && <span className="host-badge">房主</span>}

      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', wordBreak: 'break-all' }}>
        {player.nickname}
        {isMe && (
          <span style={{
            marginLeft: 4,
            fontSize: '0.7rem',
            color: '#c9302c',
            fontWeight: 700,
          }}>
            (我)
          </span>
        )}
      </div>

      <span className={`status-badge ${player.status}`}>
        {isCurrent ? '出题中' : player.status === 'waiting' ? '等候中' : '作答中'}
      </span>
    </div>
  );
}
