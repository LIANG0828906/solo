import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ColorCard from '../colors/ColorCard';
import { usePaletteStore } from '@/stores/usePaletteStore';
import { loadAllPalettes } from '@/utils/indexedDB';
import type { Palette } from '@/types';
import './ExploreGrid.css';

const PAGE_SIZE = 20;

const ExploreGrid: React.FC = () => {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { sortBy, setSortBy } = usePaletteStore((state) => ({
    sortBy: state.sortBy,
    setSortBy: state.setSortBy,
  }));

  const loadPalettes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadAllPalettes();
      setPalettes(data);
    } catch (error) {
      console.error('加载色卡列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPalettes();
  }, [loadPalettes]);

  const sortedPalettes = useMemo(() => {
    const sorted = [...palettes];
    if (sortBy === 'popular') {
      sorted.sort((a, b) => b.favoriteCount - a.favoriteCount);
    } else {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    }
    return sorted;
  }, [palettes, sortBy]);

  const visiblePalettes = useMemo(() => {
    return sortedPalettes.slice(0, visibleCount);
  }, [sortedPalettes, visibleCount]);

  const handleSortChange = useCallback(
    (sort: 'popular' | 'latest') => {
      if (sort !== sortBy) {
        setSortBy(sort);
        setVisibleCount(PAGE_SIZE);
      }
    },
    [sortBy, setSortBy]
  );

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  const handleFavoriteToggle = useCallback(() => {
    loadPalettes();
  }, [loadPalettes]);

  if (loading && palettes.length === 0) {
    return (
      <div className="explore-grid-container">
        <div className="explore-header">
          <h1 className="explore-title">社区灵感</h1>
        </div>
        <div className="grid-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="explore-grid-container">
      <div className="explore-header">
        <div className="header-left">
          <h1 className="explore-title">社区灵感</h1>
          <p className="explore-subtitle">
            发现设计师们分享的精彩配色方案
          </p>
        </div>
        <div className="sort-controls">
          <button
            type="button"
            className={`sort-btn ${sortBy === 'popular' ? 'active' : ''}`}
            onClick={() => handleSortChange('popular')}
          >
            🔥 热门
          </button>
          <button
            type="button"
            className={`sort-btn ${sortBy === 'latest' ? 'active' : ''}`}
            onClick={() => handleSortChange('latest')}
          >
            🆕 最新
          </button>
        </div>
      </div>

      {palettes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3 className="empty-title">还没有配色方案</h3>
          <p className="empty-desc">
            成为第一个分享配色方案的设计师吧！
          </p>
        </div>
      ) : (
        <>
          <div
            className="palette-grid"
            style={{ '--item-count': visiblePalettes.length } as React.CSSProperties}
          >
            {visiblePalettes.map((palette, index) => (
              <div
                key={palette.id}
                className="grid-item"
                style={{
                  transitionDelay: `${Math.min(index * 30, 300)}ms`,
                }}
              >
                <ColorCard
                  colorId={palette.id}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              </div>
            ))}
          </div>

          {visibleCount < sortedPalettes.length && (
            <div className="load-more-container">
              <button
                type="button"
                className="btn btn-secondary load-more-btn"
                onClick={handleLoadMore}
              >
                加载更多 ({sortedPalettes.length - visibleCount} 剩余)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExploreGrid;
