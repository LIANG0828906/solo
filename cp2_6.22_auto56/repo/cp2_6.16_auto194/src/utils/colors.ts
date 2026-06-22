const COLORS = [
  '#3498DB',
  '#9B59B6',
  '#E74C3C',
  '#27AE60',
  '#E67E22',
  '#1ABC9C',
  '#F39C12',
  '#2980B9',
  '#8E44AD',
  '#16A085',
];

export function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function getColorByIndex(index: number): string {
  return COLORS[index % COLORS.length];
}

export const ANNOTATION_COLORS: Record<string, string> = {
  suggestion: '#27AE60',
  question: '#E67E22',
  error: '#E74C3C',
};

export const ANNOTATION_LABELS: Record<string, string> = {
  suggestion: '建议',
  question: '疑问',
  error: '错误',
};
