import React from 'react';

export interface MosaicTileData {
  id: string;
  x: number;
  y: number;
  size: number;
  sides: 3 | 4 | 5;
  rotation: number;
  colorStart: string;
  colorEnd: string;
  gradientAngle: number;
  glowColor: string;
  glowIntensity: number;
  iconType: string;
}

interface MosaicTileProps {
  tile: MosaicTileData;
  gradientId: string;
  intensity: number;
}

interface IconProps {
  size?: number;
  opacity?: number;
}

function HeartIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 14 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <path
        d={`M ${s / 2} ${s * 0.88}
            L ${s * 0.12} ${s * 0.48}
            C ${s * 0.04} ${s * 0.34}, ${s * 0.14} ${s * 0.16}, ${s * 0.32} ${s * 0.16}
            C ${s * 0.44} ${s * 0.16}, ${s / 2} ${s * 0.26}, ${s / 2} ${s * 0.34}
            C ${s / 2} ${s * 0.26}, ${s * 0.56} ${s * 0.16}, ${s * 0.68} ${s * 0.16}
            C ${s * 0.86} ${s * 0.16}, ${s * 0.96} ${s * 0.34}, ${s * 0.88} ${s * 0.48} Z`}
        fill="#fff"
      />
    </g>
  );
}

function StarIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 16 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <path
        d={`M ${s / 2} ${s * 0.08}
            L ${s * 0.61} ${s * 0.38}
            L ${s * 0.94} ${s * 0.42}
            L ${s * 0.68} ${s * 0.64}
            L ${s * 0.76} ${s * 0.94}
            L ${s / 2} ${s * 0.78}
            L ${s * 0.24} ${s * 0.94}
            L ${s * 0.32} ${s * 0.64}
            L ${s * 0.06} ${s * 0.42}
            L ${s * 0.39} ${s * 0.38} Z`}
        fill="#fff"
      />
    </g>
  );
}

function BoltIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 16 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <path
        d={`M ${s * 0.62} ${s * 0.06}
            L ${s * 0.28} ${s * 0.56}
            L ${s * 0.48} ${s * 0.56}
            L ${s * 0.38} ${s * 0.94}
            L ${s * 0.72} ${s * 0.44}
            L ${s * 0.52} ${s * 0.44}
            L ${s * 0.62} ${s * 0.06} Z`}
        fill="#fff"
      />
    </g>
  );
}

function MoonIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 16 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <path
        d={`M ${s * 0.72} ${s * 0.12}
            C ${s * 0.44} ${s * 0.14}, ${s * 0.22} ${s * 0.36}, ${s * 0.2} ${s * 0.64}
            C ${s * 0.18} ${s * 0.88}, ${s * 0.36} ${s * 0.92}, ${s * 0.48} ${s * 0.86}
            C ${s * 0.4} ${s * 0.74}, ${s * 0.42} ${s * 0.54}, ${s * 0.54} ${s * 0.4}
            C ${s * 0.66} ${s * 0.28}, ${s * 0.8} ${s * 0.24}, ${s * 0.88} ${s * 0.3}
            C ${s * 0.88} ${s * 0.2}, ${s * 0.82} ${s * 0.12}, ${s * 0.72} ${s * 0.12} Z`}
        fill="#fff"
      />
    </g>
  );
}

function SmileIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 14 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <circle cx={s / 2} cy={s / 2} r={s / 2 - 0.5} fill="#fff" />
      <circle cx={s * 0.35} cy={s * 0.42} r={s * 0.09} fill="#1a1a2e" />
      <circle cx={s * 0.65} cy={s * 0.42} r={s * 0.09} fill="#1a1a2e" />
      <path
        d={`M ${s * 0.3} ${s * 0.62} Q ${s / 2} ${s * 0.8} ${s * 0.7} ${s * 0.62}`}
        fill="none"
        stroke="#1a1a2e"
        strokeWidth={s * 0.09}
        strokeLinecap="round"
      />
    </g>
  );
}

function RaindropIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 16 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <path
        d={`M ${s / 2} ${s * 0.1}
            C ${s * 0.15} ${s * 0.55}, ${s * 0.1} ${s * 0.75}, ${s / 2} ${s * 0.92}
            C ${s * 0.9} ${s * 0.75}, ${s * 0.85} ${s * 0.55}, ${s / 2} ${s * 0.1} Z`}
        fill="#fff"
      />
      <ellipse cx={s * 0.42} cy={s * 0.58} rx={s * 0.1} ry={s * 0.14} fill="#81ECEC" opacity={0.85} />
    </g>
  );
}

function FlameIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 16 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <path
        d={`M ${s / 2} ${s * 0.08}
            C ${s * 0.22} ${s * 0.45}, ${s * 0.12} ${s * 0.7}, ${s / 2} ${s * 0.92}
            C ${s * 0.88} ${s * 0.7}, ${s * 0.78} ${s * 0.45}, ${s / 2} ${s * 0.08} Z
            M ${s / 2} ${s * 0.35}
            C ${s * 0.38} ${s * 0.58}, ${s * 0.36} ${s * 0.75}, ${s / 2} ${s * 0.85}
            C ${s * 0.64} ${s * 0.75}, ${s * 0.62} ${s * 0.58}, ${s / 2} ${s * 0.35} Z`}
        fill="#fff"
      />
    </g>
  );
}

function LeafIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 16 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <path
        d={`M ${s * 0.08} ${s * 0.92}
            C ${s * 0.08} ${s * 0.4}, ${s * 0.4} ${s * 0.08}, ${s * 0.92} ${s * 0.08}
            C ${s * 0.92} ${s * 0.6}, ${s * 0.6} ${s * 0.92}, ${s * 0.08} ${s * 0.92} Z`}
        fill="#fff"
      />
      <path
        d={`M ${s * 0.18} ${s * 0.82} Q ${s * 0.48} ${s * 0.52} ${s * 0.82} ${s * 0.18}`}
        fill="none"
        stroke="#1a1a2e"
        strokeWidth={s * 0.06}
        strokeLinecap="round"
      />
    </g>
  );
}

function SparkleIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 16 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <path
        d={`M ${s / 2} ${s * 0.08}
            L ${s * 0.58} ${s * 0.42}
            L ${s * 0.92} ${s / 2}
            L ${s * 0.58} ${s * 0.58}
            L ${s / 2} ${s * 0.92}
            L ${s * 0.42} ${s * 0.58}
            L ${s * 0.08} ${s / 2}
            L ${s * 0.42} ${s * 0.42} Z`}
        fill="#fff"
      />
      <circle cx={s / 2} cy={s / 2} r={s * 0.12} fill="#FFD93D" />
    </g>
  );
}

function BulbIcon({ size = 1, opacity = 1 }: IconProps) {
  const s = 16 * size;
  return (
    <g className="tile-icon" transform={`translate(${-s / 2}, ${-s / 2})`} opacity={opacity}>
      <circle cx={s / 2} cy={s * 0.45} r={s * 0.36} fill="#fff" />
      <rect x={s * 0.35} y={s * 0.75} width={s * 0.3} height={s * 0.18} rx={s * 0.04} fill="#fff" />
      <rect x={s * 0.4} y={s * 0.18} width={s * 0.04} height={s * 0.16} rx={s * 0.02} fill="#FFD93D" />
      <rect x={s * 0.18} y={s * 0.4} width={s * 0.16} height={s * 0.04} rx={s * 0.02} fill="#FFD93D" />
      <rect x={s * 0.66} y={s * 0.4} width={s * 0.16} height={s * 0.04} rx={s * 0.02} fill="#FFD93D" />
    </g>
  );
}

function renderMoodIcon(iconType: string, tileSize: number, intensity: number) {
  const intensityFactor = 0.55 + (intensity / 100) * 0.55;
  const size = Math.min(1.2, tileSize / 45) * intensityFactor;
  const opacity = 0.55 + (intensity / 100) * 0.45;
  switch (iconType) {
    case 'smile': return <SmileIcon size={size} opacity={opacity} />;
    case 'raindrop': return <RaindropIcon size={size} opacity={opacity} />;
    case 'flame': return <FlameIcon size={size} opacity={opacity} />;
    case 'leaf': return <LeafIcon size={size} opacity={opacity} />;
    case 'sparkle': return <SparkleIcon size={size} opacity={opacity} />;
    case 'bulb': return <BulbIcon size={size} opacity={opacity} />;
    case 'heart': return <HeartIcon size={size} opacity={opacity} />;
    case 'star': return <StarIcon size={size} opacity={opacity} />;
    case 'bolt': return <BoltIcon size={size} opacity={opacity} />;
    case 'moon': return <MoonIcon size={size} opacity={opacity} />;
    default: return <SmileIcon size={size} opacity={opacity} />;
  }
}

function polygonPoints(sides: number, size: number, jitter = 0.15): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const r = (size / 2) * (1 + (Math.random() - 0.5) * jitter);
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

const MosaicTile: React.FC<MosaicTileProps> = React.memo(({ tile, gradientId }) => {
  const points = polygonPoints(tile.sides, tile.size, 0.12);

  return (
    <g
      className="tile-group"
      transform={`translate(${tile.x}, ${tile.y}) rotate(${tile.rotation})`}
      style={{ ['--tile-glow' as string]: tile.glowColor }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2={`${Math.cos((tile.gradientAngle * Math.PI) / 180) * 100}%`}
          y2={`${Math.sin((tile.gradientAngle * Math.PI) / 180) * 100}%`}
        >
          <stop offset="0%" stopColor={tile.colorStart} />
          <stop offset="100%" stopColor={tile.colorEnd} />
        </linearGradient>
      </defs>
      <polygon
        className="tile-polygon"
        points={points}
        fill={`url(#${gradientId})`}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {renderMoodIcon(tile.iconType, tile.size)}
    </g>
  );
});

MosaicTile.displayName = 'MosaicTile';
export default MosaicTile;
