import { useMemo } from 'react';
import { useExhibitStore } from '../store';
import ExhibitCard from './ExhibitCard';
import type { Exhibit } from '../types';
import './ExhibitionGrid.css';

interface ExhibitionGridProps {
  exhibits: Exhibit[];
  loading?: boolean;
}

function ExhibitionGrid({ exhibits, loading }: ExhibitionGridProps) {
  const { viewMode, searchKeyword, selectedTags, isLoading: storeLoading } = useExhibitStore();

  const filteredExhibits = useMemo(() => {
    const keyword = searchKeyword.toLowerCase().trim();
    return exhibits.filter((exhibit) => {
      const matchesKeyword = !keyword ||
        exhibit.title.toLowerCase().includes(keyword) ||
        exhibit.description.toLowerCase().includes(keyword) ||
        exhibit.tags.some((t) => t.toLowerCase().includes(keyword));

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every((tag) => exhibit.tags.includes(tag));

      return matchesKeyword && matchesTags;
    });
  }, [exhibits, searchKeyword, selectedTags]);

  const showLoading = loading || storeLoading;

  if (showLoading) {
    return (
      <div className={`exhibition-grid ${viewMode}`}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={`exhibit-card skeleton ${viewMode}`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="skeleton-image" />
            <div className="skeleton-content">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-desc" />
              <div className="skeleton-tags">
                <div className="skeleton-tag" />
                <div className="skeleton-tag" />
                <div className="skeleton-tag" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredExhibits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🖼️</div>
        <h3 className="empty-title">暂无展品</h3>
        <p className="empty-desc">
          {searchKeyword || selectedTags.length > 0
            ? '没有找到匹配的展品，试试其他关键词'
            : '点击右下角按钮添加你的第一件展品吧'}
        </p>
      </div>
    );
  }

  return (
    <div className={`exhibition-grid ${viewMode} view-transition`}>
      {filteredExhibits.map((exhibit, index) => (
        <ExhibitCard
          key={exhibit.id}
          exhibit={exhibit}
          index={index}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}

export default ExhibitionGrid;
