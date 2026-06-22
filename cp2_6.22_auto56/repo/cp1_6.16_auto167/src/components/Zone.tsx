import { useRef, useState, useEffect, useMemo } from 'react';
import { Zone as ZoneType, ExhibitItem, TEXT_PRIMARY } from '@/types';
import { useLayoutStore } from '@/store/layoutStore';

interface Props {
  zone: ZoneType;
  isSelected: boolean;
  viewMode: 'edit' | 'preview' | 'visitor';
  canvasZoom: number;
}

function computeExhibitLayout(count: number, zoneWidth: number, zoneHeight: number) {
  if (count === 0) return [];
  const padding = 24;
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
    const cx = padding + cellW * (col + 0.5);
    const cy = padding + cellH * (row + 0.5);
    positions.push({
      x: cx,
      y: cy,
      size: Math.max(baseSize, 36),
      delay: i * 0.3,
    });
  }
  return positions;
}

export default function ZoneComponent({ zone, isSelected, viewMode, canvasZoom }: Props) {
  const {
    updateZone,
    selectZone,
    updateExhibit,
    removeExhibit,
  } = useLayoutStore();

  const zoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<null | {
    mode: 'move' | 'resize-br' | 'resize-tr' | 'resize-bl' | 'resize-tl' | 'resize-b' | 'resize-r' | 'resize-l' | 'resize-t';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  }>(null);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragging.startX) / canvasZoom;
      const dy = (e.clientY - dragging.startY) / canvasZoom;
      if (dragging.mode === 'move') {
        updateZone(zone.id, {
          x: dragging.origX + dx,
          y: dragging.origY + dy,
        });
      } else {
        let newX = dragging.origX;
        let newY = dragging.origY;
        let newW = dragging.origW;
        let newH = dragging.origH;
        if (dragging.mode.includes('r')) newW = Math.max(120, dragging.origW + dx);
        if (dragging.mode.includes('l')) {
          const diff = dragging.origW - dx;
          if (diff >= 120) {
            newW = diff;
            newX = dragging.origX + dx;
          }
        }
        if (dragging.mode.includes('b')) newH = Math.max(120, dragging.origH + dy);
        if (dragging.mode.includes('t')) {
          const diff = dragging.origH - dy;
          if (diff >= 120) {
            newH = diff;
            newY = dragging.origY + dy;
          }
        }
        updateZone(zone.id, { x: newX, y: newY, width: newW, height: newH });
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, canvasZoom, zone.id, updateZone]);

  const exhibitLayout = useMemo(
    () => computeExhibitLayout(zone.exhibits.length, zone.width, zone.height),
    [zone.exhibits.length, zone.width, zone.height]
  );

  const isRect = zone.type === 'rect';
  const shapeStyle: React.CSSProperties = isRect
    ? { borderRadius: 10 }
    : { borderRadius: '50%' };

  const isDarkBg =
    zone.bgColor === '#2C3E50' ||
    zone.bgColor === '#8B2635' ||
    zone.bgColor === '#2D5A27' ||
    zone.bgColor === '#1D4E89' ||
    zone.bgColor === '#8B6914';

  const infoCardText = isDarkBg ? '#E0E0E0' : '#2C3E50';

  const textColor = isDarkBg ? '#E8E8E8' : '#1F1F2E';
  const labelColor = isDarkBg ? 'rgba(255,255,255,0.85)' : 'rgba(44,62,80,0.9)';

  const showControls = viewMode === 'edit' && isSelected;

  const handleResizeStart = (
    mode: typeof dragging extends null ? never : NonNullable<typeof dragging>['mode'],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDragging({
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: zone.x,
      origY: zone.y,
      origW: zone.width,
      origH: zone.height,
    });
  };

  const handleMoveStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    selectZone(zone.id);
    setDragging({
      mode: 'move',
      startX: e.clientX,
      startY: e.clientY,
      origX: zone.x,
      origY: zone.y,
      origW: zone.width,
      origH: zone.height,
    });
  };

  return (
    <div
      ref={zoneRef}
      onMouseDown={handleMoveStart}
      className={isSelected ? 'zone-selected' : ''}
      style={{
        position: 'absolute',
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        background: zone.bgColor,
        zIndex: zone.zIndex,
        transform: `rotate(${zone.rotation}deg)`,
        transformOrigin: 'center center',
        transition: dragging ? 'none' : 'box-shadow 0.2s ease',
        cursor: viewMode === 'edit' ? 'move' : 'default',
        willChange: 'transform',
        boxShadow: isSelected
          ? '0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(233,69,96,0.3)'
          : '0 6px 24px rgba(0,0,0,0.28)',
        ...shapeStyle,
        overflow: 'hidden',
      }}
    >
      {/* 展品 */}
      {zone.exhibits.map((ex: ExhibitItem, idx: number) => {
        const layout = exhibitLayout[idx];
        if (!layout) return null;
        const actualSize = layout.size * ex.scale;
        return (
          <div
            key={ex.id}
            className={viewMode === 'preview' ? 'exhibit-fade-in' : ''}
            style={{
              position: 'absolute',
              left: layout.x - actualSize / 2,
              top: layout.y - actualSize / 2,
              width: actualSize,
              height: actualSize,
              animationDelay: `${layout.delay}s`,
              zIndex: 2,
              cursor: viewMode === 'edit' ? 'pointer' : 'default',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (viewMode === 'edit') selectZone(zone.id);
            }}
          >
            <div
              className="exhibit-dragging w-full h-full rounded-md overflow-hidden"
              style={{
                backgroundImage: `url(${ex.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            {ex.label && (
              <div
                className="absolute left-0 right-0 text-center px-1"
                style={{
                  bottom: -20,
                  fontSize: 14,
                  color: '#2C3E50',
                  fontWeight: 500,
                  fontFamily: "'Noto Sans SC', sans-serif",
                  textShadow: isDarkBg ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                  colorText: labelColor,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  WebkitTextStroke: isDarkBg ? '0.3px rgba(0,0,0,0.1)' : undefined,
                }}
              >
                <span style={{ color: labelColor }}>{ex.label}</span>
              </div>
            )}
            {viewMode === 'edit' && isSelected && (
              <div
                className="absolute -top-2 -right-2 flex gap-1"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateExhibit(zone.id, ex.id, { scale: ex.scale + 0.1 });
                  }}
                  className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
                  style={{ background: 'var(--accent)', color: 'white' }}
                  title="放大"
                >
                  +
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateExhibit(zone.id, ex.id, { scale: ex.scale - 0.1 });
                  }}
                  className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
                  style={{ background: 'var(--accent-2)', color: 'white' }}
                  title="缩小"
                >
                  −
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeExhibit(zone.id, ex.id);
                  }}
                  className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
                  style={{ background: '#444', color: 'white' }}
                  title="删除"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* 信息卡片 - 右上角 */}
      {(viewMode === 'edit' || viewMode === 'visitor') && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            minWidth: 130,
            padding: '8px 12px',
            borderRadius: 8,
            background: isDarkBg
              ? 'rgba(15, 25, 50, 0.7)'
              : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(6px)',
            border: `1px solid ${isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            zIndex: 5,
            pointerEvents: 'auto',
            color: infoCardText,
          }}
        >
          <div className="font-display text-sm font-semibold truncate">
            {zone.title || '未命名展区'}
          </div>
          {zone.note && (
            <div
              className="text-[11px] mt-1 opacity-80 line-clamp-2"
              style={{ lineHeight: 1.4 }}
            >
              {zone.note}
            </div>
          )}
          <div
            className="text-[10px] mt-1.5 pt-1 border-t flex justify-between"
            style={{
              opacity: 0.7,
              borderColor: isDarkBg
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.1)',
            }}
          >
            <span>展品</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {zone.exhibits.length} 件
            </span>
          </div>
        </div>
      )}

      {/* 编辑模式控制柄 */}
      {showControls && (
        <>
          {/* 旋转指示 */}
          <div
            style={{
              position: 'absolute',
              top: -22,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 10,
              fontFamily: 'monospace',
              color: 'var(--accent)',
              background: 'rgba(0,0,0,0.4)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {zone.rotation}°
          </div>

          {/* 8个调整点 */}
          {(['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'] as const).map((pos) => {
            const cursorMap: Record<string, string> = {
              tl: 'nwse-resize',
              t: 'ns-resize',
              tr: 'nesw-resize',
              r: 'ew-resize',
              br: 'nwse-resize',
              b: 'ns-resize',
              bl: 'nesw-resize',
              l: 'ew-resize',
            };
            const posMap: Record<string, React.CSSProperties> = {
              tl: { top: -5, left: -5 },
              t: { top: -5, left: '50%', transform: 'translateX(-50%)' },
              tr: { top: -5, right: -5 },
              r: { top: '50%', right: -5, transform: 'translateY(-50%)' },
              br: { bottom: -5, right: -5 },
              b: { bottom: -5, left: '50%', transform: 'translateX(-50%)' },
              bl: { bottom: -5, left: -5 },
              l: { top: '50%', left: -5, transform: 'translateY(-50%)' },
            };
            const modeMap: Record<string, any> = {
              tl: 'resize-tl',
              t: 'resize-t',
              tr: 'resize-tr',
              r: 'resize-r',
              br: 'resize-br',
              b: 'resize-b',
              bl: 'resize-bl',
              l: 'resize-l',
            };
            return (
              <div
                key={pos}
                onMouseDown={(e) => handleResizeStart(modeMap[pos], e)}
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  background: 'var(--accent)',
                  border: '2px solid white',
                  borderRadius: 2,
                  cursor: cursorMap[pos],
                  zIndex: 10,
                  ...posMap[pos],
                }}
              />
            );
          })}
        </>
      )}

      {/* 空状态提示 */}
      {zone.exhibits.length === 0 && viewMode === 'edit' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{
            color: textColor,
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        >
          <div className="font-display text-lg">{zone.title}</div>
          <div className="text-[11px]">选中后添加展品</div>
        </div>
      )}
    </div>
  );
}
