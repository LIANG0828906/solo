export const CARD_COLORS = [
  'linear-gradient(135deg, #f5f0e8 0%, #e8ddd0 100%)',
  'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)',
  'linear-gradient(135deg, #f0fff4 0%, #d4f1d4 100%)',
  'linear-gradient(135deg, #f0f8ff 0%, #d4e9f7 100%)',
  'linear-gradient(135deg, #fffaf0 0%, #faecd4 100%)',
  'linear-gradient(135deg, #f5f0ff 0%, #e0d4f7 100%)'
];

export const AVATAR_COLORS = [
  '#C8102E',
  '#008B8B',
  '#2F4F4F',
  '#8B4513',
  '#4A4A4A',
  '#6B4423'
];

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getRandomCardColorIndex(): number {
  return Math.floor(Math.random() * CARD_COLORS.length);
}
