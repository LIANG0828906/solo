export const THEME_GRADIENTS: string[] = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

export const THEME_STRIP_COLORS: string[] = [
  '#764ba2',
  '#f5576c',
  '#00f2fe',
  '#38f9d7',
  '#fee140',
  '#330867',
  '#fed6e3',
  '#fecfef',
];

export function getRandomThemeColor(): string {
  const idx = Math.floor(Math.random() * THEME_GRADIENTS.length);
  return THEME_GRADIENTS[idx];
}

export function getStripColor(themeColor: string): string {
  const idx = THEME_GRADIENTS.indexOf(themeColor);
  if (idx === -1) return THEME_STRIP_COLORS[0];
  return THEME_STRIP_COLORS[idx];
}
