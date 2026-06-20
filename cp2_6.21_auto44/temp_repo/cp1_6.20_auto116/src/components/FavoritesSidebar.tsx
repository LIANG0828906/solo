import { memo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Heart, Trash, Trash2, Bookmark } from 'lucide-react';
import type { FavoriteItem } from '../types/color';
import { hslToHex } from '../utils/colorUtils';
import { cn } from '../lib/utils';

interface FavoritesSidebarProps {
  favorites: FavoriteItem[];
  collapsed: boolean;
  onApply: (item: FavoriteItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onToggle: () => void;
}

const formatTime = (timestamp: number): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (itemDate.getTime() === today.getTime()) {
    return `今天 ${hours}:${minutes}`;
  } else if (itemDate.getTime() === yesterday.getTime()) {
    return `昨天 ${hours}:${minutes}`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`;
  }
};

const FavoritesSidebar = memo(function FavoritesSidebar({
  favorites,
  collapsed,
  onApply,
  onDelete,
  onClear,
  onToggle,
}: FavoritesSidebarProps) {
  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDelete(id);
    },
    [onDelete]
  );

  const handleCardClick = useCallback(
    (item: FavoriteItem) => {
      onApply(item);
    },
    [onApply]
  );

  return (
    <div
      className={cn(
        'relative flex flex-col border-l transition-all duration-300 ease-in-out',
        collapsed ? 'w-12' : 'w-70'
      )}
      style={{
        backgroundColor: '#16213e',
        borderColor: '#0f3460',
      }}
    >
      <div className="relative flex items-center px-4 py-3 border-b" style={{ borderColor: '#0f3460' }}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" fill="currentColor" />
            <span className="text-white font-medium">我的收藏</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center w-full">
            <Heart className="w-5 h-5 text-rose-400" fill="currentColor" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors',
            collapsed ? 'left-1/2 -translate-x-1/2' : 'right-2'
          )}
          aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-2 py-3"
        style={{ maxHeight: 'calc(100vh - 100px)' }}
      >
        {favorites.length === 0 ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center py-10 text-gray-400',
              collapsed && 'px-0'
            )}
          >
            <Bookmark className={cn('mb-2', collapsed ? 'w-5 h-5' : 'w-10 h-10')} />
            {!collapsed && <span className="text-sm">暂无收藏</span>}
          </div>
        ) : (
          <div className={cn('flex flex-col gap-2', collapsed && 'items-center')}>
            {favorites.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'group relative rounded-lg cursor-pointer transition-all duration-300 ease',
                  collapsed ? 'w-10 h-10 p-1' : 'p-3'
                )}
                style={{ backgroundColor: '#1a1a2e' }}
                onClick={() => handleCardClick(item)}
              >
                {!collapsed && (
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-all"
                    aria-label="删除收藏"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}

                {collapsed ? (
                  <div className="w-full h-full rounded overflow-hidden">
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: hslToHex(item.palette.colors[0]) }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 mb-2">
                      {item.palette.colors.slice(0, 5).map((color, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-8 rounded first:rounded-l last:rounded-r"
                          style={{ backgroundColor: hslToHex(color) }}
                        />
                      ))}
                    </div>
                    <div className="pr-6">
                      <div className="text-white text-sm font-medium truncate">
                        {item.name}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        {formatTime(item.createdAt)}
                      </div>
                    </div>
                  </>
                )}

                {collapsed && (
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute -top-1 -right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 bg-red-500 text-white transition-all"
                    aria-label="删除收藏"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!collapsed && favorites.length > 0 && (
        <div className="p-3 border-t" style={{ borderColor: '#0f3460' }}>
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">清空</span>
          </button>
        </div>
      )}

      <style>{`
        .group:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          background-color: #0f3460 !important;
        }
      `}</style>
    </div>
  );
});

export default FavoritesSidebar;
