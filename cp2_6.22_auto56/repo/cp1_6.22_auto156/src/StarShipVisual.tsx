import React from 'react';
import { SystemType } from './GameEngine';

interface StarShipVisualProps {
  systemStatus: Record<SystemType, number>;
}

const SYSTEM_COLORS: Record<SystemType, string> = {
  shield: '#66FCF1',
  weapon: '#F33535',
  engine: '#45A29E',
  lifeSupport: '#9457EB',
};

const SYSTEM_LABELS: Record<SystemType, string> = {
  shield: '护盾',
  weapon: '武器',
  engine: '引擎',
  lifeSupport: '生命维持',
};

const ShieldIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 24 24" width={28} height={28} fill="none">
    <path
      d="M12 2L3 6v6c0 5.25 3.75 9.5 9 11 5.25-1.5 9-5.75 9-11V6l-9-4z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
      fill={`${color}20`}
    />
    <path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WeaponIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 24 24" width={28} height={28} fill="none">
    <rect
      x="3" y="11"
      width="14" height="4"
      rx="1"
      stroke={color}
      strokeWidth={1.8}
      fill={`${color}20`}
    />
    <rect
      x="17" y="10"
      width="5" height="2"
      rx="0.5"
      stroke={color}
      strokeWidth={1.8}
      fill={`${color}20`}
    />
    <line
      x1="22" y1="9" x2="24" y2="9"
      stroke={color} strokeWidth={1.5} strokeLinecap="round"
    />
    <line
      x1="22" y1="13" x2="24" y2="13"
      stroke={color} strokeWidth={1.5} strokeLinecap="round"
    />
    <circle cx="7" cy="13" r="1.5" fill={color} />
  </svg>
);

const EngineIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 24 24" width={28} height={28} fill="none">
    <path
      d="M12 3C11 6 8 7 8 11C8 14 10 16 12 21C14 16 16 14 16 11C16 7 13 6 12 3Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
      fill={`${color}30`}
    />
    <path
      d="M12 8C11.5 10 10 11 10 13C10 14.5 11 16 12 18C13 16 14 14.5 14 13C14 11 12.5 10 12 8Z"
      fill={`${color}70`}
    />
  </svg>
);

const LifeSupportIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 24 24" width={28} height={28} fill="none">
    <path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
      fill={`${color}25`}
    />
  </svg>
);

const ICONS: Record<SystemType, React.FC<{ color: string }>> = {
  shield: ShieldIcon,
  weapon: WeaponIcon,
  engine: EngineIcon,
  lifeSupport: LifeSupportIcon,
};

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
};

const StarShipVisual: React.FC<StarShipVisualProps> = ({ systemStatus }) => {
  const systems: SystemType[] = ['shield', 'weapon', 'engine', 'lifeSupport'];
  const cx = 250;
  const cy = 220;
  const rOuter = 160;
  const rInner = 90;

  const hexPoints: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + rOuter * Math.cos(angle);
    const y = cy + rOuter * Math.sin(angle);
    hexPoints.push(`${x},${y}`);
  }
  const hexPath = hexPoints.join(' ');

  const innerPoints: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + rInner * Math.cos(angle);
    const y = cy + rInner * Math.sin(angle);
    innerPoints.push(`${x},${y}`);
  }
  const innerPath = innerPoints.join(' ');

  const systemPositions: Record<SystemType, { x: number; y: number; angle: number }> = {
    shield: { x: cx + (rOuter + 45) * Math.cos(-Math.PI / 2), y: cy + (rOuter + 45) * Math.sin(-Math.PI / 2), angle: -Math.PI / 2 },
    weapon: { x: cx + (rOuter + 45) * Math.cos(-Math.PI / 2 + Math.PI * 2 / 3), y: cy + (rOuter + 45) * Math.sin(-Math.PI / 2 + Math.PI * 2 / 3), angle: -Math.PI / 2 + Math.PI * 2 / 3 },
    engine: { x: cx + (rOuter + 45) * Math.cos(-Math.PI / 2 + Math.PI), y: cy + (rOuter + 45) * Math.sin(-Math.PI / 2 + Math.PI), angle: -Math.PI / 2 + Math.PI },
    lifeSupport: { x: cx + (rOuter + 45) * Math.cos(-Math.PI / 2 + Math.PI * 4 / 3), y: cy + (rOuter + 45) * Math.sin(-Math.PI / 2 + Math.PI * 4 / 3), angle: -Math.PI / 2 + Math.PI * 4 / 3 },
  };

  return (
    <div style={{ position: 'relative', width: 500, height: 470, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={500} height={470} viewBox="0 0 500 470">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#66FCF1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#66FCF1" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={180} fill="url(#coreGlow)" />

        <polygon
          points={hexPath}
          fill="rgba(31, 40, 51, 0.6)"
          stroke="#45A29E"
          strokeWidth={1.5}
          strokeOpacity={0.5}
          filter="url(#glow)"
        />

        <polygon
          points={innerPath}
          fill="rgba(11, 12, 16, 0.8)"
          stroke="#66FCF1"
          strokeWidth={1}
          strokeOpacity={0.4}
          strokeDasharray="4 4"
        />

        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const x1 = cx + rInner * Math.cos(angle);
          const y1 = cy + rInner * Math.sin(angle);
          const x2 = cx + rOuter * Math.cos(angle);
          const y2 = cy + rOuter * Math.sin(angle);
          return (
            <line
              key={`spoke-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#45A29E"
              strokeWidth={0.8}
              strokeOpacity={0.3}
            />
          );
        })}

        <circle cx={cx} cy={cy} r={35} fill="#0B0C10" stroke="#66FCF1" strokeWidth={1.2} filter="url(#glow)" />
        <circle cx={cx} cy={cy} r={18} fill="none" stroke="#45A29E" strokeWidth={0.8} strokeOpacity={0.6} />
        <circle cx={cx} cy={cy} r={6} fill="#66FCF1" style={{ filter: 'drop-shadow(0 0 8px #66FCF1)' }} />

        {systems.map((sys) => {
          const pos = systemPositions[sys];
          const color = SYSTEM_COLORS[sys];
          const status = systemStatus[sys];
          const isLow = status < 20;
          const Icon = ICONS[sys];

          const nodeX = cx + (rOuter - 20) * Math.cos(pos.angle);
          const nodeY = cy + (rOuter - 20) * Math.sin(pos.angle);

          return (
            <g key={sys}>
              <line
                x1={nodeX} y1={nodeY}
                x2={pos.x} y2={pos.y}
                stroke={color}
                strokeWidth={1}
                strokeOpacity={0.3}
                strokeDasharray="2 3"
              />
              <circle
                cx={nodeX}
                cy={nodeY}
                r={14}
                fill={`${color}15`}
                stroke={color}
                strokeWidth={1.2}
                style={{ filter: `drop-shadow(0 0 5px ${color}60)` }}
              />
              <text
                x={nodeX}
                y={nodeY + 4}
                textAnchor="middle"
                fill={color}
                fontSize={10}
                fontWeight={700}
              >
                {Math.round(status)}
              </text>
              <g
                transform={`translate(${pos.x - 14}, ${pos.y - 14})`}
                style={{
                  filter: isLow ? 'none' : `drop-shadow(0 0 6px ${color}80)`,
                  opacity: isLow ? 0.5 : 1,
                  animation: isLow ? 'systemShake 0.2s ease-in-out' : 'none',
                  animationIterationCount: isLow ? 'infinite' : 0,
                  animationDelay: isLow ? '0s, 1.5s' : '0s',
                  animationDuration: isLow ? '0.2s, 1.5s' : '0s',
                }}
              >
                <Icon color={color} />
              </g>
              <text
                x={pos.x}
                y={pos.y + 36}
                textAnchor="middle"
                fill={color}
                fontSize={12}
                fontWeight={600}
                style={{ textShadow: `0 0 4px rgba(${hexToRgb(color)},0.5)` }}
              >
                {SYSTEM_LABELS[sys]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default StarShipVisual;
