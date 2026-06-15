import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { TagInfo, getTagColor } from '@/utils/storage';
import { Tag, X, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TagSidebarProps {
  open: boolean;
  onToggle: () => void;
}

export default function TagSidebar({ open, onToggle }: TagSidebarProps) {
  const cards = useStore((s) => s.cards);
  const selectedTag = useStore((s) => s.selectedTag);
  const setSelectedTag = useStore((s) => s.setSelectedTag);

  const tags = useMemo<TagInfo[]>(() => {
    const tagMap = new Map<string, TagInfo>();
    cards.forEach((card) => {
      card.tags.forEach((tag) => {
        const existing = tagMap.get(tag);
        if (existing) {
          existing.count++;
        } else {
          tagMap.set(tag, { name: tag, color: getTagColor(tag), count: 1 });
        }
      });
    });
    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
  }, [cards]);

  const totalCount = cards.length;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 lg:z-0
          w-64 h-screen bg-beige-dark border-r border-beige-deeper
          flex flex-col transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}
        `}
      >
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            <Tag size={18} className="text-olive" />
            <h2 className="font-serif text-lg font-bold text-olive">标签</h2>
          </div>

          <button
            onClick={() => setSelectedTag(null)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm
              transition-all duration-200 mb-1
              ${selectedTag === null
                ? 'bg-olive text-white shadow-sm'
                : 'text-olive hover:bg-beige-deeper'
              }
            `}
          >
            <Hash size={16} />
            <span className="font-medium">全部卡片</span>
            <span className={`ml-auto text-xs ${selectedTag === null ? 'text-white/70' : 'text-brown'}`}>
              {totalCount}
            </span>
          </button>

          <div className="mt-2 space-y-1">
            {tags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm
                  transition-all duration-200
                  ${selectedTag === tag.name
                    ? 'bg-olive text-white shadow-sm'
                    : 'text-olive hover:bg-beige-deeper'
                  }
                `}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="font-medium truncate">{tag.name}</span>
                <span className={`ml-auto text-xs flex-shrink-0 ${selectedTag === tag.name ? 'text-white/70' : 'text-brown'}`}>
                  {tag.count}
                </span>
              </button>
            ))}
          </div>

          {tags.length === 0 && (
            <div className="text-center py-8">
              <p className="text-brown text-sm">暂无标签</p>
              <p className="text-brown/60 text-xs mt-1">创建卡片时添加标签</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-beige-deeper">
          <Link
            to="/new"
            className="flex items-center justify-center gap-2 w-full bg-olive hover:bg-olive-light text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            <X size={16} className="rotate-45" />
            新建卡片
          </Link>
        </div>
      </aside>
    </>
  );
}
