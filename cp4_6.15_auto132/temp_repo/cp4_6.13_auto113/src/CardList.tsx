import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store';
import { getTagColor } from '@/utils/storage';
import { Clock, ArrowRight } from 'lucide-react';

export default function CardList() {
  const getFilteredCards = useStore((s) => s.getFilteredCards);
  const selectedTag = useStore((s) => s.selectedTag);
  const setSelectedTag = useStore((s) => s.setSelectedTag);
  const [animKey, setAnimKey] = useState(0);

  const cards = useMemo(() => getFilteredCards(), [getFilteredCards, useStore((s) => s.cards)]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    setAnimKey((k) => k + 1);
  };

  return (
    <div key={animKey} className="animate-fade-in">
      {selectedTag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-brown">当前筛选：</span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-white font-medium"
            style={{ backgroundColor: getTagColor(selectedTag) }}
          >
            {selectedTag}
            <button
              onClick={() => { setSelectedTag(null); setAnimKey((k) => k + 1); }}
              className="ml-1 hover:opacity-70 transition-opacity"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brown/60">
          <div className="w-16 h-16 rounded-full bg-beige-deeper flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brown/40">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </div>
          <p className="text-lg font-medium">还没有卡片</p>
          <p className="text-sm mt-1">点击"新建卡片"开始记录知识</p>
          <Link
            to="/new"
            className="mt-4 flex items-center gap-1.5 bg-olive hover:bg-olive-light text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
          >
            创建第一张卡片
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, index) => (
            <Link
              key={card.id}
              to={`/card/${card.id}`}
              className="group bg-white rounded-xl p-5 shadow-sm border border-beige-deeper/50
                hover:-translate-y-0.5 hover:shadow-lg hover:shadow-olive/8
                transition-all duration-200 ease-out"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <h3 className="font-serif font-bold text-olive text-base mb-2 line-clamp-2 group-hover:text-olive-light transition-colors">
                {card.title}
              </h3>

              <p className="text-sm text-brown/70 line-clamp-3 mb-3 leading-relaxed">
                {card.content.replace(/[#*_`>\[\]()\-]/g, '').slice(0, 120)}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {card.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTagClick(tag); }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: getTagColor(tag) }}
                    >
                      {tag}
                    </span>
                  ))}
                  {card.tags.length > 3 && (
                    <span className="text-xs text-brown/50 self-center">+{card.tags.length - 3}</span>
                  )}
                </div>

                <span className="flex items-center gap-1 text-xs text-brown/40">
                  <Clock size={12} />
                  {new Date(card.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
