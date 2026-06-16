const GRADIENT_PAIRS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a8edea', '#fed6e3'],
  ['#5ee7df', '#b490ca'],
  ['#d299c2', '#fef9d7'],
  ['#89f7fe', '#66a6ff'],
  ['#fddb92', '#d1fdff'],
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'linear-gradient(180deg, #9ca3af, #6b7280)',
  'in-progress': 'linear-gradient(180deg, #60a5fa, #3b82f6)',
  reviewing: 'linear-gradient(180deg, #fbbf24, #f59e0b)',
  completed: 'linear-gradient(180deg, #34d399, #10b981)',
};

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getGradientColors(text: string): [string, string] {
  const hash = hashString(text);
  const index = hash % GRADIENT_PAIRS.length;
  return GRADIENT_PAIRS[index] as [string, string];
}

export function getAvatarColor(userId: string): string {
  const hash = hashString(userId);
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 60%)`;
}

export function getStatusGradient(status: string): string {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
}
