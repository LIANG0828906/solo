import { useMemo } from 'react';
import type { EmojiItem } from '../data/emojis';

interface Category {
  id: string;
  label: string;
}

interface EmojiGridProps {
  categories: Category[];
  emojis: EmojiItem[];
  searchResults: EmojiItem[] | null;
  onEmojiClick: (item: EmojiItem) => void;
  isCollected: (emoji: string) => boolean;
  matchesQuery: (item: EmojiItem, query: string) => boolean;
  searchQuery: string;
}

function EmojiGrid({
  categories,
  emojis,
  searchResults,
  onEmojiClick,
  isCollected,
  matchesQuery,
  searchQuery
}: EmojiGridProps) {
  const categorizedEmojis = useMemo(() => {
    if (searchResults !== null) {
      const map = new Map<string, EmojiItem[]>();
      for (const c of categories) {
        map.set(c.id, []);
      }
      for (const e of searchResults) {
        const arr = map.get(e.category);
        if (arr) arr.push(e);
      }
      return categories
        .filter((c) => (map.get(c.id)?.length ?? 0) > 0)
        .map((c) => ({ ...c, emojis: map.get(c.id) ?? [] }));
    }

    return categories.map((c) => {
      const catEmojis = searchQuery.trim()
        ? emojis.filter(
            (e) => e.category === c.id && matchesQuery(e, searchQuery)
          )
        : emojis.filter((e) => e.category === c.id);
      return { ...c, emojis: catEmojis };
    });
  }, [categories, emojis, searchResults, searchQuery, matchesQuery]);

  if (searchResults !== null && searchResults.length === 0) {
    return (
      <div className="sidebar-empty" style={{ padding: '64px 24px' }}>
        <div className="sidebar-empty-icon">🔍</div>
        <div className="sidebar-empty-text">
          未找到匹配的表情符号
          <br />
          请尝试其他关键词
        </div>
      </div>
    );
  }

  return (
    <div className="categories-grid">
      {categorizedEmojis.map((cat) =>
        cat.emojis.length > 0 ? (
          <section key={cat.id} className="category-card">
            <h2 className="category-title">{cat.label}</h2>
            <div className="emoji-grid">
              {cat.emojis.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  className={`emoji-cell ${isCollected(item.emoji) ? 'collected' : ''}`}
                  onClick={() => onEmojiClick(item)}
                  title={item.name}
                  aria-label={item.name}
                >
                  <span className="emoji" aria-hidden="true">
                    {item.emoji}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}

export default EmojiGrid;
