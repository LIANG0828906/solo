import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CoffeeRecord, ViewType } from './types';
import CoffeeCard from './CoffeeCard';
import CoffeeForm from './CoffeeForm';
import { RadarChart, BarChartCompare } from './ChartView';

const STORAGE_KEY = 'coffee-tasting-records';

const generateMockRecords = (): CoffeeRecord[] => {
  return [
    {
      id: 'mock-1',
      name: '耶加雪菲 水洗',
      roaster: '晨光咖啡',
      brewingMethod: '手冲',
      aromas: ['花香', '果香', '柑橘', '蜂蜜'],
      acidity: 4,
      body: 3,
      aftertaste: 4,
      overall: 8,
      notes: '茉莉花香明显，带有柠檬和柑橘的明亮酸质，口感干净，尾韵有淡淡蜂蜜甜。水温92度，粉水比1:15，萃取2分30秒。',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'mock-2',
      name: '曼特宁 深烘',
      roaster: '岛屿工坊',
      brewingMethod: '法压壶',
      aromas: ['巧克力', '坚果', '焦糖', '木质'],
      acidity: 2,
      body: 5,
      aftertaste: 4,
      overall: 7,
      notes: '醇厚浓郁，黑巧克力和烤坚果风味突出，低酸度，适合喜欢重口味的。法压4分钟浸泡，口感饱满。',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'mock-3',
      name: '瑰夏 蜜处理',
      roaster: '云澜庄园',
      brewingMethod: '手冲',
      aromas: ['花香', '浆果', '蜂蜜', '发酵'],
      acidity: 5,
      body: 3,
      aftertaste: 5,
      overall: 9,
      notes: '极为惊艳的一杯！玫瑰花香混合草莓、蓝莓的复杂果香，蜂蜜甜感持久，层次非常丰富。低温时更显甜润。',
      date: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'mock-4',
      name: '哥伦比亚 慧兰',
      roaster: '北纬28度',
      brewingMethod: '爱乐压',
      aromas: ['焦糖', '巧克力', '坚果', '奶油'],
      acidity: 3,
      body: 4,
      aftertaste: 4,
      overall: 7,
      notes: '平衡度很好的日常豆，焦糖和牛奶巧克力的香甜，奶油般顺滑的口感。爱乐压倒置法，1分45秒萃取。',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'mock-5',
      name: '肯尼亚 AA',
      roaster: '东非精选',
      brewingMethod: '手冲',
      aromas: ['果香', '柑橘', '浆果', '黑醋栗'],
      acidity: 5,
      body: 3,
      aftertaste: 4,
      overall: 8,
      notes: '黑醋栗和葡萄柚的明亮酸质，番茄汤般的复杂感，甜度中等，干净度高。适合喜欢明亮酸的爱好者。',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'mock-6',
      name: '云南 小粒咖啡',
      roaster: '普洱本土',
      brewingMethod: '冷萃',
      aromas: ['坚果', '巧克力', '焦糖', '草本'],
      acidity: 2,
      body: 4,
      aftertaste: 3,
      overall: 6,
      notes: '冷萃12小时，口感柔和，带有坚果和淡淡草本气息，适合加冰饮用。性价比不错的日常口粮。',
      date: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ];
};

const getScoreBarColor = (score: number, max: number): string => {
  const ratio = Math.max(0, Math.min(1, (score - 1) / (max - 1)));
  const r = Math.round(220 + (46 - 220) * ratio);
  const g = Math.round(80 + (160 - 80) * ratio);
  const b = Math.round(80 + (70 - 80) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
};

const App: React.FC = () => {
  const [records, setRecords] = useState<CoffeeRecord[]>([]);
  const [view, setView] = useState<ViewType>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterKey, setFilterKey] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CoffeeRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          return;
        }
      }
    } catch (e) {
      // ignore
    }
    const mocks = generateMockRecords();
    setRecords(mocks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mocks));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      // ignore
    }
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      if (r.name.toLowerCase().includes(q)) return true;
      if (r.roaster.toLowerCase().includes(q)) return true;
      if (r.aromas.some((a) => a.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [records, searchQuery]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setFilterKey((k) => k + 1);
  }, []);

  const handleToggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (next.size >= 4) {
            return prev;
          }
          next.add(id);
        }
        return next;
      });
    },
    []
  );

  const handleCardClick = useCallback((id: string) => {
    setActiveId(id);
    setView('detail');
    setMobileMenuOpen(false);
  }, []);

  const handleAddRecord = useCallback(() => {
    setView('add');
    setMobileMenuOpen(false);
  }, []);

  const handleGoHome = useCallback(() => {
    setView('list');
    setActiveId(null);
    setSelectedIds(new Set());
    setCompareIds([]);
  }, []);

  const handleFormSubmit = useCallback((record: CoffeeRecord) => {
    setRecords((prev) => [record, ...prev]);
    setView('list');
  }, []);

  const handleCompare = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length < 2) return;
    setCompareIds(ids);
    setView('compare');
    setMobileMenuOpen(false);
  }, [selectedIds]);

  const activeRecord = useMemo(() => {
    if (!activeId) return null;
    return records.find((r) => r.id === activeId) || null;
  }, [activeId, records]);

  const compareRecords = useMemo(() => {
    return compareIds
      .map((id) => records.find((r) => r.id === id))
      .filter(Boolean) as CoffeeRecord[];
  }, [compareIds, records]);

  const renderNavbar = () => (
    <nav className="navbar">
      <div className="navbar-title" onClick={handleGoHome}>
        <span className="icon">☕</span>
        <span>咖啡风味品鉴记录</span>
      </div>
      <button
        className="hamburger"
        onClick={() => setMobileMenuOpen((o) => !o)}
        aria-label="菜单"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>
      <div className={`navbar-actions ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {(view === 'list' || view === 'compare') && (
          <button className="btn btn-primary" onClick={handleAddRecord}>
            + 添加记录
          </button>
        )}
      </div>
    </nav>
  );

  const renderListView = () => (
    <div>
      <div className="search-wrapper">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索咖啡名称、烘焙商或风味标签..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div className="toolbar">
        <div className="compare-info">
          <span>
            共 <b>{filteredRecords.length}</b> 条记录
            {selectedIds.size > 0 && (
              <>
                {' '}
                · 已选择 <b style={{ color: 'var(--color-btn)' }}>{selectedIds.size}</b> / 4 条
              </>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {selectedIds.size > 0 && (
            <button className="btn btn-secondary" onClick={() => setSelectedIds(new Set())}>
              清除选择
            </button>
          )}
          {selectedIds.size >= 2 && (
            <button className="btn btn-primary" onClick={handleCompare}>
              📊 对比 {selectedIds.size} 条
            </button>
          )}
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">☕</div>
          <div className="empty-state-title">还没有匹配的记录</div>
          <div className="empty-state-desc">
            {searchQuery ? '尝试修改搜索关键词，或添加新记录。' : '点击右上角"添加记录"开始品鉴之旅吧！'}
          </div>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={handleAddRecord}>
              + 添加第一条记录
            </button>
          )}
        </div>
      ) : (
        <div className="card-grid">
          {filteredRecords.map((r, idx) => (
            <CoffeeCard
              key={r.id}
              record={r}
              selected={selectedIds.has(r.id)}
              onSelect={handleToggleSelect}
              onClick={handleCardClick}
              animationKey={filterKey + idx}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderDetailView = () => {
    if (!activeRecord) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-title">记录不存在</div>
          <button className="btn btn-primary" onClick={handleGoHome}>
            返回列表
          </button>
        </div>
      );
    }
    const r = activeRecord;
    return (
      <div>
        <button className="back-btn" onClick={handleGoHome}>
          ← 返回列表
        </button>
        <div className="detail-wrapper">
          <div className="detail-panel">
            <div className="detail-header">
              <h1 className="detail-title">{r.name}</h1>
              <div className="detail-subtitle">
                {r.roaster} · {r.brewingMethod}
              </div>
              <div className="detail-date">{formatDate(r.date)}</div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">风味标签</div>
              <div className="detail-aromas">
                {r.aromas.length > 0 ? (
                  r.aromas.map((a) => <span key={a} className="aroma-tag">{a}</span>)
                ) : (
                  <span style={{ color: 'var(--color-text-light)', fontSize: 14 }}>暂无标签</span>
                )}
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">风味评分</div>
              <div className="detail-rating-row">
                <div className="detail-rating-label">酸度</div>
                <div className="detail-rating-bar">
                  <div
                    className="detail-rating-fill"
                    style={{
                      width: `${(r.acidity / 5) * 100}%`,
                      background: getScoreBarColor(r.acidity, 5),
                    }}
                  />
                </div>
                <div className="detail-rating-value">{r.acidity}/5</div>
              </div>
              <div className="detail-rating-row">
                <div className="detail-rating-label">醇厚度</div>
                <div className="detail-rating-bar">
                  <div
                    className="detail-rating-fill"
                    style={{
                      width: `${(r.body / 5) * 100}%`,
                      background: getScoreBarColor(r.body, 5),
                    }}
                  />
                </div>
                <div className="detail-rating-value">{r.body}/5</div>
              </div>
              <div className="detail-rating-row">
                <div className="detail-rating-label">余韵</div>
                <div className="detail-rating-bar">
                  <div
                    className="detail-rating-fill"
                    style={{
                      width: `${(r.aftertaste / 5) * 100}%`,
                      background: getScoreBarColor(r.aftertaste, 5),
                    }}
                  />
                </div>
                <div className="detail-rating-value">{r.aftertaste}/5</div>
              </div>
              <div className="detail-rating-row" style={{ marginTop: 16 }}>
                <div className="detail-rating-label">整体评分</div>
                <div className="detail-rating-bar">
                  <div
                    className="detail-rating-fill"
                    style={{
                      width: `${(r.overall / 10) * 100}%`,
                      background: getScoreBarColor(r.overall, 10),
                      height: 14,
                    }}
                  />
                </div>
                <div
                  className="detail-rating-value"
                  style={{
                    fontSize: 22,
                    color: getScoreBarColor(r.overall, 10),
                  }}
                >
                  {r.overall}
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">品鉴笔记</div>
              {r.notes ? (
                <div className="detail-notes">{r.notes}</div>
              ) : (
                <div style={{ color: 'var(--color-text-light)', fontSize: 14 }}>暂无笔记</div>
              )}
            </div>
          </div>

          <div className="detail-panel">
            <RadarChart record={r} />
          </div>
        </div>
      </div>
    );
  };

  const renderAddView = () => (
    <CoffeeForm onSubmit={handleFormSubmit} onCancel={handleGoHome} />
  );

  const renderCompareView = () => (
    <div>
      <button className="back-btn" onClick={handleGoHome}>
        ← 返回列表
      </button>
      <div className="compare-header">
        <h2 className="compare-title">对比视图</h2>
        <p className="compare-subtitle">
          正在对比 {compareRecords.length} 条咖啡品鉴记录的风味差异
        </p>
      </div>
      {compareRecords.length >= 2 ? (
        <>
          <BarChartCompare records={compareRecords} />
          <div className="card-grid" style={{ marginTop: 32 }}>
            {compareRecords.map((r) => (
              <CoffeeCard
                key={r.id}
                record={r}
                selected={false}
                onSelect={() => {}}
                onClick={handleCardClick}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">请至少选择2条记录进行对比</div>
          <button className="btn btn-primary" onClick={handleGoHome}>
            返回列表
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'add':
        return renderAddView();
      case 'detail':
        return renderDetailView();
      case 'compare':
        return renderCompareView();
      case 'list':
      default:
        return renderListView();
    }
  };

  return (
    <div>
      {renderNavbar()}
      <div className="main-container">{renderContent()}</div>
    </div>
  );
};

export default App;
