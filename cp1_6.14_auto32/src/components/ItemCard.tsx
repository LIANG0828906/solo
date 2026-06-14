import { useState, useEffect } from 'react';
import { useLazyImage } from '@/hooks/useLazyImage';
import { cn } from '@/lib/utils';

export interface Item {
  id: string;
  title: string;
  category: string;
  condition: string;
  images: string[];
  userId: string;
  userName: string;
  userAvatar: string;
  status: 'available' | 'exchanged' | 'offline';
  createdAt: string;
}

interface ItemCardProps {
  item: Item;
  onClick: (item: Item) => void;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

const statusConfig = {
  available: { label: '可用', bg: 'bg-status-available' },
  exchanged: { label: '已交换', bg: 'bg-status-exchanged' },
  offline: { label: '已下架', bg: 'bg-status-offline' },
} as const;

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const { ref: lazyRef, isVisible } = useLazyImage();
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  const thumbnail = item.images?.[0];

  useEffect(() => {
    if (!isVisible || !thumbnail) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxWidth = 400;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setDisplaySrc(canvas.toDataURL('image/jpeg', 0.8));
      }
    };
    img.onerror = () => {
      setDisplaySrc(thumbnail);
    };
    img.src = thumbnail;
  }, [isVisible, thumbnail]);

  const status = statusConfig[item.status];

  return (
    <div
      ref={lazyRef}
      onClick={() => onClick(item)}
      className={cn(
        'cursor-pointer rounded-xl bg-white shadow-card',
        'hover:shadow-card-hover hover:-translate-y-1',
        'transition-all duration-300 overflow-hidden'
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-gray-100">
        {isVisible && displaySrc ? (
          <img
            src={displaySrc}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-10 w-10 rounded bg-gray-200 animate-pulse" />
          </div>
        )}
        <span
          className={cn(
            'absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
            status.bg
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-gray-900">
          {item.title}
        </h3>
        <span className="mt-1 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-600">
          {item.category}
        </span>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img
              src={item.userAvatar}
              alt={item.userName}
              className="h-5 w-5 rounded-full object-cover"
            />
            <span className="text-xs text-gray-500">{item.userName}</span>
          </div>
          <span className="text-xs text-gray-400">
            {getRelativeTime(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
