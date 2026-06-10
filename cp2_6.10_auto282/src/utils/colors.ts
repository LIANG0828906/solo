export const COLORS = {
  neonPurple: '#b300ff',
  neonCyan: '#00e5ff',
  darkBg: '#0a0a0f',
  darkPanel: 'rgba(15, 15, 25, 0.85)',
  neonPink: '#ff00aa',
  neonGreen: '#00ff88',
  neonYellow: '#ffff00',
  beamActive: '#00e5ff',
  beamFlashing: '#ff3366',
  playerGlow: '#b300ff',
  crystal: '#00ffaa',
} as const;

export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [1, 1, 1];
};
