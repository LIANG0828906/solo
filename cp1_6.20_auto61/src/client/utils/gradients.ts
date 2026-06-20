// 渐变配色方案数组（至少10种）
const gradientPalettes: string[] = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
];

// 四支队伍的主题色
const teamColors: string[] = [
  '#00d4ff',
  '#ff6b6b',
  '#43e97b',
  '#feca57',
];

// 四支队伍的科幻风格名称
const teamNames: string[] = [
  '银河队',
  '星云队',
  '彗星队',
  '黑洞队',
];

/**
 * 获取随机CSS渐变字符串
 * @returns 随机CSS渐变样式字符串
 */
export function getRandomGradient(): string {
  const randomIndex = Math.floor(Math.random() * gradientPalettes.length);
  return gradientPalettes[randomIndex];
}

/**
 * 根据索引返回队伍主题色
 * @param index 队伍索引（0-3）
 * @returns 队伍主题色十六进制字符串
 */
export function getTeamColor(index: number): string {
  const safeIndex = Math.max(0, Math.min(index, teamColors.length - 1));
  return teamColors[safeIndex];
}

/**
 * 根据索引返回队伍名称
 * @param index 队伍索引（0-3）
 * @returns 科幻风格的队伍名称
 */
export function getTeamName(index: number): string {
  const safeIndex = Math.max(0, Math.min(index, teamNames.length - 1));
  return teamNames[safeIndex];
}
