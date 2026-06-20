import React, { useState, useEffect } from 'react';
import { useCollage } from '../context/CollageContext';
import { FilterType, FILTER_PRESETS } from '../../shared/types';

const FilterPanel: React.FC = () => {
  const { selectedLayerId, layers, applyFilter } = useCollage();
  const [intensity, setIntensity] = useState<number>(100);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  useEffect(() => {
    if (selectedLayer) {
      setSelectedFilter(selectedLayer.filter);
      setIntensity(selectedLayer.filterIntensity);
    }
  }, [selectedLayerId, selectedLayer]);

  const handleFilterSelect = (filter: FilterType) => {
    if (!selectedLayerId) return;
    setSelectedFilter(filter);
    applyFilter(selectedLayerId, filter, intensity);
  };

  const handleIntensityChange = (value: number) => {
    if (!selectedLayerId) return;
    setIntensity(value);
    applyFilter(selectedLayerId, selectedFilter, value);
  };

  const filters = Object.entries(FILTER_PRESETS) as [FilterType, { name: string; css: string }][];

  const getFilterPreviewStyle = (filter: FilterType): React.CSSProperties => {
    if (filter === 'none') return {};
    return { filter: FILTER_PRESETS[filter].css };
  };

  return (
    <div
      className="filter-panel"
      style={{
        backgroundColor: '#1f2937',
        borderRadius: 12,
        margin: 12,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>🎨</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>滤镜效果</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: '#9ca3af',
            transition: 'transform 0.3s',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </div>

      {isExpanded && (
        <>
          {!selectedLayerId && (
            <div
              style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: 12,
                padding: '16px 0',
              }}
            >
              请先选择一个图层
            </div>
          )}

          {selectedLayerId && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                }}
              >
                {filters.map(([key, value]) => (
                  <div
                    key={key}
                    onClick={() => handleFilterSelect(key)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border:
                        selectedFilter === key
                          ? '2px solid #4ecdc4'
                          : '2px solid transparent',
                      transition: 'all 0.3s ease-in-out',
                      position: 'relative',
                      backgroundColor: '#111827',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${selectedLayer?.src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        ...getFilterPreviewStyle(key),
                        transition: 'filter 0.3s ease-in-out',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: 10,
                        padding: '3px 4px',
                        textAlign: 'center',
                      }}
                    >
                      {value.name}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingTop: 4,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#d1d5db' }}>强度</span>
                  <span style={{ fontSize: 12, color: '#4ecdc4', fontWeight: 500 }}>
                    {intensity}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={intensity}
                  onChange={(e) => handleIntensityChange(Number(e.target.value))}
                  disabled={selectedFilter === 'none'}
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#374151',
                    appearance: 'none',
                    cursor: selectedFilter === 'none' ? 'not-allowed' : 'pointer',
                    opacity: selectedFilter === 'none' ? 0.5 : 1,
                  }}
                />
              </div>
            </>
          )}
        </>
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #4ecdc4;
          cursor: pointer;
          transition: all 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #4ecdc4;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default FilterPanel;
