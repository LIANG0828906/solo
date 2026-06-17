import { useState } from 'react';
import { Heart, Disc } from 'lucide-react';
import type { VinylRecord } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  favorites: VinylRecord[];
  history: { record: VinylRecord; timestamp: number }[];
  onRecordClick: (record: VinylRecord) => void;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function Sidebar({ favorites, history, onRecordClick }: SidebarProps) {
  const [scaledFavoriteId, setScaledFavoriteId] = useState<string | null>(null);
  const displayHistory = history.slice(0, 20).sort((a, b) => b.timestamp - a.timestamp);

  const handleFavoriteClick = (record: VinylRecord) => {
    setScaledFavoriteId(record.id);
    setTimeout(() => setScaledFavoriteId(null), 200);
    onRecordClick(record);
  };

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        width: '200px',
        backgroundColor: '#0F3460',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <div className="mb-6">
        <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
          <Heart size={14} style={{ color: '#E94560' }} />
          我的收藏
        </h4>
        <div className="space-y-2">
          {favorites.length === 0 ? (
            <p className="text-gray-500 text-xs">暂无收藏</p>
          ) : (
            favorites.map((record) => (
              <button
                key={record.id}
                onClick={() => handleFavoriteClick(record)}
                className={cn(
                  'w-full flex items-center gap-2 p-2 rounded-lg',
                  'hover:bg-white/10 transition-all text-left',
                  scaledFavoriteId === record.id && 'scale-110'
                )}
                style={{
                  transition: 'transform 200ms ease-in-out',
                }}
              >
                <Heart
                  size={16}
                  fill={record.id === scaledFavoriteId ? '#E94560' : '#E94560'}
                  style={{ color: '#E94560' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{record.title}</p>
                  <p className="text-gray-400 text-xs truncate">{record.artist}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
          <Disc size={14} style={{ color: '#533483' }} />
          播放历史
        </h4>
        <div className="relative">
          {displayHistory.length === 0 ? (
            <p className="text-gray-500 text-xs">暂无历史</p>
          ) : (
            <div className="space-y-0">
              {displayHistory.map((item, index) => (
                <div key={`${item.record.id}-${item.timestamp}`} className="relative pl-8 pb-4">
                  {index < displayHistory.length - 1 && (
                    <div
                      className="absolute left-[14px] top-[30px] w-[2px] h-full"
                      style={{
                        background: `linear-gradient(to bottom, #533483, #E94560)`,
                      }}
                    />
                  )}
                  <button
                    onClick={() => onRecordClick(item.record)}
                    className="absolute left-0 top-0 w-[30px] h-[30px] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    style={{
                      background: `linear-gradient(135deg, #533483, #E94560)`,
                    }}
                  >
                    <Disc size={16} color="#FFFFFF" />
                  </button>
                  <div className="pt-1">
                    <p className="text-white text-xs font-medium truncate">{item.record.title}</p>
                    <p className="text-gray-400 text-xs">{formatTimestamp(item.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
