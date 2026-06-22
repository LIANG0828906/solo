import React from 'react';

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  varieties: string[];
  selectedVariety: string;
  onVarietyChange: (value: string) => void;
  locations: string[];
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  minQuantity: number;
  onMinQuantityChange: (value: number) => void;
  maxQuantity: number;
  onMaxQuantityChange: (value: number) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  search,
  onSearchChange,
  varieties,
  selectedVariety,
  onVarietyChange,
  locations,
  selectedLocation,
  onLocationChange,
  minQuantity,
  onMinQuantityChange,
  maxQuantity,
  onMaxQuantityChange,
}) => {
  return (
    <div className="search-bar">
      <div className="search-row">
        <div className="form-group">
          <label className="form-label">搜索种子名称</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="输入种子名称..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">品种</label>
          <select
            className="form-select"
            value={selectedVariety}
            onChange={(e) => onVarietyChange(e.target.value)}
          >
            <option value="all">全部品种</option>
            {varieties.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">所在地</label>
          <select
            className="form-select"
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
          >
            <option value="all">全部地区</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">最小数量</label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            min="0"
            value={minQuantity || ''}
            onChange={(e) => onMinQuantityChange(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">最大数量</label>
          <input
            type="number"
            className="form-input"
            placeholder="不限"
            min="0"
            value={maxQuantity || ''}
            onChange={(e) => onMaxQuantityChange(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;
