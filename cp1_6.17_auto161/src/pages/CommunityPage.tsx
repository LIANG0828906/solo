import React, { useEffect, useRef, useCallback, useState } from 'react';
import Card from '../components/Card';
import { useAppStore } from '../store/useAppStore';
import { fetchCommunityCards } from '../modules/community/CommunityController';
import {
  FLAVOR_OPTIONS,
  ORIGIN_OPTIONS,
  ROAST_OPTIONS,
} from '../modules/community/CommunityService';
import { BrewingRecord } from '../modules/brewing/BrewingService';

const CommunityPage: React.FC = () => {
  const {
    communityFilters,
    setCommunityFilters,
    resetCommunityFilters,
    communityCards,
    setCommunityCards,
    appendCommunityCards,
    communityPage,
    setCommunityPage,
    hasMoreCards,
    setHasMoreCards,
    isLoading,
    setIsLoading,
  } = useAppStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadCards = useCallback(async (page: number = 1, reset: boolean = true) => {
    setIsLoading(true);
    try {
      const result = await fetchCommunityCards(communityFilters, page, 20);
      if (reset) {
        setCommunityCards(result.records);
      } else {
        appendCommunityCards(result.records);
      }
      setCommunityPage(page);
      setHasMoreCards(result.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      if (!initialLoaded) setInitialLoaded(true);
    }
  }, [communityFilters, setCommunityCards, appendCommunityCards, setCommunityPage, setHasMoreCards, setIsLoading, initialLoaded]);

  useEffect(() => {
    loadCards(1, true);
  }, [communityFilters]);

  const handleScroll = useCallback(() => {
    if (isLoading || !hasMoreCards) return;
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      loadCards(communityPage + 1, false);
    }
  }, [isLoading, hasMoreCards, communityPage, loadCards]);

  const toggleFlavor = (key: string) => {
    const current = communityFilters.flavors;
    const next = current.includes(key)
      ? current.filter(f => f !== key)
      : [...current, key];
    setCommunityFilters({ flavors: next });
  };

  const columns: BrewingRecord[][] = [[], [], []];
  communityCards.forEach((card, idx) => {
    columns[idx % 3].push(card);
  });

  return (
    <div className="community-page">
      <div className="page-header community-header">
        <div className="page-icon">🌍</div>
        <div>
          <h1 className="page-title">社区分享</h1>
          <p className="page-subtitle">探索咖啡爱好者的冲煮配方</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" className="search-icon" fill="none" stroke="#BDC3C7" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="搜索咖啡豆或参数..."
            value={communityFilters.search}
            onChange={e => setCommunityFilters({ search: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={communityFilters.origin}
            onChange={e => setCommunityFilters({ origin: e.target.value === '全部产地' ? '' : e.target.value })}
          >
            {ORIGIN_OPTIONS.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <div className="roast-filter">
            {ROAST_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`roast-filter-btn ${communityFilters.roastLevel === opt.key ? 'active' : ''}`}
                onClick={() => setCommunityFilters({ roastLevel: opt.key })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flavor-filter-group">
          <span className="filter-label">风味倾向:</span>
          {FLAVOR_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`flavor-filter-btn ${communityFilters.flavors.includes(opt.key) ? 'active' : ''}`}
              onClick={() => toggleFlavor(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button type="button" className="reset-filter-btn" onClick={resetCommunityFilters}>
          重置筛选
        </button>
      </div>

      {(communityFilters.search || communityFilters.origin || communityFilters.roastLevel || communityFilters.flavors.length > 0) && (
        <div className="filtered-horizontal-scroll">
          <div className="scroll-label">筛选结果 ({communityCards.length} 条)</div>
          <div className="horizontal-scroll-track">
            {communityCards.map(card => (
              <div key={card.id} className="compact-card">
                <span className="compact-origin">{card.origin}</span>
                <span className="compact-name" title={card.beanName}>{card.beanName}</span>
                <span className="compact-extraction">{card.extractionRate.toFixed(2)}%</span>
              </div>
            ))}
            {communityCards.length === 0 && !isLoading && (
              <div className="no-results">没有符合条件的结果</div>
            )}
          </div>
        </div>
      )}

      <div
        className="waterfall-container"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {!initialLoaded && isLoading ? (
          <div className="loading-placeholder">
            <div className="loading-spinner" />
            <span>加载中...</span>
          </div>
        ) : (
          <>
            <div className="waterfall-columns">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="waterfall-column">
                  {col.map(card => (
                    <Card key={card.id} record={card} />
                  ))}
                </div>
              ))}
            </div>

            {isLoading && (
              <div className="loading-more">
                <div className="loading-spinner small" />
                <span>加载更多...</span>
              </div>
            )}

            {!hasMoreCards && communityCards.length > 0 && (
              <div className="no-more">— 已显示全部 {communityCards.length} 条 —</div>
            )}

            {!isLoading && communityCards.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div>暂无分享内容</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
