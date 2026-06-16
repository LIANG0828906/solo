import React, { useState, useEffect, useMemo } from 'react';
import { useTastingStore } from '../../store/tastingStore';
import { useComparisonStore } from '../../store/comparisonStore';
import { Tasting } from '../../api/tea';
import './TasteHistory.css';

type SortType = 'date-desc' | 'rating-desc' | 'name-asc';

const TasteHistory: React.FC = () => {
  const { tastings, loading, fetchTastings } = useTastingStore();
  const { toggleComparison, isInComparison } = useComparisonStore();

  const [selectedVariety, setSelectedVariety] = useState<string>('全部');
  const [minRating, setMinRating] = useState<number>(1);
  const [sortBy, setSortBy] = useState<SortType>('date-desc');

  useEffect(() => {
    fetchTastings();
  }, [fetchTastings]);

  const varieties = useMemo(() => {
    const uniqueVarieties = [...new Set(tastings.map((t) => t.variety))];
    return ['全部', ...uniqueVarieties];
  }, [tastings]);

  const filteredAndSortedTastings = useMemo(() => {
    let result = [...tastings];

    if (selectedVariety !== '全部') {
      result = result.filter((t) => t.variety === selectedVariety);
    }

    result = result.filter((t) => t.rating >= minRating);

    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
        break;
      case 'rating-desc':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name-asc':
        result.sort((a, b) => a.teaName.localeCompare(b.teaName, 'zh-CN'));
        break;
    }

    return result;
  }, [tastings, selectedVariety, minRating, sortBy]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const maxStars = 10;

    for (let i = 1; i <= maxStars; i++) {
      const filled = i <= rating;
      stars.push(
        <span key={i} className={`star ${filled ? 'filled' : ''}`}>
          ★
        </span>
      );
    }

    return stars;
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="card skeleton-card">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-variety"></div>
        <div className="skeleton-stars">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="skeleton-star"></span>
          ))}
        </div>
        <div className="skeleton-line skeleton-info"></div>
        <div className="skeleton-line skeleton-info"></div>
        <div className="skeleton-line skeleton-btn"></div>
      </div>
    ));
  };

  return (
    <div className="taste-history-container">
      <h1 className="page-title">品鉴历史</h1>

      <div className="filters">
        <div className="filter-group">
          <label>品种筛选</label>
          <select
            value={selectedVariety}
            onChange={(e) => setSelectedVariety(e.target.value)}
            className="filter-select"
          >
            {varieties.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>最低评分: {minRating}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="filter-slider"
          />
        </div>

        <div className="filter-group">
          <label>排序方式</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="filter-select"
          >
            <option value="date-desc">日期（最新）</option>
            <option value="rating-desc">评分（高到低）</option>
            <option value="name-asc">名称（A-Z）</option>
          </select>
        </div>
      </div>

      <div className="cards-grid">
        {loading ? (
          renderSkeletonCards()
        ) : (
          filteredAndSortedTastings.map((tasting, index) => (
            <TastingCard
              key={tasting.id}
              tasting={tasting}
              index={index}
              isInComparison={isInComparison(tasting.id)}
              onToggleComparison={() => toggleComparison(tasting)}
              formatDate={formatDate}
              renderStars={renderStars}
            />
          ))
        )}
      </div>

      {!loading && filteredAndSortedTastings.length === 0 && (
        <div className="empty-state">暂无符合条件的品鉴记录</div>
      )}
    </div>
  );
};

interface TastingCardProps {
  tasting: Tasting;
  index: number;
  isInComparison: boolean;
  onToggleComparison: () => void;
  formatDate: (dateStr: string) => string;
  renderStars: (rating: number) => React.ReactNode;
}

const TastingCard: React.FC<TastingCardProps> = ({
  tasting,
  index,
  isInComparison,
  onToggleComparison,
  formatDate,
  renderStars,
}) => {
  return (
    <div
      className="card tasting-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <h3 className="tea-name">{tasting.teaName}</h3>
      <p className="tea-variety">{tasting.variety}</p>
      
      <div className="rating">{renderStars(tasting.rating)}</div>

      <div className="card-info">
        <span className="info-label">冲泡温度:</span>
        <span className="info-value">{tasting.brewTemperature}°C</span>
      </div>

      <div className="card-info">
        <span className="info-label">品鉴时间:</span>
        <span className="info-value">{formatDate(tasting.createTime)}</span>
      </div>

      <button
        className={`compare-btn ${isInComparison ? 'active' : ''}`}
        onClick={onToggleComparison}
      >
        {isInComparison ? '取消对比' : '加入对比'}
      </button>
    </div>
  );
};

export default TasteHistory;
