import { useState, useMemo, useEffect, useRef } from 'react';
import type { Movie, Category } from './types';
import { ALL_CATEGORIES, FilterState, createDefaultFilterState } from './types';
import StarRating from './StarRating';
import RangeSlider from './RangeSlider';
import { useDebounce } from './hooks/useDebounce';

interface MovieListProps {
  movies: Movie[];
  onSelectMovie: (id: string) => void;
  onAddMovie: () => void;
}

export default function MovieList({ movies, onSelectMovie, onAddMovie }: MovieListProps) {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<FilterState>(createDefaultFilterState());
  const [fading, setFading] = useState(false);
  const [gridKey, setGridKey] = useState(0);
  const fadeTimer = useRef<number | null>(null);

  const debouncedSearch = useDebounce(filters.search, 300);

  const triggerFade = () => {
    setFading(true);
    setGridKey((k) => k + 1);
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => setFading(false), 400);
  };

  useEffect(() => {
    triggerFade();
  }, [
    debouncedSearch,
    filters.yearRange,
    filters.ratingRange,
    filters.selectedCategories,
  ]);

  useEffect(() => {
    return () => {
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    };
  }, []);

  const filteredMovies = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return movies.filter((m) => {
      if (q) {
        const match =
          m.titleCn.toLowerCase().includes(q) ||
          m.titleEn.toLowerCase().includes(q) ||
          m.director.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (m.year < filters.yearRange[0] || m.year > filters.yearRange[1]) return false;
      if (m.rating < filters.ratingRange[0] || m.rating > filters.ratingRange[1]) return false;
      if (filters.selectedCategories.length > 0) {
        if (!filters.selectedCategories.some((c) => m.categories.includes(c))) return false;
      }
      return true;
    });
  }, [
    movies,
    debouncedSearch,
    filters.yearRange,
    filters.ratingRange,
    filters.selectedCategories,
  ]);

  const setSearch = (v: string) =>
    setFilters((prev) => ({ ...prev, search: v }));
  const setYearRange = (v: [number, number]) =>
    setFilters((prev) => ({ ...prev, yearRange: v }));
  const setRatingRange = (v: [number, number]) =>
    setFilters((prev) => ({ ...prev, ratingRange: v }));

  const toggleCategory = (c: Category) => {
    setFilters((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(c)
        ? prev.selectedCategories.filter((x) => x !== c)
        : [...prev.selectedCategories, c],
    }));
  };

  const clearFilters = () => {
    setFilters(createDefaultFilterState());
  };

  const hasActiveFilters =
    filters.search ||
    filters.selectedCategories.length > 0 ||
    filters.yearRange[0] !== 1980 ||
    filters.yearRange[1] !== currentYear ||
    filters.ratingRange[0] !== 0 ||
    filters.ratingRange[1] !== 10;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">我的电影收藏</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
            共 {filteredMovies.length} / {movies.length} 部电影
          </div>
        </div>
        <button className="btn" onClick={onAddMovie}>
          <span>➕</span>
          <span>添加电影</span>
        </button>
      </div>

      <div className="glass filters-section">
        <div className="search-row">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="🔍  搜索片名、导演..."
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 16 }}
            />
          </div>
          {hasActiveFilters && (
            <button className="btn btn-secondary" onClick={clearFilters}>
              清除筛选
            </button>
          )}
        </div>

        <div className="filter-row">
          <div>
            <label>上映年份</label>
            <RangeSlider
              min={1980}
              max={currentYear}
              value={filters.yearRange}
              onChange={setYearRange}
            />
          </div>
          <div>
            <label>个人评分</label>
            <RangeSlider
              min={0}
              max={10}
              value={filters.ratingRange}
              onChange={setRatingRange}
            />
          </div>
          <div>
            <label>分类标签</label>
            <div className="category-chips">
              {ALL_CATEGORIES.map((c) => (
                <div
                  key={c}
                  className={`chip ${filters.selectedCategories.includes(c) ? 'active' : ''}`}
                  onClick={() => toggleCategory(c)}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎞️</div>
          <div className="empty-title">
            {movies.length === 0 ? '还没有收藏任何电影' : '没有符合条件的电影'}
          </div>
          <div className="empty-desc">
            {movies.length === 0
              ? '点击"添加电影"按钮，开始记录你的观影之旅吧！'
              : '试试调整筛选条件，或清除筛选查看全部'}
          </div>
          {movies.length === 0 && (
            <button className="btn" onClick={onAddMovie}>
              添加第一部电影
            </button>
          )}
        </div>
      ) : (
        <div
          className={`movies-grid ${fading ? 'fading' : ''}`}
          key={`grid-${gridKey}`}
        >
          {filteredMovies.map((m, idx) => (
            <div
              key={`${gridKey}-${m.id}`}
              className="movie-card glass"
              style={{ animationDelay: `${Math.min(idx, 20) * 0.05}s` }}
              onClick={() => onSelectMovie(m.id)}
            >
              <div className="poster-wrapper">
                <img src={m.poster} alt={m.titleCn} loading="lazy" />
              </div>
              <div className="card-info">
                <div className="card-title">{m.titleCn}</div>
                <div className="card-title-en">{m.titleEn}</div>
                <StarRating rating={m.rating} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
