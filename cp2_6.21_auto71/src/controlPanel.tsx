import { useState, useRef, useCallback, useEffect } from 'react';
import type { POICategory, SearchResult } from './types';
import { CATEGORY_CONFIGS } from './types';

interface ControlPanelProps {
  selectedLayers: POICategory[];
  searchRadius: number;
  angleRange: number;
  azimuth: number;
  searchResults: SearchResult[];
  onLayersChange: (layers: POICategory[]) => void;
  onRadiusChange: (radius: number) => void;
  onAngleRangeChange: (range: number) => void;
  onAzimuthChange: (azimuth: number) => void;
  onResultClick: (poiId: string) => void;
  onReset: () => void;
}

export default function ControlPanel({
  selectedLayers,
  searchRadius,
  angleRange,
  azimuth,
  searchResults,
  onLayersChange,
  onRadiusChange,
  onAngleRangeChange,
  onAzimuthChange,
  onResultClick,
  onReset,
}: ControlPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);

  const handleCategoryToggle = useCallback((category: POICategory) => {
    const newLayers = selectedLayers.includes(category)
      ? selectedLayers.filter(l => l !== category)
      : [...selectedLayers, category];
    onLayersChange(newLayers);
  }, [selectedLayers, onLayersChange]);

  const getCategoryLabel = useCallback((category: POICategory): string => {
    const config = CATEGORY_CONFIGS.find(c => c.key === category);
    return config?.label || category;
  }, []);

  const getCategoryColor = useCallback((category: POICategory): string => {
    const config = CATEGORY_CONFIGS.find(c => c.key === category);
    return config?.color || '#3388ff';
  }, []);

  const handleKnobMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !knobRef.current) return;

    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    const snappedAngle = Math.round(angle / 15) * 15;
    onAzimuthChange(snappedAngle % 360);
  }, [isDragging, onAzimuthChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const knobRotation = azimuth - 90;

  return (
    <div className="control-panel" style={panelStyle}>
      <h2 style={titleStyle}>兴趣点筛选</h2>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>选择类别</h3>
        <div style={categoryGridStyle}>
          {CATEGORY_CONFIGS.map(config => (
            <label
              key={config.key}
              style={checkboxLabelStyle}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={checkboxContainerStyle}>
                <span style={{
                  ...colorDotStyle,
                  backgroundColor: config.color,
                }}></span>
                <input
                  type="checkbox"
                  checked={selectedLayers.includes(config.key)}
                  onChange={() => handleCategoryToggle(config.key)}
                  style={checkboxInputStyle}
                  readOnly={false}
                />
                <span style={checkboxTextStyle}>{config.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>搜索半径</h3>
        <div style={sliderContainerStyle}>
          <input
            type="range"
            min="100"
            max="500"
            step="50"
            value={searchRadius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            style={sliderStyle}
          />
          <span style={sliderValueStyle}>{searchRadius} 米</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>扇形夹角</h3>
        <div style={sliderContainerStyle}>
          <input
            type="range"
            min="45"
            max="360"
            step="15"
            value={angleRange}
            onChange={(e) => onAngleRangeChange(Number(e.target.value))}
            style={sliderStyle}
          />
          <span style={sliderValueStyle}>{angleRange}°</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>方位角</h3>
        <div style={knobContainerStyle}>
          <div
            ref={knobRef}
            style={{
              ...knobBaseStyle,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleKnobMouseDown}
          >
            <div
              style={{
                ...knobInnerStyle,
                transform: `rotate(${knobRotation}deg)`,
              }}
            >
              <div style={knobIndicatorStyle}></div>
            </div>
            <div style={knobCenterStyle}>
              <span style={knobValueStyle}>{azimuth}°</span>
            </div>
          </div>
          <div style={compassLabelsStyle}>
            <span style={{ ...compassLabelStyle, top: 0, left: '50%', transform: 'translateX(-50%)' }}>N</span>
            <span style={{ ...compassLabelStyle, top: '50%', right: 4, transform: 'translateY(-50%)' }}>E</span>
            <span style={{ ...compassLabelStyle, bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>S</span>
            <span style={{ ...compassLabelStyle, top: '50%', left: 4, transform: 'translateY(-50%)' }}>W</span>
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        style={resetButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#357abd';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4a90d9';
        }}
      >
        重置
      </button>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          搜索结果 <span style={resultCountStyle}>({searchResults.length})</span>
        </h3>
        <div style={resultListStyle}>
          {searchResults.length === 0 ? (
            <div style={emptyResultStyle}>暂无结果</div>
          ) : (
            searchResults.map((result) => (
              <div
                key={result.poi.id}
                style={resultItemStyle}
                onClick={() => onResultClick(result.poi.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={resultItemHeaderStyle}>
                  <span
                    style={{
                      ...resultColorDotStyle,
                      backgroundColor: getCategoryColor(result.poi.category),
                    }}
                  ></span>
                  <span style={resultNameStyle}>{result.poi.name}</span>
                </div>
                <div style={resultItemMetaStyle}>
                  <span style={resultCategoryStyle}>
                    {getCategoryLabel(result.poi.category)}
                  </span>
                  <span style={resultDistanceStyle}>
                    {result.distance}m · {result.azimuthText}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  padding: '20px',
  backgroundColor: '#ffffff',
  borderLeft: '1px solid #e0e0e0',
  overflowY: 'auto',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  boxSizing: 'border-box',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  fontSize: '20px',
  fontWeight: 600,
  color: '#212529',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '14px',
  fontWeight: 600,
  color: '#495057',
};

const categoryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
};

const checkboxLabelStyle: React.CSSProperties = {
  cursor: 'pointer',
  userSelect: 'none',
};

const checkboxContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: '6px',
  transition: 'background-color 0.3s ease',
};

const colorDotStyle: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  marginRight: '8px',
  flexShrink: 0,
  border: '2px solid white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
};

const checkboxInputStyle: React.CSSProperties = {
  marginRight: '8px',
  cursor: 'pointer',
  accentColor: '#4a90d9',
};

const checkboxTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#495057',
};

const sliderContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const sliderStyle: React.CSSProperties = {
  flex: 1,
  height: '6px',
  borderRadius: '3px',
  background: 'linear-gradient(to right, #4a90d9 0%, #4a90d9 var(--value), #dee2e6 var(--value), #dee2e6 100%)',
  appearance: 'none',
  WebkitAppearance: 'none',
  outline: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const sliderValueStyle: React.CSSProperties = {
  minWidth: '60px',
  textAlign: 'right',
  fontSize: '13px',
  fontWeight: 600,
  color: '#4a90d9',
};

const knobContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: '140px',
  height: '140px',
  margin: '0 auto',
};

const knobBaseStyle: React.CSSProperties = {
  width: '140px',
  height: '140px',
  borderRadius: '50%',
  background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
  boxShadow: '6px 6px 12px #d1d1d1, -6px -6px 12px #ffffff',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'box-shadow 0.3s ease',
};

const knobInnerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  transition: 'transform 0.1s ease-out',
};

const knobIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '6px',
  height: '20px',
  borderRadius: '3px',
  backgroundColor: '#4a90d9',
  boxShadow: '0 2px 4px rgba(74, 144, 217, 0.4)',
};

const knobCenterStyle: React.CSSProperties = {
  width: '70px',
  height: '70px',
  borderRadius: '50%',
  background: 'linear-gradient(145deg, #f8f9fa, #e9ecef)',
  boxShadow: 'inset 2px 2px 5px #d1d1d1, inset -2px -2px 5px #ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
};

const knobValueStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#4a90d9',
};

const compassLabelsStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  pointerEvents: 'none',
};

const compassLabelStyle: React.CSSProperties = {
  position: 'absolute',
  fontSize: '12px',
  fontWeight: 600,
  color: '#868e96',
};

const resetButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 20px',
  backgroundColor: '#4a90d9',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.3s ease, transform 0.1s ease',
  marginBottom: '24px',
};

const resultCountStyle: React.CSSProperties = {
  color: '#868e96',
  fontWeight: 'normal',
  fontSize: '13px',
};

const resultListStyle: React.CSSProperties = {
  maxHeight: '300px',
  overflowY: 'auto',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
};

const emptyResultStyle: React.CSSProperties = {
  padding: '40px 20px',
  textAlign: 'center',
  color: '#868e96',
  fontSize: '13px',
};

const resultItemStyle: React.CSSProperties = {
  padding: '12px 16px',
  cursor: 'pointer',
  borderBottom: '1px solid #f1f3f5',
  transition: 'background-color 0.3s ease',
};

const resultItemHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '4px',
};

const resultColorDotStyle: React.CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  marginRight: '8px',
  flexShrink: 0,
};

const resultNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#212529',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const resultItemMetaStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingLeft: '18px',
};

const resultCategoryStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#868e96',
};

const resultDistanceStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#4a90d9',
};
