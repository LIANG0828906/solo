export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  }
}

export function getWorkTypeIcon(type: string): string {
  switch (type) {
    case 'story':
      return '📖';
    case 'poem':
      return '🪶';
    case 'script':
      return '🎭';
    default:
      return '📝';
  }
}

export function getWorkTypeName(type: string): string {
  switch (type) {
    case 'story':
      return '故事';
    case 'poem':
      return '诗歌';
    case 'script':
      return '剧本';
    default:
      return '作品';
  }
}

export const COLORS = [
  '#FF6B6B',
  '#FFA94D',
  '#FFE066',
  '#69DB7C',
  '#74C0FC',
  '#B197FC',
];
