const WARM_COLORS = [
  '#c0392b',
  '#e67e22',
  '#d35400',
  '#27ae60',
  '#16a085',
  '#2980b9',
  '#8e44ad',
  '#f39c12',
  '#c8a165',
  '#a0522d'
];

export function hashColor(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % WARM_COLORS.length;
  return WARM_COLORS[index];
}

export function hashAvatarColor(input: string): string {
  const colors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
    '#54a0ff', '#5f27cd', '#00d2d3', '#ff6348'
  ];
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
