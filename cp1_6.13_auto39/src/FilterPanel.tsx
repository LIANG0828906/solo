import React from 'react';
import { FilterConfig, FilterType } from './types';

interface FilterPanelProps {
  filters: FilterConfig[];
  onToggle: (id: FilterType) => void;
  onIntensityChange: (id: FilterType, value: number) => void;
}

const cardStyleBase: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(12px)',
  border: '1.5px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '14px',
  padding: '14px',
  cursor: 'pointer',
  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
  userSelect: 'none',
  position: 'relative',
  overflow: 'hidden'
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  WebkitAppearance: 'none',
  appearance: 'none',
  height: '6px',
  borderRadius: '3px',
  background: 'linear-gradient(90deg, #00d4ff, #a855f7)',
  outline: 'none',
  marginTop: '10px'
};

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onToggle,
  onIntensityChange
}) => {
  const [hoveredId, setHoveredId] = React.useState<FilterType | null>(null);

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '16px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.2) transparent'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px',
          padding: '0 4px'
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
        >
          ✦
        </div>
        <h2
          style={{
            fontSize: '17px',
            fontWeight: 600,
            letterSpacing: '0.3px',
            background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          滤镜面板
        </h2>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 500
          }}
        >
          {filters.filter((f) => f.enabled).length} / {filters.length}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}
      >
        {filters.map((filter) => {
          const isEnabled = filter.enabled;
          const isHovered = hoveredId === filter.id;

          return (
            <div
              key={filter.id}
              onClick={() => onToggle(filter.id)}
              onMouseEnter={() => setHoveredId(filter.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                ...cardStyleBase,
                transform: isHovered && !isEnabled
                  ? 'translateY(-3px) scale(1.01)'
                  : isEnabled
                    ? 'translateY(-1px)'
                    : 'translateY(0)',
                boxShadow: isEnabled
                  ? '0 0 22px rgba(0, 212, 255, 0.25), 0 6px 22px rgba(168, 85, 247, 0.15)'
                  : isHovered
                    ? '0 8px 24px rgba(0, 0, 0, 0.35)'
                    : '0 2px 8px rgba(0, 0, 0, 0.2)',
                borderColor: isEnabled
                  ? 'transparent'
                  : 'rgba(255, 255, 255, 0.1)',
                background: isEnabled
                  ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.12), rgba(168, 85, 247, 0.12))'
                  : 'rgba(255, 255, 255, 0.06)'
              }}
            >
              {isEnabled && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    padding: '1.5px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                    WebkitMask:
                      'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none'
                  }}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    background: isEnabled
                      ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.25), rgba(168, 85, 247, 0.25))'
                      : 'rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isEnabled ? 'scale(1.08)' : 'scale(1)'
                  }}
                >
                  {filter.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {filter.name}
                    {isEnabled && (
                      <span
                        style={{
                          fontSize: '9px',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          background:
                            'linear-gradient(135deg, #00d4ff, #a855f7)',
                          color: '#fff',
                          fontWeight: 700,
                          letterSpacing: '0.3px'
                        }}
                      >
                        ON
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: 'rgba(255,255,255,0.45)',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {filter.description}
                  </div>
                </div>
              </div>

              <div
                style={{
                  opacity: isEnabled ? 1 : 0.55,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: isEnabled ? 'auto' : 'none'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: '6px'
                  }}
                >
                  <span>强度</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: isEnabled ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {filter.intensity}
                    {filter.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={filter.min}
                  max={filter.max}
                  step={filter.step}
                  value={filter.intensity}
                  onChange={(e) =>
                    onIntensityChange(filter.id, Number(e.target.value))
                  }
                  style={{
                    ...sliderStyle,
                    cursor: isEnabled ? 'pointer' : 'not-allowed'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d4ff, #a855f7);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d4ff, #a855f7);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
};
