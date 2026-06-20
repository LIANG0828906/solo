import type { FC } from 'react';

interface ShapeProps {
  color: string;
  width: number;
  height: number;
}

export const CircleFace: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 60 60">
    <ellipse cx="30" cy="32" rx="26" ry="26" fill={color} />
    <circle cx="20" cy="28" r="3" fill="#333" />
    <circle cx="40" cy="28" r="3" fill="#333" />
    <ellipse cx="30" cy="38" rx="5" ry="3" fill="#E88B8B" />
    <path d="M18 22 Q20 18 22 22" stroke="#333" strokeWidth="1.5" fill="none" />
    <path d="M38 22 Q40 18 42 22" stroke="#333" strokeWidth="1.5" fill="none" />
  </svg>
);

export const SquareFace: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 60 65">
    <rect x="6" y="8" width="48" height="50" rx="6" fill={color} />
    <circle cx="20" cy="30" r="3" fill="#333" />
    <circle cx="40" cy="30" r="3" fill="#333" />
    <rect x="24" y="42" width="12" height="4" rx="2" fill="#E88B8B" />
    <path d="M16 24 L24 24" stroke="#333" strokeWidth="2" strokeLinecap="round" />
    <path d="M36 24 L44 24" stroke="#333" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CatEarFace: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 70 75">
    <polygon points="12,25 6,2 25,18" fill={color} stroke="#D4A98C" strokeWidth="1" />
    <polygon points="58,25 64,2 45,18" fill={color} stroke="#D4A98C" strokeWidth="1" />
    <ellipse cx="35" cy="45" rx="26" ry="24" fill={color} />
    <circle cx="25" cy="42" r="3" fill="#333" />
    <circle cx="45" cy="42" r="3" fill="#333" />
    <ellipse cx="35" cy="52" rx="4" ry="2.5" fill="#E88B8B" />
    <line x1="10" y1="45" x2="25" y2="47" stroke="#D4A98C" strokeWidth="1" />
    <line x1="10" y1="50" x2="25" y2="50" stroke="#D4A98C" strokeWidth="1" />
    <line x1="60" y1="45" x2="45" y2="47" stroke="#D4A98C" strokeWidth="1" />
    <line x1="60" y1="50" x2="45" y2="50" stroke="#D4A98C" strokeWidth="1" />
  </svg>
);

export const PointedFace: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 55 65">
    <path d="M27 5 Q50 15 48 45 Q45 62 27 62 Q9 62 6 45 Q4 15 27 5Z" fill={color} />
    <circle cx="18" cy="32" r="2.5" fill="#333" />
    <circle cx="37" cy="32" r="2.5" fill="#333" />
    <ellipse cx="27" cy="44" rx="4" ry="2" fill="#E88B8B" />
    <path d="M14 26 Q18 22 22 26" stroke="#333" strokeWidth="1.5" fill="none" />
    <path d="M33 26 Q37 22 41 26" stroke="#333" strokeWidth="1.5" fill="none" />
  </svg>
);

export const StandardTorso: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 65 90">
    <path d="M10 5 Q5 5 5 15 L5 70 Q5 85 20 85 L45 85 Q60 85 60 70 L60 15 Q60 5 55 5 Z" fill={color} />
    <path d="M25 5 L32 20 L40 5" fill="none" stroke={adjustBrightness(color, -30)} strokeWidth="2" />
    <line x1="32" y1="20" x2="32" y2="85" stroke={adjustBrightness(color, -15)} strokeWidth="1" opacity="0.5" />
  </svg>
);

export const SportTorso: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 70 90">
    <path d="M8 5 Q3 5 3 15 L5 75 Q5 88 22 88 L48 88 Q65 88 65 75 L67 15 Q67 5 62 5 Z" fill={color} />
    <path d="M20 5 L35 25 L50 5" fill="none" stroke="#fff" strokeWidth="2" opacity="0.6" />
    <rect x="3" y="55" width="64" height="3" fill="#fff" opacity="0.3" rx="1" />
  </svg>
);

export const DressTorso: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 75 110">
    <path d="M20 5 Q15 5 12 20 L5 95 Q5 108 25 108 L50 108 Q70 108 70 95 L63 20 Q60 5 55 5 Z" fill={color} />
    <path d="M30 5 Q37 30 45 5" fill="none" stroke={adjustBrightness(color, -25)} strokeWidth="1.5" />
    <path d="M10 70 Q37 78 65 70" fill="none" stroke={adjustBrightness(color, -15)} strokeWidth="1" opacity="0.4" />
  </svg>
);

export const SuitTorso: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 70 95">
    <path d="M8 5 Q3 5 3 15 L5 75 Q5 92 22 92 L48 92 Q67 92 67 75 L67 15 Q67 5 62 5 Z" fill={color} />
    <path d="M25 5 L35 30 L45 5" fill="none" stroke="#fff" strokeWidth="2" />
    <line x1="35" y1="30" x2="35" y2="92" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
    <circle cx="35" cy="55" r="3" fill="#FFD700" opacity="0.7" />
  </svg>
);

export const NaturalArms: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 120 35">
    <path d="M5 8 Q25 5 40 12 Q50 16 55 18" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
    <path d="M115 8 Q95 5 80 12 Q70 16 65 18" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
    <ellipse cx="60" cy="20" rx="8" ry="8" fill={adjustBrightness(color, -10)} />
  </svg>
);

export const StandardLegs: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 55 100">
    <rect x="8" y="5" width="16" height="75" rx="6" fill={color} />
    <rect x="31" y="5" width="16" height="75" rx="6" fill={color} />
    <ellipse cx="16" cy="88" rx="12" ry="8" fill={adjustBrightness(color, -20)} />
    <ellipse cx="39" cy="88" rx="12" ry="8" fill={adjustBrightness(color, -20)} />
  </svg>
);

export const SpreadArms: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 150 30">
    <path d="M5 15 Q30 8 60 15 Q70 17 75 18" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
    <path d="M145 15 Q120 8 90 15 Q80 17 75 18" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
    <ellipse cx="75" cy="18" rx="8" ry="8" fill={adjustBrightness(color, -10)} />
  </svg>
);

export const RunningLegs: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 65 100">
    <path d="M15 5 Q12 40 8 70" stroke={color} strokeWidth="14" strokeLinecap="round" fill="none" />
    <path d="M50 5 Q53 40 57 70" stroke={color} strokeWidth="14" strokeLinecap="round" fill="none" />
    <ellipse cx="8" cy="82" rx="12" ry="8" fill={adjustBrightness(color, -20)} transform="rotate(-10 8 82)" />
    <ellipse cx="57" cy="82" rx="12" ry="8" fill={adjustBrightness(color, -20)} transform="rotate(10 57 82)" />
  </svg>
);

export const AkimboArms: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 110 45">
    <path d="M10 10 Q25 5 40 20 Q48 28 55 30" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
    <path d="M100 10 Q85 5 70 20 Q62 28 55 30" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
    <ellipse cx="55" cy="32" rx="8" ry="8" fill={adjustBrightness(color, -10)} />
  </svg>
);

export const Hat: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 65 25">
    <ellipse cx="32" cy="22" rx="30" ry="5" fill={adjustBrightness(color, -15)} />
    <rect x="14" y="3" width="36" height="18" rx="4" fill={color} />
    <rect x="14" y="15" width="36" height="4" fill={adjustBrightness(color, -20)} rx="1" />
  </svg>
);

export const Scarf: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 50 28">
    <path d="M5 8 Q25 2 45 8 Q48 12 45 18 Q25 24 5 18 Q2 12 5 8Z" fill={color} />
    <path d="M22 18 Q24 26 22 28" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
  </svg>
);

export const Glasses: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 48 20">
    <circle cx="14" cy="12" r="8" fill="none" stroke={color} strokeWidth="2.5" />
    <circle cx="34" cy="12" r="8" fill="none" stroke={color} strokeWidth="2.5" />
    <line x1="22" y1="12" x2="26" y2="12" stroke={color} strokeWidth="2.5" />
    <line x1="6" y1="10" x2="0" y2="8" stroke={color} strokeWidth="2" />
    <line x1="42" y1="10" x2="48" y2="8" stroke={color} strokeWidth="2" />
  </svg>
);

export const Bow: FC<ShapeProps> = ({ color, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 40 30">
    <path d="M20 15 Q5 5 5 15 Q5 25 20 15" fill={color} />
    <path d="M20 15 Q35 5 35 15 Q35 25 20 15" fill={color} />
    <circle cx="20" cy="15" r="4" fill={adjustBrightness(color, -25)} />
    <path d="M18 19 Q20 28 22 19" fill={adjustBrightness(color, -15)} />
  </svg>
);

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const shapeMap: Record<string, FC<ShapeProps>> = {
  'circle-face': CircleFace,
  'square-face': SquareFace,
  'cat-ear': CatEarFace,
  'pointed-face': PointedFace,
  'standard-torso': StandardTorso,
  'sport-torso': SportTorso,
  'dress-torso': DressTorso,
  'suit-torso': SuitTorso,
  'natural-arms': NaturalArms,
  'standard-legs': StandardLegs,
  'spread-arms': SpreadArms,
  'running-legs': RunningLegs,
  'akimbo-arms': AkimboArms,
  hat: Hat,
  scarf: Scarf,
  glasses: Glasses,
  bow: Bow,
};

export function renderShape(shape: string, color: string, width: number, height: number) {
  const Component = shapeMap[shape];
  if (!Component) return null;
  return <Component color={color} width={width} height={height} />;
}
