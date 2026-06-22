import { useEffect, useMemo, useRef, useState } from 'react';
import type { Photo, FilterState } from './types';
import { SHUTTER_SPEEDS, APERTURES, ISOS } from './mockData';

interface PhotoGalleryProps {
  photos: Photo[];
  filter: FilterState;
  onFilterChange: (f: FilterState) => void;
  selectedPhotoId: string | null;
  onPhotoSelect: (photo: Photo) => void;
  onFilterDebounced?: (photos: Photo[]) => void;
}

function shutterValue(s: string): number {
  const parts = s.split('/');
  if (parts.length === 2) {
    const [a, b] = parts.map(Number);
    return a / b;
  }
  return Number(s);
}

export function PhotoGallery({
  photos,
  filter,
  onFilterChange,
  selectedPhotoId,
  onPhotoSelect,
}: PhotoGalleryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [fadeKey, setFadeKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const filteredPhotos = useMemo(() => {
    const kw = filter.keyword.trim().toLowerCase();
    const [apMin, apMax] = filter.apertureRange;
    const sA = shutterValue(SHUTTER_SPEEDS[filter.shutterMinIdx]);
    const sB = shutterValue(SHUTTER_SPEEDS[filter.shutterMaxIdx]);
    const sMin = Math.min(sA, sB);
    const sMax = Math.max(sA, sB);
    const [isoMin, isoMax] = filter.isoRange;
    return photos.filter((p) => {
      if (kw && !(
        p.location.name.toLowerCase().includes(kw) ||
        p.location.city.toLowerCase().includes(kw) ||
        p.title.toLowerCase().includes(kw)
      )) return false;
      if (p.params.aperture < apMin || p.params.aperture > apMax) return false;
      const sv = shutterValue(p.params.shutter);
      if (sv < sMin || sv > sMax) return false;
      if (p.params.iso < isoMin || p.params.iso > isoMax) return false;
      return true;
    });
  }, [photos, filter]);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [filteredPhotos.length]);

  const cardHeights = useMemo(() => {
    const seeds = [230, 260, 180, 300, 210, 270, 240, 200, 290, 250];
    return filteredPhotos.map((_, i) => seeds[i % seeds.length] + ((i * 37) % 80) - 40);
  }, [filteredPhotos]);

  const handlePhotoClick = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    onPhotoSelect(photo);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100vh',
        width: collapsed ? '48px' : '360px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 20,
      }}
    >
      <button
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? '展开照片列表' : '收起照片列表'}
        style={{
          position: 'absolute',
          left: collapsed ? 0 : '-36px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '36px',
          height: '64px',
          border: '1px solid #3E4155',
          borderRight: collapsed ? '1px solid #3E4155' : 'none',
          borderRadius: collapsed ? '12px 0 0 12px' : '12px 0 0 12px',
          background: '#1B1E2F',
          color: '#D1D5DB',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s ease',
          zIndex: 22,
          boxShadow: collapsed ? '-2px 0 14px rgba(0,0,0,0.35)' : '-2px 0 14px rgba(0,0,0,0.35)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#2A2D3A')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#1B1E2F')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {!collapsed && (
        <>
          <div
            style={{
              padding: '20px 18px 12px',
              borderBottom: '1px solid #2A2D3A',
              background: 'linear-gradient(180deg, rgba(27,30,47,0.96) 0%, rgba(27,30,47,0.88) 100%)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <div>
                  <div style={{ color: '#D1D5DB', fontSize: 14, fontWeight: 600, letterSpacing: 0.3 }}>作品集</div>
                  <div style={{ color: '#7B7F95', fontSize: 11, marginTop: 2 }}>
                    {filteredPhotos.length} / {photos.length} 张
                  </div>
                </div>
              </div>
            </div>

            <input
              type="text"
              value={filter.keyword}
              placeholder="搜索地点、城市或标题…"
              onChange={(e) => onFilterChange({ ...filter, keyword: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px 10px 36px',
                borderRadius: 10,
                border: '1px solid #3E4155',
                background: '#12152A',
                color: '#D1D5DB',
                fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%237B7F95' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='7'/><path d='m21 21-4.3-4.3'/></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '12px 50%',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#60A5FA';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96,165,250,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#3E4155';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <div
              style={{
                marginTop: 12,
                border: '1px solid #3E4155',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#12152A',
              }}
            >
              <button
                onClick={() => setFilterOpen((v) => !v)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  color: '#D1D5DB',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  参数筛选
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {filterOpen && (
                <div
                  style={{
                    padding: '6px 12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    borderTop: '1px solid #2A2D3A',
                    animation: 'slideDown 0.3s ease',
                  }}
                >
                  <FilterRangeSlider
                    label="光圈"
                    min={1.4}
                    max={16}
                    step={0.1}
                    value={filter.apertureRange}
                    marks={[1.4, 2.8, 4, 5.6, 8, 11, 16]}
                    format={(v) => `f/${v}`}
                    onChange={(v) => onFilterChange({ ...filter, apertureRange: v })}
                  />
                  <div>
                    <div style={{ fontSize: 11, color: '#9AA0B5', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span>快门速度</span>
                      <span style={{ color: '#60A5FA', fontFamily: 'monospace' }}>
                        {SHUTTER_SPEEDS[filter.shutterMinIdx]} ~ {SHUTTER_SPEEDS[filter.shutterMaxIdx]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={filter.shutterMinIdx}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          onFilterChange({ ...filter, shutterMinIdx: Math.min(val, filter.shutterMaxIdx) });
                        }}
                        style={selectStyle}
                      >
                        {SHUTTER_SPEEDS.map((s, i) => <option key={s + 'min'} value={i}>{s}s</option>)}
                      </select>
                      <select
                        value={filter.shutterMaxIdx}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          onFilterChange({ ...filter, shutterMaxIdx: Math.max(val, filter.shutterMinIdx) });
                        }}
                        style={selectStyle}
                      >
                        {SHUTTER_SPEEDS.map((s, i) => <option key={s + 'max'} value={i}>{s}s</option>)}
                      </select>
                    </div>
                  </div>
                  <FilterRangeSlider
                    label="ISO"
                    min={100}
                    max={6400}
                    step={100}
                    value={filter.isoRange}
                    marks={[100, 400, 800, 1600, 3200, 6400]}
                    format={(v) => `${v}`}
                    onChange={(v) => onFilterChange({ ...filter, isoRange: v })}
                  />
                  <button
                    onClick={() => onFilterChange({
                      keyword: '',
                      apertureRange: [1.4, 16],
                      shutterMinIdx: 0,
                      shutterMaxIdx: SHUTTER_SPEEDS.length - 1,
                      isoRange: [100, 6400],
                    })}
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #3E4155',
                      background: '#2A2D3A',
                      color: '#D1D5DB',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#60A5FA'; e.currentTarget.style.color = '#60A5FA'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3E4155'; e.currentTarget.style.color = '#D1D5DB'; }}
                  >
                    重置筛选条件
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            ref={scrollRef}
            key={fadeKey}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 14px 40px',
              background: 'rgba(27,30,47,0.82)',
              backdropFilter: 'blur(12px)',
              animation: 'fadeIn 0.3s ease both',
              scrollbarWidth: 'thin',
              scrollbarColor: '#3E4155 transparent',
            }}
          >
            {filteredPhotos.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#7B7F95' }}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#3E4155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block' }}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <div style={{ fontSize: 13 }}>没有符合条件的照片</div>
                <div style={{ fontSize: 11, marginTop: 6 }}>试试调整筛选条件</div>
              </div>
            ) : (
              <div
                style={{
                  columnCount: 1,
                  columnWidth: 240,
                  columnGap: 12,
                }}
              >
                {filteredPhotos.map((p, idx) => {
                  const selected = selectedPhotoId === p.id;
                  const h = cardHeights[idx];
                  return (
                    <div
                      key={p.id}
                      onClick={(e) => handlePhotoClick(e, p)}
                      style={{
                        breakInside: 'avoid',
                        marginBottom: 12,
                        borderRadius: 8,
                        border: `1px solid ${selected ? '#60A5FA' : '#3E4155'}`,
                        background: '#2A2D3A',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.28s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.28s ease, border-color 0.25s ease',
                        transform: selected ? 'translateY(-3px)' : 'translateY(0)',
                        boxShadow: selected
                          ? '0 8px 24px rgba(96,165,250,0.18), 0 2px 6px rgba(0,0,0,0.3)'
                          : '0 2px 4px rgba(0,0,0,0.2)',
                        animation: `cardIn 0.4s cubic-bezier(0.2, 0, 0.2, 1) ${idx * 0.012}ms both`,
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)';
                          e.currentTarget.style.borderColor = '#50607F';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                          e.currentTarget.style.borderColor = '#3E4155';
                        }
                      }}
                    >
                      <div style={{ width: '100%', height: h, position: 'relative', background: '#0F1120', overflow: 'hidden' }}>
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '20px 10px 8px',
                          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)',
                          color: '#fff',
                          fontSize: 10,
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          opacity: 0.92,
                          fontFamily: 'monospace',
                        }}>
                          <span>f/{p.params.aperture}</span>
                          <span>{p.params.shutter}s</span>
                          <span>ISO {p.params.iso}</span>
                        </div>
                      </div>
                      <div style={{ padding: '9px 11px 11px' }}>
                        <div style={{
                          color: '#D1D5DB',
                          fontSize: 12.5,
                          fontWeight: 600,
                          marginBottom: 4,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>{p.title}</div>
                        <div style={{
                          color: '#7B7F95',
                          fontSize: 10.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {p.location.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideDown { from { max-height: 0; opacity: 0 } to { max-height: 1000px; opacity: 1 } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3E4155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #505469; }
      `}</style>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: '7px 9px',
  borderRadius: 7,
  border: '1px solid #3E4155',
  background: '#0F1120',
  color: '#D1D5DB',
  fontSize: 11.5,
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'monospace',
};

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  marks: number[];
  format: (v: number) => string;
  onChange: (v: [number, number]) => void;
}

function FilterRangeSlider({ label, min, max, step, value, marks, format, onChange }: RangeSliderProps) {
  const range = max - min;
  const [a, b] = value;
  const left = ((a - min) / range) * 100;
  const right = ((b - min) / range) * 100;
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9AA0B5', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color: '#60A5FA', fontFamily: 'monospace' }}>{format(a)} ~ {format(b)}</span>
      </div>
      <div style={{ position: 'relative', height: 24 }}>
        <div style={{ position: 'absolute', top: 11, left: 0, right: 0, height: 3, background: '#1B1E2F', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: 11, left: `${left}%`, width: `${right - left}%`, height: 3, background: 'linear-gradient(90deg,#4A90D9,#50E3C2)', borderRadius: 2 }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={a}
          onChange={(e) => onChange([Math.min(Number(e.target.value), b), b])}
          style={thumbStyle(left)}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={b}
          onChange={(e) => onChange([a, Math.max(Number(e.target.value), a)])}
          style={thumbStyle(right)}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        {marks.map((m) => (
          <div key={m} style={{ fontSize: 9, color: '#5A5E75', fontFamily: 'monospace' }}>{format(m)}</div>
        ))}
      </div>
    </div>
  );
}

function thumbStyle(pct: number): React.CSSProperties {
  return {
    position: 'absolute',
    top: 4,
    left: `${pct}%`,
    width: 16,
    height: 16,
    marginLeft: -8,
    WebkitAppearance: 'none',
    appearance: 'none',
    background: 'transparent',
    cursor: 'pointer',
    pointerEvents: 'auto',
    zIndex: 3,
  } as React.CSSProperties;
}

// Inject range thumb styles once
(function injectRangeStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('range-slider-style')) return;
  const style = document.createElement('style');
  style.id = 'range-slider-style';
  style.textContent = `
    input[type='range']::-webkit-slider-runnable-track { background: transparent; height: 3px; }
    input[type='range']::-moz-range-track { background: transparent; height: 3px; }
    input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 14px; height: 14px; margin-top: -5.5px;
      border-radius: 50%; border: 2px solid #60A5FA;
      background: #1B1E2F; box-shadow: 0 0 0 3px rgba(96,165,250,0.12);
      cursor: pointer; transition: all 0.18s ease;
    }
    input[type='range']::-webkit-slider-thumb:hover { background: #60A5FA; transform: scale(1.15); }
    input[type='range']::-moz-range-thumb {
      width: 14px; height: 14px;
      border-radius: 50%; border: 2px solid #60A5FA;
      background: #1B1E2F; cursor: pointer;
    }
  `;
  document.head.appendChild(style);
})();
