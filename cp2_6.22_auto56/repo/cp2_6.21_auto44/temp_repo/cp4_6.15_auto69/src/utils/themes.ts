export type ThemeColors = [string, string];

const themePresets: Record<string, ThemeColors> = {
  冒险: ['#FF6B35', '#F7C59F'],
  爱情: ['#FF6B9D', '#C44569'],
  奇幻: ['#A06CD5', '#6247AA'],
  悬疑: ['#2C3E50', '#4A6572'],
  成长: ['#56AB2F', '#A8E063'],
  科幻: ['#00B4DB', '#0083B0'],
  历史: ['#D4A574', '#8B6914'],
  童话: ['#FDCB6E', '#E17055'],
  恐怖: ['#1A1A2E', '#16213E'],
  治愈: ['#89F7FE', '#66A6FF'],
  青春: ['#FFB6C1', '#FF69B4'],
  战争: ['#434343', '#000000'],
};

const fallbackGradients: ThemeColors[] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fecfef'],
  ['#ffecd2', '#fcb69f'],
  ['#a1c4fd', '#c2e9fb'],
  ['#d299c2', '#fef9d7'],
  ['#f5f7fa', '#c3cfe2'],
];

export function getThemeColors(keyword: string): ThemeColors {
  if (themePresets[keyword]) {
    return themePresets[keyword];
  }
  const index = Math.floor(Math.random() * fallbackGradients.length);
  return fallbackGradients[index];
}
