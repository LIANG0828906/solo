const DEFAULT_COLORS = [
  '#7b68ee',
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#f9ca24',
  '#6c5ce7',
  '#fd79a8',
  '#00b894',
  '#e17055',
  '#0984e3',
];

export function getHabitColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[index];
}

export function getHeatmapColor(value: number, total: number): string {
  if (total === 0 || value === 0) {
    return '#ebedf0';
  }
  const ratio = value / total;
  if (ratio >= 0.8) {
    return '#216e39';
  } else if (ratio >= 0.6) {
    return '#30a14e';
  } else if (ratio >= 0.4) {
    return '#40c463';
  } else if (ratio >= 0.2) {
    return '#9be9a8';
  } else {
    return '#c6e48b';
  }
}

export { DEFAULT_COLORS };
