import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ExplorationType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function compressImage(file: File, maxSizeBytes = 1 * 1024 * 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.onload = (e) => {
      img.onerror = () => reject(new Error('图片加载失败'));
      img.onload = () => {
        let { width, height } = img;
        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 不可用'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('压缩失败'));
                return;
              }
              if (blob.size <= maxSizeBytes || quality <= 0.3) {
                resolve(blob);
              } else {
                quality -= 0.15;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };
        tryCompress();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function typeIcon(type: ExplorationType): string {
  switch (type) {
    case 'cafe': return '☕';
    case 'bookstore': return '📚';
    case 'graffiti': return '🎨';
    case 'architecture': return '🏛️';
    case 'hidden_shop': return '🛍️';
    default: return '📍';
  }
}

export const DEFAULT_USER = {
  id: 'user-local',
  nickname: '城市漫游者',
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cityexplorer',
};

export function getCurrentUser() {
  const stored = localStorage.getItem('city-explorer-user');
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }
  localStorage.setItem('city-explorer-user', JSON.stringify(DEFAULT_USER));
  return DEFAULT_USER;
}
