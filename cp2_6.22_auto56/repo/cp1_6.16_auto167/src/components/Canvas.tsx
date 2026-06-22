import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '@/store/layoutStore';
import { Path, PathPoint, BG_PRIMARY } from '@/types';
import Ruler from './Ruler';
import ZoneComponent from './Zone';
import VisitorSimulator from './VisitorSim';

const RULER_PADDING = 24;

function buildPathD(points: PathPoint[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const prev = points[i - 1];
    if (prev.bezier) {
      d += ` C ${prev.bezier.cp1x} ${prev.bezier.cp1y}, ${prev.bezier.cp2x} ${prev.bezier.cp2y}, ${p.x} ${p.y}`;
    } else {
      d += ` L ${p.x} ${p.y}`;
    }
  }
  return d;
}

export default function Canvas() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef<null | { startX: number; startY: number; origX: number; origY: number }>(null);

  const {
    zones,
    paths,
    selectedZoneId,
    currentViewMode,
    canvas,
    isDrawingPath,
    currentPathPoints,
    setCanvas,
    selectZone,
    addPathPoint,
  } = useLayoutStore();

  const sortedZones = useMemo(
    () => [...zones].sort((a, b) => a.zIndex - b.zIndex),
    [zones]
  );

  const viewMode = currentViewMode;

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const x = (clientX - rect.left - RULER_PADDING - canvas.offsetX) / canvas.zoom;
      const y = (clientY - rect.top - RULER_PADDING - canvas.offsetY) / canvas.zoom;
      return { x, y };
    },
    [canvas]
  );

  useEffect(() => {
    if (viewMode === 'preview' && zones.length > 0) {
      navigate('/preview');
      setTimeout(() => useLayoutStore.getState().setViewMode('edit'), 100);
    }
  }, [viewMode, zones.length, navigate]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left - RULER_PADDING;
      const my = e.clientY - rect.top - RULER_PADDING;

      const delta = -e.deltaY * 0.0015;
      const nextZoom = Math.min(4, Math.max(0.25, canvas.zoom * (1 + delta)));
      const ratio = nextZoom / canvas.zoom;

      setCanvas({
        zoom: nextZoom,
        offsetX: mx - (mx - canvas.offsetX) * ratio,
        offsetY: my - (my - canvas.offsetY) * ratio,
      });
    };

    const wrapper = wrapperRef.current;
    if (wrapper) wrapper.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      if (wrapper) wrapper.removeEventListener('wheel', onWheel);
    };
  }, [canvas, setCanvas]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (viewMode === 'visitor') return;
    if (isDrawingPath) {
      if (e.button === 0) {
        const wp = screenToWorld(e.clientX, e.clientY);
        addPathPoint(wp);
      } else if (e.button === 2) {
        useLayoutStore.getState().finishDrawingPath();
      }
      return;
    }
    if (e.button === 1) {
      e.preventDefault();
      panStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: canvas.offsetX,
        origY: canvas.offsetY,
      };
      return;
    }
    if (e.button === 0 && e.currentTarget === e.target) {
      selectZone(null);
    }
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!panStateRef.current) return;
      setCanvas({
        offsetX: panStateRef.current.origX + (e.clientX - panStateRef.current.startX),
        offsetY: panStateRef.current.origY + (e.clientY - panStateRef.current.startY),
      });
    };
    const onUp = () => {
      panStateRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setCanvas]);

  const onContextMenu = (e: React.MouseEvent) => {
    if (isDrawingPath) {
      e.preventDefault();
      useLayoutStore.getState().finishDrawingPath();
    }
  };

  const allPaths: (Path & { isTemp?: boolean })[] = useMemo(
    () => [
      ...paths,
      ...(currentPathPoints.length > 0
        ? [
            {
              id: '__temp__',
              points: currentPathPoints,
              color: '#8E44AD',
              width: 2,
              isTemp: true,
            },
          ]
        : []),
    ],
    [paths, currentPathPoints]
  );

  return (
    <div
      ref={wrapperRef}
      className="flex-1 relative h-full overflow-hidden"
      style={{ background: BG_PRIMARY }}
      onContextMenu={onContextMenu}
    >
      {/* 画布状态指示器 */}
      <div
        className="absolute z-[30] right-4 top-[34px] px-3 py-1.5 rounded-md text-[11px] flex items-center gap-3"
        style={{
          background: 'rgba(22, 33, 62, 0.85)',
          color: '#C0C0D0',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <span>缩放 {Math.round(canvas.zoom * 100)}%</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>
          位置 {Math.round(canvas.offsetX)}, {Math.round(canvas.offsetY)}
        </span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>
          展区 {zones.length} · 动线 {paths.length}
        </span>
      </div>

      <div
        ref={containerRef}
        className="absolute inset-0"
        onMouseDown={onMouseDown}
        style={{ cursor: isDrawingPath ? 'crosshair' : panStateRef.current ? 'grabbing' : 'default' }}
      >
        <Ruler />

        {/* 内容区域 - 带标尺偏移 */}
        <div
          style={{
            position: 'absolute',
            top: RULER_PADDING,
            left: RULER_PADDING,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
          }}
        >
          {/* 世界层 */}
          <div
            className="canvas-grid absolute"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              transform: `translate(${canvas.offsetX}px, ${canvas.offsetY}px) scale(${canvas.zoom})`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          >
            {/* SVG 路径层 */}
            <svg
              width={10000}
              height={10000}
              style={{
                position: 'absolute',
                left: -5000,
                top: -5000,
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="#8E44AD" />
                </marker>
              </defs>
              <g transform="translate(5000,5000)">
                {allPaths.map((p) => (
                  <g key={p.id}>
                    <path
                      className="path-curve"
                      d={buildPathD(p.points)}
                      stroke={p.isTemp ? '#bb86d6' : p.color}
                      strokeWidth={p.width / canvas.zoom}
                      strokeDasharray={p.isTemp ? '8 4' : undefined}
                      opacity={p.isTemp ? 0.75 : 0.6}
                      markerEnd={!p.isTemp ? 'url(#arrow)' : undefined}
                    />
                    {p.points.map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={6 / canvas.zoom}
                        fill={p.isTemp ? '#8E44AD' : 'transparent'}
                        stroke={p.isTemp ? 'white' : 'transparent'}
                        strokeWidth={1 / canvas.zoom}
                      />
                    ))}
                  </g>
                ))}
              </g>
            </svg>

            {/* 访客轨迹模拟 */}
            {viewMode === 'visitor' && paths.length > 0 && <VisitorSimulator />}

            {/* 展区 */}
            <div style={{ position: 'absolute', left: 0, top: 0 }}>
              {sortedZones.map((z) => (
                <ZoneComponent
                  key={z.id}
                  zone={z}
                  isSelected={selectedZoneId === z.id}
                  viewMode={viewMode}
                  canvasZoom={canvas.zoom}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 空状态 */}
        {zones.length === 0 && !isDrawingPath && viewMode === 'edit' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none"
            style={{ zIndex: 5, paddingLeft: RULER_PADDING, paddingTop: RULER_PADDING }}
          >
            <div
              className="font-display text-3xl"
              style={{
                color: 'rgba(224, 224, 224, 0.35)',
                letterSpacing: '0.05em',
              }}
            >
              开启你的策展之旅
            </div>
            <div className="text-sm" style={{ color: 'rgba(160,160,176,0.5)' }}>
              点击左侧工具栏创建第一个展区 · 滚轮缩放 · 鼠标中键平移画布
            </div>
          </div>
        )}

        {/* 动线绘制提示 */}
        {isDrawingPath && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-[42px] z-[25] px-4 py-2 rounded-lg text-xs"
            style={{
              background: 'rgba(142, 68, 173, 0.9)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(142,68,173,0.4)',
            }}
          >
            左键添加路径点 · 右键或工具栏"完成"结束绘制（当前
            {currentPathPoints.length} 个点）
          </div>
        )}
      </div>
    </div>
  );
}
