import { useState, useRef, useCallback, useEffect } from 'react';
import type { POICategory, SearchResult } from './types';
import { CATEGORY_CONFIGS } from './types';

interface ControlPanelProps {
  selectedLayers: POICategory[];
  searchRadius: number;
  angleRange: number;
  azimuth: number;
  searchResults: SearchResult[];
  categoryCounts: Record<POICategory, number>;
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
  categoryCounts,
  onLayersChange,
  onRadiusChange,
  onAngleRangeChange,
  onAzimuthChange,
  onResultClick,
  onReset,
}: ControlPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRadiusDragging, setIsRadiusDragging] = useState(false);
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

  const radiusPercent = ((searchRadius - 100) / (500 - 100)) * 100;
  const anglePercent = ((angleRange - 45) / (360 - 45)) * 100;

  return (
    <div className="control-panel" style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>兴趣点筛选</h2>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>选择类别</h3>
        <div style={categoryGridStyle}>
          {CATEGORY_CONFIGS.map(config => {
            const isSelected = selectedLayers.includes(config.key);
            return (
              <div
                key={config.key}
                onClick={() => handleCategoryToggle(config.key)}
                style={{
                  ...categoryItemStyle,
                  ...(isSelected ? categoryItemSelectedStyle : {}),
                  borderColor: isSelected ? config.color : 'transparent',
                  backgroundColor: isSelected ? `${config.color}12` : '#f8f9fa',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f1f3f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
              >
                <span style={{
                  ...colorDotStyle,
                  backgroundColor: config.color,
                  ...(isSelected ? colorDotSelectedStyle : {}),
                  boxShadow: isSelected ? `0 0 0 3px ${config.color}30` : '0 1px 3px rgba(0,0,0,0.2)',
                }}></span>
                <div style={categoryContentStyle}>
                  <span style={{
                    ...checkboxTextStyle,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? config.color : '#495057',
                  }}>{config.label}</span>
                  <span style={{
                    ...categoryCountBadgeStyle,
                    backgroundColor: isSelected ? config.color : '#dee2e6',
                    color: isSelected ? '#ffffff' : '#868e96',
                  }}>
                    {categoryCounts[config.key]}
                  </span>
                </div>
                <div style={{
                  ...checkIconStyle,
                  opacity: isSelected ? 1 : 0,
                  transform: isSelected ? 'scale(1)' : 'scale(0.5)',
                  backgroundColor: config.color,
                }}>
                  ✓
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>搜索半径</h3>
        <div style={sliderWrapperStyle}>
          <div style={{
            ...sliderBubbleStyle,
            left: `calc(${radiusPercent}% - 28px)`,
            opacity: isRadiusDragging ? 1 : 0.9,
            transform: `translateY(${isRadiusDragging ? '-8px' : '-4px'})`,
          }}>
            {searchRadius}米
          </div>
          <div style={sliderContainerStyle}>
            <div style={sliderTrackStyle}>
              <div style={{
                ...sliderTrackFillStyle,
                width: `${radiusPercent}%`,
                backgroundColor: '#4a90d9',
              }}></div>
            </div>
            <input
              type="range"
              min="100"
              max="500"
              step="50"
              value={searchRadius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              onMouseDown={() => setIsRadiusDragging(true)}
              onMouseUp={() => setIsRadiusDragging(false)}
              onMouseLeave={() => setIsRadiusDragging(false)}
              style={sliderInputStyle}
            />
            <div style={{
              ...sliderThumbStyle,
              left: `calc(${radiusPercent}% - 10px)`,
              transform: `scale(${isRadiusDragging ? 1.2 : 1})`,
              borderColor: '#4a90d9',
              boxShadow: isRadiusDragging
                ? '0 4px 12px rgba(74, 144, 217, 0.5)'
                : '0 2px 6px rgba(74, 144, 217, 0.3)',
            }}></div>
          </div>
        </div>
        <div style={sliderLabelsStyle}>
          <span style={sliderLabelMinStyle}>100米</span>
          <span style={sliderLabelMaxStyle}>500米</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>扇形夹角</h3>
        <div style={sliderWrapperStyle}>
          <div style={sliderContainerStyle}>
            <div style={sliderTrackStyle}>
              <div style={{
                ...sliderTrackFillStyle,
                width: `${anglePercent}%`,
                backgroundColor: '#4a90d9',
              }}></div>
            </div>
            <input
              type="range"
              min="45"
              max="360"
              step="15"
              value={angleRange}
              onChange={(e) => onAngleRangeChange(Number(e.target.value))}
              style={sliderInputStyle}
            />
            <div style={{
              ...sliderThumbStyle,
              left: `calc(${anglePercent}% - 10px)`,
              borderColor: '#4a90d9',
            }}></div>
          </div>
        </div>
        <div style={sliderLabelsStyle}>
          <span style={sliderLabelMinStyle}>45°</span>
          <span style={{
            ...sliderValueDisplayStyle,
            color: '#4a90d9',
          }}>{angleRange}°</span>
          <span style={sliderLabelMaxStyle}>360°</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>方位角</h3>
        <div style={knobWrapperStyle}>
          <div
            ref={knobRef}
            style={{
              ...knobBaseStyle,
              cursor: isDragging ? 'grabbing' : 'grab',
              boxShadow: isDragging
                ? '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff, 0 0 0 4px rgba(74, 144, 217, 0.2)'
                : '6px 6px 12px #d1d1d1, -6px -6px 12px #ffffff',
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
            <div style={{
              ...knobCenterStyle,
              boxShadow: isDragging
                ? 'inset 3px 3px 6px #d1d1d1, inset -3px -3px 6px #ffffff'
                : 'inset 2px 2px 5px #d1d1d1, inset -2px -2px 5px #ffffff',
            }}>
              <div style={knobValueContainerStyle}>
                <span style={knobValueStyle}>{azimuth}°</span>
                <span style={knobCompassStyle}>
                  {azimuth >= 337.5 || azimuth < 22.5 ? 'N' :
                   azimuth >= 22.5 && azimuth < 67.5 ? 'NE' :
                   azimuth >= 67.5 && azimuth < 112.5 ? 'E' :
                   azimuth >= 112.5 && azimuth < 157.5 ? 'SE' :
                   azimuth >= 157.5 && azimuth < 202.5 ? 'S' :
                   azimuth >= 202.5 && azimuth < 247.5 ? 'SW' :
                   azimuth >= 247.5 && azimuth < 292.5 ? 'W' : 'NW'}
                </span>
              </div>
            </div>
          </div>
          <div style={compassLabelsStyle}>
            <span style={{ ...compassLabelStyle, top: 0, left: '50%', transform: 'translateX(-50%)', color: '#4a90d9' }}>N</span>
            <span style={{ ...compassLabelStyle, top: '50%', right: 4, transform: 'translateY(-50%)' }}>E</span>
            <span style={{ ...compassLabelStyle, bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>S</span>
            <span style={{ ...compassLabelStyle, top: '50%', left: 4, transform: 'translateY(-50%)' }}>W</span>
          </div>
        </div>
        <div style={azimuthQuickBtnsStyle}>
          {[0, 90, 180, 270].map(deg => (
            <button
              key={deg}
              onClick={() => onAzimuthChange(deg)}
              style={{
                ...azimuthQuickBtnStyle,
                backgroundColor: azimuth === deg ? '#4a90d9' : '#f1f3f5',
                color: azimuth === deg ? '#ffffff' : '#495057',
              }}
              onMouseEnter={(e) => {
                if (azimuth !== deg) e.currentTarget.style.backgroundColor = '#e9ecef';
              }}
              onMouseLeave={(e) => {
                if (azimuth !== deg) e.currentTarget.style.backgroundColor = '#f1f3f5';
              }}
            >
              {deg === 0 ? '北' : deg === 90 ? '东' : deg === 180 ? '南' : '西'}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        style={resetButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#357abd';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 217, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4a90d9';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(74, 144, 217, 0.25)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span style={resetIconStyle}>↻</span>
        重置所有设置
      </button>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          搜索结果
          <span style={resultCountStyle}>
            <span style={resultCountBadgeStyle}>{searchResults.length}</span>
            个地点
          </span>
        </h3>
        <div style={resultListStyle}>
          {searchResults.length === 0 ? (
            <div style={emptyResultStyle}>
              <div style={emptyResultIconStyle}>📍</div>
              <div>暂无搜索结果</div>
              <div style={emptyResultHintStyle}>请选择类别并调整搜索参数</div>
            </div>
          ) : (
            searchResults.map((result) => (
              <div
                key={result.poi.id}
                style={resultItemStyle}
                onClick={() => onResultClick(result.poi.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
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
                  <span style={resultDistanceBadgeStyle}>
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
  padding: '0 20px 20px 20px',
  backgroundColor: '#ffffff',
  borderLeft: '1px solid #e0e0e0',
  overflowY: 'auto',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  boxSizing: 'border-box',
};

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  backgroundColor: '#ffffff',
  paddingTop: '20px',
  paddingBottom: '12px',
  borderBottom: '1px solid #f1f3f5',
  marginBottom: '16px',
  zIndex: 10,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 700,
  color: '#212529',
  letterSpacing: '-0.3px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '13px',
  fontWeight: 600,
  color: '#495057',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  letterSpacing: '0.2px',
};

const categoryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
};

const categoryItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: '10px',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.25s ease',
  border: '2px solid transparent',
  backgroundColor: '#f8f9fa',
  position: 'relative',
};

const categoryItemSelectedStyle: React.CSSProperties = {};

const colorDotStyle: React.CSSProperties = {
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  marginRight: '10px',
  flexShrink: 0,
  border: '2px solid white',
  transition: 'all 0.25s ease',
};

const colorDotSelectedStyle: React.CSSProperties = {
  transform: 'scale(1.1)',
};

const categoryContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minWidth: 0,
};

const checkboxTextStyle: React.CSSProperties = {
  fontSize: '13px',
  transition: 'all 0.25s ease',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const categoryCountBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  padding: '2px 7px',
  borderRadius: '10px',
  minWidth: '20px',
  textAlign: 'center',
  transition: 'all 0.25s ease',
  marginLeft: '4px',
  flexShrink: 0,
};

const checkIconStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  marginLeft: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 700,
  transition: 'all 0.25s ease',
  flexShrink: 0,
};

const sliderWrapperStyle: React.CSSProperties = {
  position: 'relative',
  paddingTop: '8px',
};

const sliderBubbleStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-20px',
  padding: '4px 10px',
  backgroundColor: '#4a90d9',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '6px',
  transition: 'all 0.15s ease',
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  zIndex: 5,
};

const sliderContainerStyle: React.CSSProperties = {
  position: 'relative',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
};

const sliderTrackStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: '6px',
  backgroundColor: '#dee2e6',
  borderRadius: '3px',
  overflow: 'hidden',
};

const sliderTrackFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '3px',
  transition: 'width 0.15s ease',
};

const sliderThumbStyle: React.CSSProperties = {
  position: 'absolute',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  border: '3px solid',
  transition: 'all 0.15s ease',
  pointerEvents: 'none',
  zIndex: 3,
  top: '50%',
  marginTop: '-10px',
};

const sliderInputStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  width: '100%',
  height: '32px',
  opacity: 0,
  cursor: 'pointer',
  zIndex: 4,
  margin: 0,
};

const sliderLabelsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '4px',
};

const sliderLabelMinStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#868e96',
};

const sliderLabelMaxStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#868e96',
};

const sliderValueDisplayStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
};

const knobWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '150px',
  height: '150px',
  margin: '0 auto 16px auto',
};

const knobBaseStyle: React.CSSProperties = {
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'box-shadow 0.25s ease',
};

const knobInnerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  transition: 'transform 0.1s ease-out',
};

const knobIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '8px',
  height: '26px',
  borderRadius: '4px',
  background: 'linear-gradient(to bottom, #4a90d9, #357abd)',
  boxShadow: '0 2px 6px rgba(74, 144, 217, 0.5)',
};

const knobCenterStyle: React.CSSProperties = {
  width: '78px',
  height: '78px',
  borderRadius: '50%',
  background: 'linear-gradient(145deg, #fafafa, #f0f0f0)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
  transition: 'box-shadow 0.25s ease',
};

const knobValueContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const knobValueStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#4a90d9',
  lineHeight: 1.2,
};

const knobCompassStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#868e96',
  marginTop: '2px',
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
  fontSize: '11px',
  fontWeight: 600,
  color: '#adb5bd',
};

const azimuthQuickBtnsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '6px',
  marginTop: '4px',
};

const azimuthQuickBtnStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: 'none',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const resetButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 20px',
  backgroundColor: '#4a90d9',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 2px 6px rgba(74, 144, 217, 0.25)',
};

const resetIconStyle: React.CSSProperties = {
  fontSize: '16px',
};

const resultCountStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  color: '#868e96',
  fontWeight: 'normal',
};

const resultCountBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '22px',
  height: '22px',
  padding: '0 7px',
  backgroundColor: '#4a90d9',
  color: '#ffffff',
  borderRadius: '11px',
  fontSize: '11px',
  fontWeight: 700,
};

const resultListStyle: React.CSSProperties = {
  maxHeight: '320px',
  overflowY: 'auto',
  borderRadius: '10px',
  border: '1px solid #e9ecef',
  backgroundColor: '#fafbfc',
};

const emptyResultStyle: React.CSSProperties = {
  padding: '40px 24px',
  textAlign: 'center',
  color: '#868e96',
  fontSize: '13px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
};

const emptyResultIconStyle: React.CSSProperties = {
  fontSize: '32px',
  opacity: 0.5,
  marginBottom: '4px',
};

const emptyResultHintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#adb5bd',
};

const resultItemStyle: React.CSSProperties = {
  padding: '12px 14px',
  cursor: 'pointer',
  borderBottom: '1px solid #f1f3f5',
  transition: 'all 0.2s ease',
  backgroundColor: 'transparent',
};

const resultItemHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '5px',
};

const resultColorDotStyle: React.CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  marginRight: '8px',
  flexShrink: 0,
  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
};

const resultNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#212529',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  minWidth: 0,
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

const resultDistanceBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: '#4a90d9',
  padding: '3px 8px',
  borderRadius: '10px',
};
