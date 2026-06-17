import { useAppStore } from '@/store/appStore';
import { isCardMatchingFilter, getTagColor } from '@/shared/cardTypes';
import { Plus, Trash2, Edit3 } from 'lucide-react';

export default function CardList() {
  const cards = useAppStore(s => s.cards);
  const relations = useAppStore(s => s.relations);
  const searchQuery = useAppStore(s => s.searchQuery);
  const selectedTags = useAppStore(s => s.selectedTags);
  const openEditor = useAppStore(s => s.openEditor);
  const removeCard = useAppStore(s => s.removeCard);
  const newlyCreatedCardId = useAppStore(s => s.newlyCreatedCardId);

  const filteredCards = cards.filter(c => isCardMatchingFilter(c, searchQuery, selectedTags));

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <button
          onClick={() => openEditor()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[#1A1A2E] font-semibold font-display text-sm transition-all duration-200 hover:brightness-110 active:scale-95"
          style={{ backgroundColor: '#6BCB77' }}
        >
          <Plus size={16} />
          新建灵感
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 custom-scrollbar">
        {filteredCards.map(card => {
          const isNew = card.id === newlyCreatedCardId;
          const relCount = relations.filter(r => r.sourceId === card.id || r.targetId === card.id).length;

          return (
            <div
              key={card.id}
              className={`group relative p-3 rounded-xl border transition-all duration-200 hover:bg-[#2D2D44]/50 active:scale-[0.98] ${
                isNew ? 'animate-pulse-border' : 'border-[#2A2A44]'
              }`}
              style={{ backgroundColor: '#1A1A2E' }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-medium text-sm text-[#E0E0E0] leading-snug truncate">
                  {card.title}
                </h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditor(card); }}
                    className="p-1 rounded-md hover:bg-[#2A2A44] transition-colors"
                  >
                    <Edit3 size={12} className="text-[#9999AA]" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCard(card.id); }}
                    className="p-1 rounded-md hover:bg-[#2A2A44] transition-colors"
                  >
                    <Trash2 size={12} className="text-[#FF6B6B]" />
                  </button>
                </div>
              </div>

              {card.description && (
                <p className="mt-1 text-xs text-[#9999AA] leading-relaxed line-clamp-2">
                  {card.description}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-1">
                {card.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium text-white"
                    style={{ backgroundColor: getTagColor(tag) + 'CC' }}
                  >
                    {tag}
                  </span>
                ))}
                {relCount > 0 && (
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#2D2D44] text-[#4ECDC4]">
                    {relCount} 关联
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredCards.length === 0 && (
          <div className="text-center py-8 text-[#9999AA] text-sm">
            暂无灵感卡片
          </div>
        )}
      </div>
    </div>
  );
}
