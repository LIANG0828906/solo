import React, { useMemo } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { LibraryProvider } from '../modules/library/LibraryProvider';
import type { CategoryType } from '../types';
import LibraryItemView from './LibraryItem';

const TABS: { key: CategoryType; label: string }[] = [
  { key: 'stickers', label: '贴纸' },
  { key: 'shapes', label: '形状' },
  { key: 'fills', label: '填充色' },
  { key: 'recent', label: '最近使用' },
  { key: 'all', label: '全部' },
];

export const LibraryPanel: React.FC = () => {
  const activeCategory = useCanvasStore((s) => s.activeCategory);
  const searchQuery = useCanvasStore((s) => s.searchQuery);
  const setActiveCategory = useCanvasStore((s) => s.setActiveCategory);
  const setSearchQuery = useCanvasStore((s) => s.setSearchQuery);

  const items = useMemo(
    () => LibraryProvider.getItemsByCategory(activeCategory),
    [activeCategory, searchQuery]
  );

  return (
    <aside className="library-panel">
      <input
        type="text"
        className="library-search"
        placeholder="搜索贴纸或形状..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="library-tabs">
        {TABS.map((tab) => (
          <div
            key={tab.key}
            className={`library-tab ${activeCategory === tab.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className="library-content">
        {items.length === 0 ? (
          <div className="library-empty">暂无素材</div>
        ) : (
          <div className="library-grid">
            {items.map((item) => (
              <LibraryItemView key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default LibraryPanel;
