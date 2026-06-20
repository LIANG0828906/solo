import React, { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  useCelsius: boolean;
  onToggleUnit: () => void;
  particleDensity: 'low' | 'medium' | 'high';
  onChangeDensity: (d: 'low' | 'medium' | 'high') => void;
  showInfoCard: boolean;
  onToggleInfoCard: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  useCelsius,
  onToggleUnit,
  particleDensity,
  onChangeDensity,
  showInfoCard,
  onToggleInfoCard
}) => {
  const [inputValue, setInputValue] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (value) {
      onSearch(value);
      setInputValue('');
      inputRef.current?.blur();
    }
  };

  return (
    <>
      <form className="search-container" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="输入城市名称..."
          aria-label="搜索城市"
        />
        <button
          type="submit"
          className="search-button"
          aria-label="搜索"
          title="搜索"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </form>

      <button
        type="button"
        className={`settings-toggle ${settingsOpen ? 'open' : ''}`}
        onClick={() => setSettingsOpen(o => !o)}
        aria-label="设置"
        title="设置"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <div
        className={`settings-overlay ${settingsOpen ? 'visible' : ''}`}
        onClick={() => setSettingsOpen(false)}
        aria-hidden="true"
      />

      <div className={`settings-panel ${settingsOpen ? 'open' : ''}`}>
        <div className="settings-title">设置</div>

        <div className="settings-item">
          <div className="settings-label">
            温度单位
            <small>{useCelsius ? '摄氏度 °C' : '华氏度 °F'}</small>
          </div>
          <Switch checked={useCelsius} onChange={onToggleUnit} />
        </div>

        <div className="settings-item">
          <div className="settings-label">
            粒子密度
            <small>控制动画粒子数量</small>
          </div>
          <DensitySelect value={particleDensity} onChange={onChangeDensity} />
        </div>

        <div className="settings-item">
          <div className="settings-label">
            显示数据卡片
            <small>{showInfoCard ? '卡片已显示' : '卡片已隐藏'}</small>
          </div>
          <Switch checked={showInfoCard} onChange={onToggleInfoCard} />
        </div>
      </div>
    </>
  );
};

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => (
  <div
    className={`switch ${checked ? 'on' : ''}`}
    onClick={onChange}
    role="switch"
    aria-checked={checked}
    tabIndex={0}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange();
      }
    }}
  >
    <div className="switch-handle" />
  </div>
);

interface DensitySelectProps {
  value: 'low' | 'medium' | 'high';
  onChange: (v: 'low' | 'medium' | 'high') => void;
}

const DensitySelect: React.FC<DensitySelectProps> = ({ value, onChange }) => {
  const options: Array<{ key: 'low' | 'medium' | 'high'; label: string }> = [
    { key: 'low', label: '低' },
    { key: 'medium', label: '中' },
    { key: 'high', label: '高' }
  ];

  return (
    <div className="density-group">
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          className={`density-btn ${value === opt.key ? 'active' : ''}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default SearchBar;
