export const announcementColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export const gradientBackgrounds = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
];

export const getAnnouncementColor = (createdAt: string): string => {
  const index = Math.floor(new Date(createdAt).getTime() / 1000) % announcementColors.length;
  return announcementColors[index];
};

export const getRandomGradient = (id: string): string => {
  const index = id.charCodeAt(id.length - 1) % gradientBackgrounds.length;
  return gradientBackgrounds[index];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

export const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
};

export const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

export const getNameColor = (name: string): string => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const getProgressGradient = (progress: number): string => {
  if (progress < 0.5) {
    return 'linear-gradient(90deg, #10b981 0%, #84cc16 100%)';
  } else if (progress < 0.8) {
    return 'linear-gradient(90deg, #84cc16 0%, #f59e0b 100%)';
  } else {
    return 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)';
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
