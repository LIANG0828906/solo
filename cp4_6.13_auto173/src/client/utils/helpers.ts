import { Language, Level } from '../../shared/types';

export function getUserId(): string {
  let userId = localStorage.getItem('lang-diary-user-id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('lang-diary-user-id', userId);
  }
  return userId;
}

export function getUserSettings(): { language: Language; level: Level } {
  const saved = localStorage.getItem('lang-diary-settings');
  if (saved) {
    return JSON.parse(saved);
  }
  return { language: 'english', level: 'beginner' };
}

export function saveUserSettings(settings: { language: Language; level: Level }): void {
  localStorage.setItem('lang-diary-settings', JSON.stringify(settings));
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

const WARM_COLORS = ['#e74c3c', '#e67e22', '#f39c12', '#d4a574', '#c0392b'];

export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return WARM_COLORS[Math.abs(hash) % WARM_COLORS.length];
}
