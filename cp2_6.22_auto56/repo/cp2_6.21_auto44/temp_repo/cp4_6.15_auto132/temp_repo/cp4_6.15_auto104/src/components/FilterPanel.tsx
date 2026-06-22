import { useState } from 'react';
import { Filter, Map, ChevronDown } from 'lucide-react';
import { useStormStore } from '@/store/useStormStore';
import { CATEGORIES, BASINS } from '@/data/types';

export default function FilterPanel() {
  const { category, basin, setCategory, setBasin } = useStormStore();
  const [basinOpen, setBasinOpen] = useState(false);

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <Filter size={18} className="filter-icon" />
        <h3 className="filter-title">筛选条件</h3>
      </div>

      <div className="filter-section">
        <h4 className="filter-section-title">
          <span>强度等级</span>
          <span className="filter-section-desc">Saffir-Simpson 飓风等级</span>
        </h4>
        <div className="category-buttons">
          <button
            className={`category-btn all ${category === null ? 'active' : ''}`}
            onClick={() => setCategory(null)}
          >
            全部
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.level}
              className={`category-btn ${category === cat.level ? 'active' : ''}`}
              style={{
                background: category === cat.level ? cat.color : 'rgba(255,255,255,0.1)',
                '--hover-color': cat.color,
              } as React.CSSProperties}
              onClick={() => setCategory(cat.level)}
            >
              <span className="cat-level">{cat.level}级</span>
              <span className="cat-range">{cat.windRange}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4 className="filter-section-title">
          <Map size={14} />
          <span>海域</span>
        </h4>
        <div className="basin-select">
          <button className="basin-dropdown-btn" onClick={() => setBasinOpen(!basinOpen)}>
            <span>{basin ? BASINS.find(b => b.id === basin)?.name : '全部海域'}</span>
            <ChevronDown size={16} className={basinOpen ? 'rotated' : ''} />
          </button>
          {basinOpen && (
            <div className="basin-dropdown">
              <button
                className={`basin-option ${basin === null ? 'active' : ''}`}
                onClick={() => {
                  setBasin(null);
                  setBasinOpen(false);
                }}
              >
                全部海域
              </button>
              {BASINS.map(b => (
                <button
                  key={b.id}
                  className={`basin-option ${basin === b.id ? 'active' : ''}`}
                  onClick={() => {
                    setBasin(b.id);
                    setBasinOpen(false);
                  }}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="filter-stats">
        <span className="stats-label">当前筛选</span>
        <span className="stats-value">
          {useStormStore.getState().getFilteredStorms().length} 场风暴
        </span>
      </div>
    </div>
  );
}
