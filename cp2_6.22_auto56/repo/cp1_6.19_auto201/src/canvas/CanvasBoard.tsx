import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  useCanvasStore,
  COVER_BASE_SIZE,
  CANVAS_WIDTH_MM,
  CANVAS_HEIGHT_MM,
  SNAP_GAP,
  SNAP_THRESHOLD,
  type CanvasCover,
} from './store';
import { pickTextColor } from '../utils/colorAnalysis';
import { useTrackStore } from '../track/store';

type DragMode = 'move' | 'rotate' | null;

interface DragState {
  id: string;
  mode: DragMode;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origRotation: number;
  centerX: number;
  centerY: number;
}

const getCoverSize = (cover: CanvasCover) => COVER_BASE_SIZE * cover.scale;

const getAABB = (cover: CanvasCover) => {
  const s = getCoverSize(cover);
  const cx = cover.x + s / 2;
  const cy = cover.y + s / 2;
  const rot = (cover.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rot));
  const sin = Math.abs(Math.sin(rot));
  const hw = (s / 2) * cos + (s / 2) * sin;
  const hh = (s / 2) * cos + (s / 2) * sin;
  return {
    left: cx - hw,
    right: cx + hw,
    top: cy - hh,
    bottom: cy + hh,
    cx,
    cy,
    hw,
    hh,
  };
};

const overlaps = (a: CanvasCover, b: CanvasCover): boolean => {
  const ba = getAABB(a);
  const bb = getAABB(b);
  return !(
    ba.right + SNAP_GAP <= bb.left ||
    bb.right + SNAP_GAP <= ba.left ||
    ba.bottom + SNAP_GAP <= bb.top ||
    bb.bottom + SNAP_GAP <= ba.top
  );
};

function snap(
  value: number,
  targets: number[],
  threshold: number = SNAP_THRESHOLD
): { snapped: number; matched: boolean } {
  for (const t of targets) {
    if (Math.abs(value - t) < threshold) return { snapped: t, matched: true };
  }
  return { snapped: value, matched: false };
}

const CoverCard: React.FC<{
  cover: CanvasCover;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent, mode: DragMode) => void;
  onScale: (scale: number) => void;
  onDelete: () => void;
}> = ({ cover, selected, onPointerDown, onScale, onDelete }) => {
  const size = getCoverSize(cover);
  const [c1, c2, c3] = cover.album.coverColors;
  const textColor = pickTextColor(c1);

  return (
    <div
      className={`cover-card ${selected ? 'selected' : ''}`}
      style={{
        left: cover.x,
        top: cover.y,
        width: size,
        height: size,
        transform: `rotate(${cover.rotation}deg)`,
        zIndex: cover.zIndex,
      }}
      onPointerDown={(e) => onPointerDown(e, 'move')}
    >
      <div
        className="cover-art"
        style={{
          background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3})`,
          color: textColor,
        }}
      >
        <div className="vinyl-disc">
          <div className="vinyl-grooves" />
          <div
            className="vinyl-label"
            style={{ backgroundColor: cover.album.primaryColor }}
          />
          <div className="vinyl-hole" />
        </div>
        <div className="cover-meta">
          <div className="cover-title">{cover.album.title}</div>
          <div className="cover-artist">{cover.album.artist}</div>
        </div>
      </div>

      {selected && (
        <>
          <div className="cover-handle cover-handle-rotate" onPointerDown={(e) => onPointerDown(e, 'rotate')}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
          </div>
          <button className="cover-handle cover-handle-delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="cover-controls">
            <span className="scale-label">缩放</span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={cover.scale}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => onScale(parseFloat(e.target.value))}
            />
            <span className="scale-val">{cover.scale.toFixed(2)}x</span>
          </div>
        </>
      )}
    </div>
  );
};

const CanvasBoard: React.FC = () => {
  const covers = useCanvasStore(s => s.covers);
  const backgroundColor = useCanvasStore(s => s.backgroundColor);
  const selectedId = useCanvasStore(s => s.selectedId);
  const addCover = useCanvasStore(s => s.addCover);
  const removeCover = useCanvasStore(s => s.removeCover);
  const updateCover = useCanvasStore(s => s.updateCover);
  const setSelectedId = useCanvasStore(s => s.setSelectedId);
  const bringToFront = useCanvasStore(s => s.bringToFront);
  const removeTracksByCover = useTrackStore(s => s.removeTracksByCover);

  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [, force] = useState(0);

  const rerender = useCallback(() => force(n => n + 1), []);

  const applySnapToMove = useCallback(
    (target: CanvasCover, newX: number, newY: number): { x: number; y: number } => {
      const s = getCoverSize(target);
      const otherTargets = covers.filter(c => c.id !== target.id);

      const snapTargetsX: number[] = [SNAP_GAP, CANVAS_WIDTH_MM - s - SNAP_GAP];
      const snapTargetsY: number[] = [SNAP_GAP, CANVAS_HEIGHT_MM - s - SNAP_GAP];

      otherTargets.forEach(c => {
        const os = getCoverSize(c);
        snapTargetsX.push(c.x - s - SNAP_GAP);
        snapTargetsX.push(c.x + os + SNAP_GAP);
        snapTargetsX.push(c.x + (os - s) / 2);
        snapTargetsY.push(c.y - s - SNAP_GAP);
        snapTargetsY.push(c.y + os + SNAP_GAP);
        snapTargetsY.push(c.y + (os - s) / 2);
      });

      const { snapped: sx } = snap(newX, snapTargetsX);
      const { snapped: sy } = snap(newY, snapTargetsY);
      return { x: sx, y: sy };
    },
    [covers]
  );

  const tryUpdatePosition = useCallback(
    (id: string, x: number, y: number): boolean => {
      const current = covers.find(c => c.id === id);
      if (!current) return false;
      const candidate: CanvasCover = { ...current, x, y };
      const others = covers.filter(c => c.id !== id);
      if (others.some(o => overlaps(candidate, o))) return false;

      const size = getCoverSize(candidate);
      const bounds = getAABB(candidate);
      if (bounds.left < 0 || bounds.top < 0 ||
          bounds.right > CANVAS_WIDTH_MM || bounds.bottom > CANVAS_HEIGHT_MM) {
        return false;
      }
      updateCover(id, { x, y });
      return true;
    },
    [covers, updateCover]
  );

  const onCoverPointerDown = useCallback(
    (e: React.PointerEvent, id: string, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      bringToFront(id);
      setSelectedId(id);
      const cover = covers.find(c => c.id === id);
      if (!cover || !boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();
      const size = getCoverSize(cover);

      dragRef.current = {
        id,
        mode,
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        origX: cover.x,
        origY: cover.y,
        origRotation: cover.rotation,
        centerX: cover.x + size / 2,
        centerY: cover.y + size / 2,
      };
    },
    [covers, bringToFront, setSelectedId]
  );

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cover = covers.find(c => c.id === d.id);
      if (!cover) return;

      if (d.mode === 'move') {
        let nx = d.origX + (px - d.startX);
        let ny = d.origY + (py - d.startY);
        const snapped = applySnapToMove(cover, nx, ny);
        if (!tryUpdatePosition(d.id, snapped.x, snapped.y)) {
          tryUpdatePosition(d.id, Math.round(nx), Math.round(ny));
        }
      } else if (d.mode === 'rotate') {
        const angleStart = Math.atan2(d.startY - d.centerY, d.startX - d.centerX);
        const angleNow = Math.atan2(py - d.centerY, px - d.centerX);
        let deg = d.origRotation + ((angleNow - angleStart) * 180) / Math.PI;
        deg = Math.round(deg / 15) * 15;
        updateCover(d.id, { rotation: deg });
      }
      rerender();
    };

    const handleUp = () => {
      dragRef.current = null;
      rerender();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [covers, applySnapToMove, tryUpdatePosition, updateCover, rerender]);

  const handleDeleteCover = (id: string) => {
    removeCover(id);
    removeTracksByCover(id);
  };

  const handleBoardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const albumId = e.dataTransfer.getData('albumId');
    if (!albumId) return;
    const data = e.dataTransfer.getData('albumData');
    try {
      const album = JSON.parse(data);
      if (album) addCover(album);
    } catch {}
  };

  const handleBoardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div className="canvas-board-wrap">
      <div
        ref={boardRef}
        className="canvas-board"
        style={{
          backgroundColor,
          width: CANVAS_WIDTH_MM,
          height: CANVAS_HEIGHT_MM,
        }}
        onClick={() => setSelectedId(null)}
        onDrop={handleBoardDrop}
        onDragOver={handleBoardDragOver}
      >
        {covers.map(cover => (
          <CoverCard
            key={cover.id}
            cover={cover}
            selected={cover.id === selectedId}
            onPointerDown={(e, mode) => onCoverPointerDown(e, cover.id, mode)}
            onScale={(scale) => updateCover(cover.id, { scale })}
            onDelete={() => handleDeleteCover(cover.id)}
          />
        ))}
        {covers.length === 0 && (
          <div className="canvas-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="empty-title">拖入唱片封面开始拼贴</div>
            <div className="empty-hint">从左侧唱片库拖拽或点击添加，最多 12 张</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasBoard;
