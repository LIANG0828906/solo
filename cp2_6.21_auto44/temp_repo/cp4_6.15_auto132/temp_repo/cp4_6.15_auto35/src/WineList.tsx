import { useState, useMemo, useCallback, useEffect } from 'react';
import { useWineStore } from './store';
import { WineSvg } from './icons';
import AnimatedNumber from './AnimatedNumber';
import { formatCurrency } from './utils';
import {
  REGION_DATA,
  ALL_COUNTRIES,
  GRAPE_VARIETIES,
  WINE_TYPES,
} from './types';
import type { WineType } from './types';
import { WineCard } from './WineCard';

interface WineListProps {
  onSelectWine: (id: string) => void;
  onAddWine: () => void;
  showAddModal: boolean;
  onCloseAdd: () => void;
}

export default function WineList({ onSelectWine, onAddWine, showAddModal, onCloseAdd }: WineListProps) {
  const { wines, addWine } = useWineStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [minRating, setMinRating] = useState<string>('');
  const [maxRating, setMaxRating] = useState<string>('');
  const [filterExpanded, setFilterExpanded] = useState(false);

  const [newWine, setNewWine] = useState({
    name: '',
    country: '',
    region: '',
    subRegion: '',
    grapeVarieties: [] as string[],
    vintage: new Date().getFullYear(),
    type: 'red' as WineType,
    quantity: 1,
    price: 0,
    rating: 85,
  });

  const availableRegions = useMemo(() => {
    if (!newWine.country || !REGION_DATA[newWine.country]) return [];
    return Object.keys(REGION_DATA[newWine.country]);
  }, [newWine.country]);

  const availableSubRegions = useMemo(() => {
    if (!newWine.country || !newWine.region) return [];
    return REGION_DATA[newWine.country]?.[newWine.region] || [];
  }, [newWine.country, newWine.region]);

  const filteredWines = useMemo(() => {
    let result = [...wines];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((w) =>
        w.name.toLowerCase().includes(q) ||
        w.country.toLowerCase().includes(q) ||
        w.region.toLowerCase().includes(q) ||
        w.grapeVarieties.some((g) => g.toLowerCase().includes(q))
      );
    }

    if (filterType !== 'all') {
      result = result.filter((w) => w.type === filterType);
    }

    if (filterCountry !== 'all') {
      result = result.filter((w) => w.country === filterCountry);
    }

    if (minRating) {
      result = result.filter((w) => w.rating >= Number(minRating));
    }
    if (maxRating) {
      result = result.filter((w) => w.rating <= Number(maxRating));
    }

    result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [wines, searchQuery, filterType, filterCountry, minRating, maxRating]);

  const stats = useMemo(() => {
    const totalWines = wines.reduce((sum, w) => sum + w.quantity, 0);
    const totalCost = wines.reduce((sum, w) => sum + w.price * w.quantity, 0);
    const avgRating = wines.length > 0
      ? wines.reduce((sum, w) => sum + w.rating, 0) / wines.length
      : 0;
    const topWine = wines.length > 0
      ? [...wines].sort((a, b) => b.rating - a.rating)[0]
      : null;
    return { totalWines, totalCost, avgRating, topWine };
  }, [wines]);

  const toggleGrape = useCallback((grape: string) => {
    setNewWine((prev) => ({
      ...prev,
      grapeVarieties: prev.grapeVarieties.includes(grape)
        ? prev.grapeVarieties.filter((g) => g !== grape)
        : [...prev.grapeVarieties, grape],
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newWine.name || !newWine.country || !newWine.region || !newWine.subRegion) {
      return;
    }
    addWine(newWine);
    setNewWine({
      name: '',
      country: '',
      region: '',
      subRegion: '',
      grapeVarieties: [],
      vintage: new Date().getFullYear(),
      type: 'red',
      quantity: 1,
      price: 0,
      rating: 85,
    });
    onCloseAdd();
  }, [newWine, addWine, onCloseAdd]);

  const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewWine((prev) => ({ ...prev, country: e.target.value, region: '', subRegion: '' }));
  }, []);

  const handleRegionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewWine((prev) => ({ ...prev, region: e.target.value, subRegion: '' }));
  }, []);

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddModal]);

  return (
    <div className="wine-list-page">
      <section className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon wine">
            <WineSvg size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">总藏酒</div>
            <div className="stat-value">
              <AnimatedNumber value={stats.totalWines} suffix=" 瓶" />
            </div>
            <div className="stat-sub">{wines.length} 款酒</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon money">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">总花费</div>
            <div className="stat-value">
              <AnimatedNumber value={Math.round(stats.totalCost / 100)} suffix=" 百" />
            </div>
            <div className="stat-sub">{formatCurrency(stats.totalCost)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon star">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">最高评分</div>
            <div className="stat-value">
              <AnimatedNumber value={stats.topWine?.rating || 0} />
            </div>
            <div className="stat-sub">{stats.topWine?.name || '暂无'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon chart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">平均评分</div>
            <div className="stat-value">
              <AnimatedNumber value={stats.avgRating} decimals={1} />
            </div>
            <div className="stat-sub">所有酒款平均</div>
          </div>
        </div>
      </section>

      <section className="filter-section">
        <button
          className="filter-toggle-btn"
          onClick={() => setFilterExpanded(!filterExpanded)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {filterExpanded ? '收起筛选' : '展开筛选'}
        </button>

        <div className={`filter-panel ${filterExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="search-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="filter-input"
              placeholder="搜索酒名、产区、品种..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">类型</label>
            <select
              className="filter-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">全部类型</option>
              {WINE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">国家</label>
            <select
              className="filter-input"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            >
              <option value="all">全部国家</option>
              {ALL_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">评分区间</label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="number"
                className="filter-input"
                placeholder="最低"
                min="60"
                max="100"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              />
              <span style={{ color: 'var(--brown-light)' }}>-</span>
              <input
                type="number"
                className="filter-input"
                placeholder="最高"
                min="60"
                max="100"
                value={maxRating}
                onChange={(e) => setMaxRating(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem' }}>
            藏酒列表 <span style={{ color: 'var(--brown-light)', fontSize: '0.9rem', fontWeight: 400 }}>({filteredWines.length} 款)</span>
          </h2>
          <button className="btn-primary" onClick={onAddWine}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加藏酒
          </button>
        </div>

        {filteredWines.length > 0 ? (
          <div className="wine-grid">
            {filteredWines.map((wine) => (
              <WineCard
                key={wine.id}
                wine={wine}
                onClick={() => onSelectWine(wine.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2h8l1 7H7l1-7z" />
              <path d="M7 9v7a5 5 0 0 0 10 0V9" />
              <line x1="12" y1="22" x2="12" y2="16" />
            </svg>
            <p>暂无符合条件的藏酒</p>
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="modal-overlay" onClick={onCloseAdd}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加藏酒</h2>
              <button className="modal-close" onClick={onCloseAdd}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">酒名</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="请输入酒款名称"
                    value={newWine.name}
                    onChange={(e) => setNewWine((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">国家</label>
                    <select className="form-select" value={newWine.country} onChange={handleCountryChange}>
                      <option value="">选择国家</option>
                      {ALL_COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">产区</label>
                    <select
                      className="form-select"
                      value={newWine.region}
                      onChange={handleRegionChange}
                      disabled={!newWine.country}
                    >
                      <option value="">选择产区</option>
                      {availableRegions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">子产区</label>
                    <select
                      className="form-select"
                      value={newWine.subRegion}
                      onChange={(e) => setNewWine((p) => ({ ...p, subRegion: e.target.value }))}
                      disabled={!newWine.region}
                    >
                      <option value="">选择子产区</option>
                      {availableSubRegions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">葡萄品种（可多选）</label>
                  <div className="grape-tags">
                    {GRAPE_VARIETIES.map((grape) => (
                      <button
                        key={grape}
                        type="button"
                        className={`grape-tag ${newWine.grapeVarieties.includes(grape) ? 'selected' : ''}`}
                        onClick={() => toggleGrape(grape)}
                      >
                        {grape}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">年份</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newWine.vintage}
                      min="1900"
                      max={new Date().getFullYear()}
                      onChange={(e) => setNewWine((p) => ({ ...p, vintage: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">类型</label>
                    <select
                      className="form-select"
                      value={newWine.type}
                      onChange={(e) => setNewWine((p) => ({ ...p, type: e.target.value as WineType }))}
                    >
                      {WINE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">数量（瓶）</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={newWine.quantity}
                      onChange={(e) => setNewWine((p) => ({ ...p, quantity: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">购买价格（元）</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={newWine.price}
                      onChange={(e) => setNewWine((p) => ({ ...p, price: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">初始评分：{newWine.rating} 分</label>
                  <div className="slider-track" style={{ marginTop: '8px' }}>
                    <div
                      className="slider-fill"
                      style={{ width: `${((newWine.rating - 60) / 40) * 100}%` }}
                    />
                    <div
                      className="slider-thumb"
                      style={{ left: `${((newWine.rating - 60) / 40) * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={newWine.rating}
                    onChange={(e) => setNewWine((p) => ({ ...p, rating: Number(e.target.value) }))}
                    style={{ width: '100%', opacity: 0, position: 'absolute', height: '20px', cursor: 'pointer' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={onCloseAdd}>
                  取消
                </button>
                <button type="submit" className="btn-submit">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
