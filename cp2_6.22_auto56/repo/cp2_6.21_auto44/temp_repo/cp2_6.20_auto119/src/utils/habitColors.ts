const DEFAULT_COLORS = [
  '#7b68ee', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
  '#6c5ce7', '#fd79a8', '#00b894', '#e17055', '#0984e3',
];

export type HeatmapTheme = 'green' | 'blue' | 'red';

const HEATMAP_THEMES: Record<HeatmapTheme, string[]> = {
  green: ['#ebedf0', '#c6e48b', '#9be9a8', '#40c463', '#216e39'],
  blue: ['#ebedf0', '#c7e9ff', '#7ec4ff', '#2a8ee0', '#0f4b8c'],
  red: ['#ebedf0', '#ffd4d4', '#ff9a9a', '#e64c4c', '#8c1414'],
};

export const HEATMAP_THEME_LABELS: Record<HeatmapTheme, string> = {
  green: '绿色系',
  blue: '蓝色系',
  red: '红色系',
};

export function getHabitColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[index];
}

export function getHeatmapColor(value: number, total: number, theme: HeatmapTheme = 'green'): string {
  const palette = HEATMAP_THEMES[theme];
  if (total === 0 || value === 0) return palette[0];
  const ratio = value / total;
  if (ratio >= 0.8) return palette[4];
  if (ratio >= 0.6) return palette[3];
  if (ratio >= 0.4) return palette[2];
  if (ratio >= 0.2) return palette[1];
  return palette[0];
}

export function getHeatmapPalette(theme: HeatmapTheme = 'green'): string[] {
  return HEATMAP_THEMES[theme];
}

export { DEFAULT_COLORS };
