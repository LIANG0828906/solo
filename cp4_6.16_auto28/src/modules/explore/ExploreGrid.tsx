import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ColorCard from '../colors/ColorCard';
import { usePaletteStore } from '@/stores/usePaletteStore';
import { loadAllPalettes } from '@/utils/indexedDB';
import type { Palette } from '@/types';
import './ExploreGrid.css';

const PAGE_SIZE = 20;
const VIRTUAL_THRESHOLD = 100;
const CARD_HEIGHT_ESTIMATE = 240;
const GRID_GAP = 24;

const ExploreGrid: React.FC = () => {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { sortBy, setSortBy } = usePaletteStore((state) => ({
    sortBy: state.sortBy,
    setSortBy: state.setSortBy,
  }));

  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  const useVirtualScroll = sortedPalettes.length > VIRTUAL_THRESHOLD;

  const loadMore = useCallback(() => {
    if (isLoadingMore || visibleCount >= sortedPalettes.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sortedPalettes.length));
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, visibleCount, sortedPalettes.length]);

  useEffect(() => {
    if (loading || !sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, isLoadingMore, loadMore]);

  const handleSortChange = useCallback(
    (sort: 'popular' | 'latest') => {
      if (sort !== sortBy) {
        setSortBy(sort);
        setVisibleCount(PAGE_SIZE);
        if (gridRef.current) {
          gridRef.current.scrollTop = 0;
        }
      }
    },
    [sortBy, setSortBy]
  );

  const handleFavoriteToggle = useCallback(() => {
    loadPalettes();
  }, [loadPalettes]);

  const visiblePalettes = useMemo(() => {
    return sortedPalettes.slice(0, visibleCount);
  }, [sortedPalettes, visibleCount]);

  const virtualConfig = useMemo(() => {
    if (!useVirtualScroll) return null;

    const itemsPerRow = 3;
    const rowCount = Math.ceil(visibleCount / itemsPerRow);
    const totalHeight =
      Math.ceil(sortedPalettes.length / itemsPerRow) *
      (CARD_HEIGHT_ESTIMATE + GRID_GAP);

    return { itemsPerRow, rowCount, totalHeight };
  }, [useVirtualScroll, visibleCount, sortedPalettes.length]);

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
            <span className="palette-count">
              （共 {sortedPalettes.length} 个色卡）
            </span>
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
          <p className="empty-desc">成为第一个分享配色方案的设计师吧！</p>
        </div>
      ) : (
        <>
          <div
            ref={gridRef}
            className={`palette-grid ${useVirtualScroll ? 'virtual-scroll' : ''}`}
            style={
              virtualConfig
                ? ({
                    '--item-count': visiblePalettes.length,
                    height: `${virtualConfig.totalHeight}px`,
                  } as React.CSSProperties)
                : ({ '--item-count': visiblePalettes.length } as React.CSSProperties)
            }
          >
            {visiblePalettes.map((palette, index) => (
              <div
                key={palette.id}
                className="grid-item"
                style={{
                  transitionDelay: `${Math.min(index * 10, 300)}ms`,
                  order: index,
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
            <>
              <div ref={sentinelRef} className="scroll-sentinel" />
              {isLoadingMore && (
                <div className="loading-more">
                  <div className="loading-spinner" />
                  <span>加载中...</span>
                </div>
              )}
            </>
          )}

          {visibleCount >= sortedPalettes.length && palettes.length > 0 && (
            <div className="end-of-list">
              <span>— 已经到底啦 —</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExploreGrid;
