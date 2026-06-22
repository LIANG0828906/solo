import { useState } from 'react';

export interface FilterState {
  exerciseMoreThan30: boolean;
  sleepLessThan6: boolean;
  highSugar: boolean;
  highSalt: boolean;
  healthyDiet: boolean;
  lightDiet: boolean;
  spicyDiet: boolean;
}

interface BehaviorFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

const defaultFilters: FilterState = {
  exerciseMoreThan30: false,
  sleepLessThan6: false,
  highSugar: false,
  highSalt: false,
  healthyDiet: false,
  lightDiet: false,
  spicyDiet: false,
};

const filterOptions: { key: keyof FilterState; label: string; icon: string }[] = [
  { key: 'exerciseMoreThan30', label: '运动 > 30分钟', icon: 'directions_run' },
  { key: 'sleepLessThan6', label: '睡眠 < 6小时', icon: 'bed' },
  { key: 'highSugar', label: '高糖饮食', icon: 'cake' },
  { key: 'highSalt', label: '高盐饮食', icon: 'local_dining' },
  { key: 'healthyDiet', label: '健康饮食', icon: 'eco' },
  { key: 'lightDiet', label: '清淡饮食', icon: 'ramen_dining' },
  { key: 'spicyDiet', label: '辛辣饮食', icon: 'local_fire_department' },
];

export default function BehaviorFilter({ onFilterChange }: BehaviorFilterProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const toggleFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: !filters[key] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="material-icons">filter_alt</span>
        行为筛选
      </h2>

      <div className="filter-options">
        {filterOptions.map((opt) => (
          <div key={opt.key} className="filter-option" onClick={() => toggleFilter(opt.key)}>
            <input
              type="checkbox"
              checked={filters[opt.key]}
              onChange={() => toggleFilter(opt.key)}
            />
            <span className="material-icons" style={{ fontSize: '18px', color: '#666' }}>
              {opt.icon}
            </span>
            <label onClick={(e) => e.stopPropagation()}>{opt.label}</label>
          </div>
        ))}
      </div>

      <button
        className="btn"
        style={{ width: '100%', marginTop: '16px', background: '#ECEFF1', color: '#555' }}
        onClick={resetFilters}
      >
        <span className="material-icons" style={{ fontSize: '18px' }}>
          refresh
        </span>
        重置筛选
      </button>
    </div>
  );
}
