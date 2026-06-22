import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { EarthScene, type EarthSceneHandle } from './EarthScene';
import { PhotoGallery } from './PhotoGallery';
import { StatsCalculator } from './StatsCalculator';
import type { Photo, FilterState, StatsData } from './types';
import { generateMockPhotos, SHUTTER_SPEEDS } from './mockData';

export default function App() {
  const earthRef = useRef<EarthSceneHandle | null>(null);
  const [photos, setPhotos] = useState<Photo[]>(() => generateMockPhotos(260));
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    keyword: '',
    apertureRange: [1.4, 16],
    shutterMinIdx: 0,
    shutterMaxIdx: SHUTTER_SPEEDS.length - 1,
    isoRange: [100, 6400],
  });
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties | null>(null);
  const [statsTick, setStatsTick] = useState(0);
  const [, setCamTick] = useState(0);

  const stats: StatsData = useMemo(() => {
    const s = new StatsCalculator(photos);
    return s.compute();
  }, [photos, statsTick]);

  const shutterValue = (s: string): number => {
    const parts = s.split('/');
    if (parts.length === 2) { const [a, b] = parts.map(Number); return a / b; }
    return Number(s);
  };

  const visiblePhotos = useMemo(() => {
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

  const updatePopupPosition = useCallback(() => {
    if (!selectedPhoto || !earthRef.current) return;
    const proj = earthRef.current.projectPhoto(selectedPhoto.id);
    if (!proj || !proj.visible) {
      setPopupStyle((s) => s ? { ...s, opacity: 0, pointerEvents: 'none' } : s);
      return;
    }
    const size = earthRef.current.getSize();
    const popupW = 280;
    const popupH = 300;
    let x = proj.x - popupW / 2;
    let y = proj.y - popupH - 28;
    if (x < 12) x = 12;
    if (x + popupW > size.width - 12) x = size.width - popupW - 12;
    if (y < 78) { y = proj.y + 36; }
    setPopupStyle({
      position: 'fixed',
      left: x,
      top: y,
      width: popupW,
      opacity: 1,
      pointerEvents: 'auto',
      transform: 'translateY(0)',
      transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
      zIndex: 40,
    });
  }, [selectedPhoto]);

  useEffect(() => {
    const id = requestAnimationFrame(function loop() {
      updatePopupPosition();
      setCamTick((t) => (t + 1) % 1_000_000);
      requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [updatePopupPosition]);

  const handleMarkerClick = useCallback((p: Photo | null) => {
    setSelectedPhoto(p);
    if (p) {
      setTimeout(updatePopupPosition, 30);
    } else {
      setPopupStyle(null);
    }
  }, [updatePopupPosition]);

  const handlePhotoSelect = useCallback((photo: Photo) => {
    setSelectedPhoto(photo);
    earthRef.current?.flyToPhoto(photo.id, 600);
    setTimeout(() => updatePopupPosition(), 650);
  }, [updatePopupPosition]);

  // Close popup on Escape or clicking the dark area of earth
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
        setPopupStyle(null);
        earthRef.current?.clearSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const apMax = Math.max(1, ...stats.apertureDistribution.map((d) => d.value));
  const shMax = Math.max(1, ...stats.shutterDistribution.map((d) => d.value));

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      background: '#0A0D1C',
      color: '#D1D5DB',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 50% 50%, rgba(96,165,250,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 20% 80%, rgba(74,144,217,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 40% 30% at 80% 20%, rgba(80,227,194,0.05) 0%, transparent 70%),
          linear-gradient(180deg, #0B0E20 0%, #1B1E2F 40%, #16192A 100%)
        `,
        zIndex: 0,
      }} />

      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #60A5FA 0%, #50E3C2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(96,165,250,0.3)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <div>
          <div style={{
            fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.5,
            background: 'linear-gradient(90deg, #fff 0%, #B3C1E8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>StreetPhoto Atlas</div>
          <div style={{ fontSize: 11, color: '#7B7F95', marginTop: 2, letterSpacing: 0.4 }}>街头摄影 · 全球足迹在线影集</div>
        </div>
      </div>

      <EarthScene
        ref={earthRef}
        photos={visiblePhotos}
        onMarkerClick={handleMarkerClick}
      />

      {/* Stats Panel */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: collapsedPlaceholder() ? 20 : 390,
        zIndex: 15,
        width: 268,
        background: 'rgba(27,30,47,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid #3E4155',
        borderRadius: 14,
        padding: '16px 16px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#50E3C2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', letterSpacing: 0.3 }}>数据总览</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <StatCard
            label="总照片数"
            value={stats.totalPhotos.toLocaleString()}
            accent="#60A5FA"
            icon={(
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            )}
          />
          <StatCard
            label="覆盖城市"
            value={`${stats.coveredCities}`}
            accent="#50E3C2"
            icon={(
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            )}
          />
        </div>
        <MiniBarChart title="光圈分布" data={stats.apertureDistribution} max={apMax} />
        <div style={{ height: 12 }} />
        <MiniBarChart title="快门分布" data={stats.shutterDistribution} max={shMax} />
      </div>

      <PhotoGallery
        photos={photos}
        filter={filter}
        onFilterChange={setFilter}
        selectedPhotoId={selectedPhoto?.id ?? null}
        onPhotoSelect={handlePhotoSelect}
      />

      {/* Photo Info Popup */}
      {selectedPhoto && popupStyle && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={popupStyle}
        >
          <div style={{
            width: '100%',
            background: '#000000CC',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 14px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(96,165,250,0.12)',
            animation: 'popupIn 0.28s cubic-bezier(0.2, 0, 0.2, 1)',
          }}>
            <div style={{ position: 'relative' }}>
              <img src={selectedPhoto.thumbnail} alt={selectedPhoto.title} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => { setSelectedPhoto(null); setPopupStyle(null); earthRef.current?.clearSelection(); }}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 24, height: 24, borderRadius: '50%',
                  border: 'none', cursor: 'pointer',
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(96,165,250,0.8)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.55)')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '12px 14px 14px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{selectedPhoto.title}</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11.5, color: '#B3B8CE', marginBottom: 12 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1.5, flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{selectedPhoto.location.name}</span>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
                padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <ParamItem label="光圈" value={`f/${selectedPhoto.params.aperture}`} />
                <ParamItem label="快门" value={`${selectedPhoto.params.shutter}s`} />
                <ParamItem label="ISO" value={`${selectedPhoto.params.iso}`} />
              </div>
            </div>
          </div>
          <style>{`
            @keyframes popupIn { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}</style>
        </div>
      )}

      {/* Footer hint */}
      <div style={{
        position: 'absolute',
        bottom: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '8px 16px',
        background: 'rgba(27,30,47,0.55)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(62,65,85,0.5)',
        borderRadius: 999,
        fontSize: 11,
        color: '#7B7F95',
        pointerEvents: 'none',
      }}>
        <HintItem label="拖拽旋转" />
        <HintItem label="滚轮缩放" />
        <HintItem label="点击标记查看" />
        <HintItem label="Esc 关闭" />
      </div>
    </div>
  );
}

function collapsedPlaceholder(): boolean { return false; }

function HintItem({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#60A5FA', opacity: 0.8 }} />
      <span>{label}</span>
    </div>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: React.ReactNode }) {
  return (
    <div style={{
      padding: '10px 11px',
      borderRadius: 10,
      border: '1px solid #3E4155',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}00, ${accent}, ${accent}00)`,
      }} />
      <div style={{ color: accent, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 10.5, color: '#9AA0B5', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{
        fontSize: 20, fontWeight: 700, color: '#fff',
        letterSpacing: -0.3,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}>{value}</div>
    </div>
  );
}

function ParamItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9.5, color: '#7B7F95', marginBottom: 3, letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#fff', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

interface BarData { label: string; value: number }
function MiniBarChart({ title, data, max }: { title: string; data: BarData[]; max: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 10.5, color: '#9AA0B5', fontWeight: 500, letterSpacing: 0.2 }}>{title}</div>
        {hoverIdx !== null && data[hoverIdx] && (
          <div style={{
            fontSize: 10, color: '#50E3C2',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(80,227,194,0.08)',
            border: '1px solid rgba(80,227,194,0.2)',
          }}>
            {data[hoverIdx].value} 张
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          const isHover = hoverIdx === i;
          return (
            <div
              key={d.label + i}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                position: 'relative',
                cursor: 'pointer',
              }}
              title={`${d.label}: ${d.value}`}
            >
              <div style={{
                width: '100%',
                height: `${Math.max(2, h)}%`,
                minHeight: 2,
                background: `linear-gradient(180deg, #50E3C2 0%, #4A90D9 100%)`,
                borderRadius: isHover ? 3 : 2,
                opacity: isHover ? 1 : 0.8,
                boxShadow: isHover ? '0 0 8px rgba(80,227,194,0.4)' : 'none',
                transition: 'all 0.2s ease',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        {data.map((d, i) => (
          <div key={d.label + 'l' + i} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 8,
            color: hoverIdx === i ? '#50E3C2' : '#5A5E75',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease',
          }}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}
