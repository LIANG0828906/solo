import React, { useMemo } from 'react';
import { Constellation, constellations, searchConstellations } from '../utils/constellationData';

interface ControlPanelProps {
  selectedConstellation: Constellation | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectConstellation: (id: string | null) => void;
  isMobile: boolean;
  isOpen: boolean;
  onTogglePanel: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedConstellation,
  searchQuery,
  onSearchChange,
  onSelectConstellation,
  isMobile,
  isOpen,
  onTogglePanel,
}) => {
  const filteredConstellations = useMemo(() => {
    if (!searchQuery.trim()) return constellations;
    return searchConstellations(searchQuery);
  }, [searchQuery]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSelectConstellation(value || null);
  };

  const handleClear = () => {
    onSelectConstellation(null);
    onSearchChange('');
  };

  return (
    <div className={`control-panel ${isMobile ? 'mobile' : ''} ${isMobile && isOpen ? 'open' : ''}`}>
      <div className="panel-handle" onClick={onTogglePanel}>
        <div className="panel-handle-bar" />
      </div>

      <h1 className="panel-title">✨ 星座漫游</h1>

      <input
        type="text"
        className="search-input"
        placeholder="搜索星座名称..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div className="select-wrapper">
        <select
          className="constellation-select"
          value={selectedConstellation?.id || ''}
          onChange={handleSelectChange}
        >
          <option value="">—— 选择星座 ——</option>
          {filteredConstellations.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.latinName})
            </option>
          ))}
        </select>
      </div>

      {selectedConstellation ? (
        <div className="info-card">
          <h2 className="info-card-title">{selectedConstellation.name}</h2>
          <div className="info-card-latin">{selectedConstellation.latinName}</div>

          <div className="info-card-stats">
            <div className="stat-item">
              <div className="stat-value">{selectedConstellation.brightStars}</div>
              <div className="stat-label">亮星数量</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{selectedConstellation.stars.length}</div>
              <div className="stat-label">恒星总数</div>
            </div>
          </div>

          <h3 className="info-card-section-title">神话故事</h3>
          <p className="info-card-myth">{selectedConstellation.myth}</p>
        </div>
      ) : (
        <div className="info-card info-card-empty">
          选择一个星座
          <br />
          开始探索宇宙奥秘
          <br />
          <br />
          ✨ 双击恒星查看详情
          <br />
          🖱️ 拖拽旋转视角
          <br />
          🔍 滚轮缩放
        </div>
      )}

      {selectedConstellation && (
        <button className="clear-btn" onClick={handleClear}>
          清除选择
        </button>
      )}
    </div>
  );
};

export default ControlPanel;
