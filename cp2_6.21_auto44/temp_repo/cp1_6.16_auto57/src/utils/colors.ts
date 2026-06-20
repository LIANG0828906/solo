import { BookCategory } from '../types';

export const CATEGORY_COLORS: Record<BookCategory, string> = {
  '科幻': '#3498db',
  '文学': '#27ae60',
  '历史': '#8b4513',
  '科技': '#9b59b6',
  '艺术': '#e74c3c',
  '其他': '#7f8c8d',
};

export const AVATAR_COLORS = [
  '#3498db',
  '#e74c3c',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#34495e',
];

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category as BookCategory] || CATEGORY_COLORS['其他'];
}

export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}
