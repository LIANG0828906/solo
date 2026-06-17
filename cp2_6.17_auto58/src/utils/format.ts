import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), {
    addSuffix: true,
    locale: zhCN,
  });
}

export function getInitials(name: string): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

export function generateAvatarColor(name: string): string {
  const colors = [
    '#27AE60',
    '#3498DB',
    '#E74C3C',
    '#F39C12',
    '#9B59B6',
    '#1ABC9C',
    '#E67E22',
    '#16A085',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function validateImageFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return '仅支持 JPG 和 PNG 格式';
  }
  if (file.size > 2 * 1024 * 1024) {
    return '图片大小不能超过 2MB';
  }
  return null;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
