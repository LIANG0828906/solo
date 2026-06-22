import { useState, useEffect, useRef, useCallback } from 'react';
import type { ThemeSettings, City, ThemeStyle } from '../utils/weatherTypes';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  themeSettings: ThemeSettings;
  onCityChange: (city: string) => void;
  onThemeChange: (settings: Partial<ThemeSettings>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function SettingsPanel({
  isOpen,
  onClose,
  currentCity,
  themeSettings,
  onCityChange,
  onThemeChange,
}: SettingsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchCities = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`/api/cities?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  }, []);

  const debouncedFetchCities = useCallback(
    debounce((query: string) => fetchCities(query), 300),
    [fetchCities]
  );

  useEffect(() => {
    debouncedFetchCities(searchQuery);
  }, [searchQuery, debouncedFetchCities]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (city: City) => {
    onCityChange(city.name);
    setSearchQuery('');
    setShowSuggestions(false);
    onClose();
  };

  const themes: { value: ThemeStyle; label: string; description: string }[] = [
    { value: 'realistic', label: '写实', description: '真实天气渲染效果' },
    { value: 'minimal', label: '简约', description: '单色简化粒子风格' },
    { value: 'dreamy', label: '梦幻', description: '高饱和渐变慢动画' },
  ];

  return (
    <>
      <div
        style={{
          ...overlayStyle,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.5s ease-out',
        }}
        onClick={onClose}
      />
      <div
        style={{
          ...panelStyle,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.5s ease-out',
        }}
      >
        <div style={headerStyle}>
          <h2 style={titleStyle}>设置</h2>
          <button style={closeBtnStyle} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>城市</label>
          <div ref={searchRef} style={searchContainerStyle}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={currentCity || '搜索城市...'}
              style={inputStyle}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={suggestionsStyle}>
                {suggestions.map((city, index) => (
                  <div
                    key={index}
                    style={suggestionItemStyle}
                    onClick={() => handleCitySelect(city)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#EBF5FB';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={suggestionNameStyle}>{city.name}</span>
                    <span style={suggestionCountryStyle}>{city.country}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={currentCityStyle}>当前城市: {currentCity}</div>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>
            粒子密度: {themeSettings.particleDensity}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={themeSettings.particleDensity}
            onChange={(e) =>
              onThemeChange({ particleDensity: Number(e.target.value) })
            }
            style={sliderStyle}
          />
          <div style={sliderLabelsStyle}>
            <span>稀疏</span>
            <span>密集</span>
          </div>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>主题风格</label>
          <div style={themeGridStyle}>
            {themes.map((theme) => (
              <div
                key={theme.value}
                style={{
                  ...themeCardStyle,
                  borderColor:
                    themeSettings.style === theme.value
                      ? '#4A90D9'
                      : 'rgba(255, 255, 255, 0.2)',
                  background:
                    themeSettings.style === theme.value
                      ? 'rgba(74, 144, 217, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                }}
                onClick={() => onThemeChange({ style: theme.value })}
              >
                <div style={themeIconStyle}>
                  {theme.value === 'realistic' && '🌤️'}
                  {theme.value === 'minimal' && '◻️'}
                  {theme.value === 'dreamy' && '✨'}
                </div>
                <div style={themeNameStyle}>{theme.label}</div>
                <div style={themeDescStyle}>{theme.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  zIndex: 99,
};

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: '360px',
  height: '100vh',
  background: 'rgba(15, 15, 30, 0.85)',
  backdropFilter: 'blur(8px)',
  zIndex: 100,
  padding: '24px',
  boxSizing: 'border-box',
  overflowY: 'auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
};

const titleStyle: React.CSSProperties = {
  color: '#FFFFFF',
  fontSize: '24px',
  margin: 0,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '24px',
  cursor: 'pointer',
  padding: '8px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '14px',
  marginBottom: '12px',
};

const searchContainerStyle: React.CSSProperties = {
  position: 'relative',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
};

const suggestionsStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  width: '280px',
  background: 'rgba(20, 20, 40, 0.95)',
  backdropFilter: 'blur(12px)',
  borderRadius: '8px',
  overflow: 'hidden',
  zIndex: 101,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

const suggestionItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 16px',
  height: '44px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const suggestionNameStyle: React.CSSProperties = {
  color: '#FFFFFF',
  fontSize: '14px',
};

const suggestionCountryStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '12px',
};

const currentCityStyle: React.CSSProperties = {
  marginTop: '12px',
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '13px',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '4px',
  WebkitAppearance: 'none',
  appearance: 'none',
  background: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '2px',
  outline: 'none',
  cursor: 'pointer',
};

const sliderLabelsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '8px',
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '12px',
};

const themeGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
};

const themeCardStyle: React.CSSProperties = {
  padding: '16px 12px',
  border: '2px solid',
  borderRadius: '12px',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.3s ease',
};

const themeIconStyle: React.CSSProperties = {
  fontSize: '28px',
  marginBottom: '8px',
};

const themeNameStyle: React.CSSProperties = {
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: '4px',
};

const themeDescStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '11px',
  lineHeight: 1.4,
};
