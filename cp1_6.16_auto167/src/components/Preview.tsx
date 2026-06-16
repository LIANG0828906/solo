import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
import { useLayoutStore } from '@/store/layoutStore';
import { Zone } from '@/types';

interface Props {
  inline?: boolean;
}

function computeExhibitLayout(count: number, zoneWidth: number, zoneHeight: number) {
  if (count === 0) return [];
  const padding = 40;
  const availableW = zoneWidth - padding * 2;
  const availableH = zoneHeight - padding * 2;
  let cols = 1;
  let rows = 1;
  if (count <= 3) {
    cols = count;
    rows = 1;
  } else {
    cols = Math.ceil(Math.sqrt(count));
    rows = Math.ceil(count / cols);
  }
  const cellW = availableW / cols;
  const cellH = availableH / rows;
  const baseSize = Math.min(cellW, cellH) * 0.78;
  const positions: { x: number; y: number; size: number; delay: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    positions.push({
      x: padding + cellW * (col + 0.5),
      y: padding + cellH * (row + 0.5),
      size: Math.max(baseSize, 60),
      delay: i * 0.3,
    });
  }
  return positions;
}

export default function Preview({ inline = false }: Props) {
  const navigate = useNavigate();
  const { zones, setViewMode } = useLayoutStore();
  const [currentZoneIdx, setCurrentZoneIdx] = useState(0);
  const [fadeKey, setFadeKey] = useState(Date.now());
  const [autoPlay, setAutoPlay] = useState(false);

  const sortedZones = useMemo(
    () => [...zones].sort((a, b) => a.zIndex - b.zIndex),
    [zones]
  );
  const currentZone: Zone | undefined = sortedZones[currentZoneIdx];

  useEffect(() => {
    if (!autoPlay) return;
    if (sortedZones.length <= 1) return;
    const baseTime = 2500;
    const exhibitsDelay = currentZone ? currentZone.exhibits.length * 300 : 0;
    const id = setTimeout(() => {
      setCurrentZoneIdx((i) => (i + 1) % sortedZones.length);
      setFadeKey(Date.now());
    }, baseTime + exhibitsDelay);
    return () => clearTimeout(id);
  }, [autoPlay, currentZoneIdx, sortedZones.length, currentZone, fadeKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewMode('edit');
        if (!inline) navigate('/');
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentZoneIdx((i) => (i + 1) % Math.max(1, sortedZones.length));
        setFadeKey(Date.now());
      }
      if (e.key === 'ArrowLeft') {
        setCurrentZoneIdx(
          (i) => (i - 1 + sortedZones.length) % Math.max(1, sortedZones.length)
        );
        setFadeKey(Date.now());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, inline, setViewMode, sortedZones.length]);

  if (!currentZone) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-4">
          <div className="font-display text-2xl" style={{ color: 'rgba(224,224,224,0.5)' }}>
            暂无可预览的展区
          </div>
          <button
            className="btn-base btn-primary"
            onClick={() => {
              setViewMode('edit');
              if (!inline) navigate('/');
            }}
          >
            返回编辑
          </button>
        </div>
      </div>
    );
  }

  const isRect = currentZone.type === 'rect';
  const isDarkBg =
    currentZone.bgColor === '#2C3E50' ||
    currentZone.bgColor === '#8B2635' ||
    currentZone.bgColor === '#2D5A27' ||
    currentZone.bgColor === '#1D4E89' ||
    currentZone.bgColor === '#8B6914';

  const baseW = 800;
  const baseH = 600;
  const layouts = computeExhibitLayout(currentZone.exhibits.length, baseW, baseH);

  const textColor = isDarkBg ? '#F0F0F5' : '#1A1A2E';
  const subColor = isDarkBg ? 'rgba(255,255,255,0.75)' : 'rgba(44,62,80,0.75)';

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 顶部栏 */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="font-display text-xl" style={{ color: 'white' }}>
            展览预览
          </div>
          <div className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
            {currentZoneIdx + 1} / {sortedZones.length}
          </div>
          {currentZone.title && (
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
              · {currentZone.title}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-base"
            style={{
              background: autoPlay ? 'var(--accent-2)' : 'rgba(255,255,255,0.1)',
              color: 'white',
            }}
            onClick={() => {
              setAutoPlay((a) => !a);
              setFadeKey(Date.now());
            }}
          >
            <Play size={14} />
            {autoPlay ? '自动播放中' : '自动播放'}
          </button>
          <button
            className="btn-base"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            onClick={() => {
              setViewMode('edit');
              if (!inline) navigate('/');
            }}
          >
            <X size={16} />
            退出预览
          </button>
        </div>
      </div>

      {/* 主展区 */}
      <div key={fadeKey} className="w-full h-full flex items-center justify-center p-16">
        <div
          style={{
            position: 'relative',
            width: baseW,
            height: baseH,
            background: currentZone.bgColor,
            borderRadius: isRect ? 16 : '50%',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
            overflow: 'hidden',
            transform: isRect ? undefined : 'scale(0.85)',
          }}
        >
          {/* 展区标题区 */}
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: 32,
              zIndex: 5,
            }}
          >
            <div className="font-display text-3xl font-semibold" style={{ color: textColor }}>
              {currentZone.title || '未命名展区'}
            </div>
            {currentZone.note && (
              <div className="text-sm mt-2 max-w-md" style={{ color: subColor, lineHeight: 1.6 }}>
                {currentZone.note}
              </div>
            )}
            <div
              className="text-[11px] mt-3 inline-block px-3 py-1 rounded-full"
              style={{
                background: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                color: subColor,
              }}
            >
              {currentZone.exhibits.length} 件展品
            </div>
          </div>

          {/* 展品 */}
          {currentZone.exhibits.map((ex, idx) => {
            const layout = layouts[idx];
            if (!layout) return null;
            const actual = layout.size * ex.scale;
            return (
              <div
                key={ex.id}
                className="exhibit-fade-in"
                style={{
                  position: 'absolute',
                  left: layout.x - actual / 2,
                  top: layout.y - actual / 2 + 20,
                  width: actual,
                  height: actual,
                  animationDelay: `${layout.delay + 0.3}s`,
                }}
              >
                <div
                  className="w-full h-full rounded-lg overflow-hidden"
                  style={{
                    backgroundImage: `url(${ex.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                />
                {ex.label && (
                  <div
                    className="text-center mt-3 font-medium"
                    style={{
                      fontSize: 14,
                      color: '#2C3E50',
                      fontFamily: "'Noto Sans SC', sans-serif",
                      textShadow: isDarkBg ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                    }}
                  >
                    <span style={{ color: isDarkBg ? '#E8E8F0' : '#2C3E50' }}>{ex.label}</span>
                  </div>
                )}
              </div>
            );
          })}

          {currentZone.exhibits.length === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ color: subColor, opacity: 0.4 }}
            >
              <div className="text-center">
                <div className="font-display text-2xl mb-2">展区待布置</div>
                <div className="text-sm">返回编辑模式添加展品</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 导航按钮 */}
      {sortedZones.length > 1 && (
        <>
          <button
            className="absolute left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            onClick={() => {
              setCurrentZoneIdx(
                (i) => (i - 1 + sortedZones.length) % sortedZones.length
              );
              setFadeKey(Date.now());
            }}
          >
            <ChevronLeft size={28} />
          </button>
          <button
            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            onClick={() => {
              setCurrentZoneIdx((i) => (i + 1) % sortedZones.length);
              setFadeKey(Date.now());
            }}
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* 底部展区指示器 */}
      {sortedZones.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {sortedZones.map((z, i) => (
            <button
              key={z.id}
              className="w-8 h-1.5 rounded-full transition-all"
              style={{
                background:
                  i === currentZoneIdx ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
              }}
              onClick={() => {
                setCurrentZoneIdx(i);
                setFadeKey(Date.now());
              }}
            />
          ))}
        </div>
      )}

      {/* 快捷键提示 */}
      <div
        className="absolute bottom-6 right-6 z-20 text-[11px] px-3 py-1.5 rounded-md"
        style={{
          background: 'rgba(0,0,0,0.3)',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        ←/→ 切换 · ESC 返回
      </div>
    </div>
  );
}
