import React, { useRef, useState, useCallback } from 'react';
import type { BrickData, BrickSize, BrickColor, Viewport } from '@/types';
import {
  GRID_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  getColorMeta,
  getSizeMeta,
  getRotatedDimensions,
} from '@/constants';
import Brick from '@/components/Brick';

export interface DragPayload {
  type: BrickSize;
  color: BrickColor;
}

interface BuildPlateProps {
  bricks: BrickData[];
  selectedId: string | null;
  viewport: Viewport;
  onPlaceBrick: (type: BrickSize, color: BrickColor, x: number, y: number) => void;
  onSelectBrick: (id: string | null) => void;
  onRotateBrick: (id: string) => void;
  onDeleteBrick: (id: string) => void;
  onViewportChange: (vp: Viewport) => void;
}

interface PreviewState {
  x: number;
  y: number;
  type: BrickSize;
  color: BrickColor;
  valid: boolean;
}

interface PanStart {
  mx: number;
  my: number;
  ox: number;
  oy: number;
}

const PLATE_GRID_COUNT = 50;
const PLATE_SIZE_PX = PLATE_GRID_COUNT * GRID_SIZE;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const BuildPlate: React.FC<BuildPlateProps> = ({
  bricks,
  selectedId,
  viewport,
  onPlaceBrick,
  onSelectBrick,
  onRotateBrick: _onRotateBrick,
  onDeleteBrick: _onDeleteBrick,
  onViewportChange,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<PanStart | null>(null);

  const checkOverlap = useCallback(
    (type: BrickSize, x: number, y: number, rotation: 0 | 90 | 180 | 270 = 0): boolean => {
      const target = getRotatedDimensions(type, rotation);
      const targetLeft = x;
      const targetTop = y;
      const targetRight = x + target.w;
      const targetBottom = y + target.h;

      for (let i = 0; i < bricks.length; i++) {
        const brick = bricks[i];
        const brickDim = getRotatedDimensions(brick.type, brick.rotation);
        const brickLeft = brick.x;
        const brickTop = brick.y;
        const brickRight = brick.x + brickDim.w;
        const brickBottom = brick.y + brickDim.h;

        if (
          targetLeft < brickRight &&
          targetRight > brickLeft &&
          targetTop < brickBottom &&
          targetBottom > brickTop
        ) {
          return true;
        }
      }
      return false;
    },
    [bricks]
  );

  const computePreview = useCallback(
    (clientX: number, clientY: number, type: BrickSize, color: BrickColor): PreviewState | null => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return null;

      const rect = wrapper.getBoundingClientRect();
      const localX = (clientX - rect.left) / viewport.scale - viewport.offsetX;
      const localY = (clientY - rect.top) / viewport.scale - viewport.offsetY;

      const x = Math.round(localX / GRID_SIZE);
      const y = Math.round(localY / GRID_SIZE);

      const dim = getRotatedDimensions(type, 0);
      const inBounds = x >= 0 && y >= 0 && x + dim.w <= PLATE_GRID_COUNT && y + dim.h <= PLATE_GRID_COUNT;
      const overlaps = checkOverlap(type, x, y, 0);
      const valid = inBounds && !overlaps;

      return { x, y, type, color, valid };
    },
    [viewport, checkOverlap]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const payloadStr = e.dataTransfer.getData('application/json');
      if (!payloadStr) return;

      try {
        const payload: DragPayload = JSON.parse(payloadStr);
        const next = computePreview(e.clientX, e.clientY, payload.type, payload.color);
        setPreview(next);
      } catch {
        // invalid payload
      }
    },
    [computePreview]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const payloadStr = e.dataTransfer.getData('application/json');
      if (!payloadStr) {
        setPreview(null);
        return;
      }

      try {
        const payload: DragPayload = JSON.parse(payloadStr);
        const next = computePreview(e.clientX, e.clientY, payload.type, payload.color);
        if (next && next.valid) {
          onPlaceBrick(next.type, next.color, next.x, next.y);
        }
      } catch {
        // invalid payload
      }
      setPreview(null);
    },
    [computePreview, onPlaceBrick]
  );

  const handleDragLeave = useCallback(() => {
    setPreview(null);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const isWrapper = target === wrapper || target.dataset.plateBg === 'true';
      if (!isWrapper) return;

      if (e.button !== 0) return;

      setIsPanning(true);
      setPanStart({
        mx: e.clientX,
        my: e.clientY,
        ox: viewport.offsetX,
        oy: viewport.offsetY,
      });
      onSelectBrick(null);
    },
    [viewport, onSelectBrick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning || !panStart) return;
      const { mx, my, ox, oy } = panStart;
      onViewportChange({
        ...viewport,
        offsetX: ox + (e.clientX - mx),
        offsetY: oy + (e.clientY - my),
      });
    },
    [isPanning, panStart, viewport, onViewportChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const delta = -e.deltaY * 0.001;
      const newScale = clamp(viewport.scale + delta, MIN_SCALE, MAX_SCALE);
      const ratio = newScale / viewport.scale;

      const rect = wrapper.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const newOffsetX = mx - (mx - viewport.offsetX) * ratio;
      const newOffsetY = my - (my - viewport.offsetY) * ratio;

      onViewportChange({
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    },
    [viewport, onViewportChange]
  );

  const handleBrickClick = useCallback(
    (id: string) => {
      onSelectBrick(id);
    },
    [onSelectBrick]
  );

  const renderPreview = () => {
    if (!preview) return null;

    const colorMeta = getColorMeta(preview.color);
    const dim = getRotatedDimensions(preview.type, 0);
    const widthPx = dim.w * GRID_SIZE;
    const heightPx = dim.h * GRID_SIZE;
    const sizeMeta = getSizeMeta(preview.type);
    const studsX = sizeMeta.studsX;
    const studsY = sizeMeta.studsY;

    const studs: React.ReactNode[] = [];
    const studSize = 10 * viewport.scale;
    const studSpacingX = widthPx / (studsX + 1);
    const studSpacingY = heightPx / (studsY + 1);

    for (let row = 0; row < studsY; row++) {
      for (let col = 0; col < studsX; col++) {
        const studX = studSpacingX * (col + 1) - studSize / 2;
        const studY = studSpacingY * (row + 1) - studSize / 2 - 2;
        studs.push(
          <div
            key={`preview-stud-${row}-${col}`}
            style={{
              position: 'absolute',
              left: `${studX}px`,
              top: `${studY}px`,
              width: `${studSize}px`,
              height: `${studSize}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${colorMeta.studHighlight}, ${colorMeta.primary} 60%, ${colorMeta.dark} 100%)`,
              boxShadow: `inset 0 -1px 2px ${colorMeta.border}, 0 1px 1px rgba(0,0,0,0.15)`,
              pointerEvents: 'none',
            }}
          />
        );
      }
    }

    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          transform: `translate(${preview.x * GRID_SIZE}px, ${preview.y * GRID_SIZE}px)`,
          transformOrigin: '0 0',
          opacity: 0.6,
          borderRadius: '4px',
          background: `linear-gradient(180deg, ${colorMeta.light} 0%, ${colorMeta.primary} 40%, ${colorMeta.dark} 100%)`,
          border: `2px solid ${colorMeta.border}`,
          boxShadow: preview.valid
            ? `0 0 0 3px #22c55e, 0 0 16px 6px rgba(34, 197, 94, 0.5), inset -2px -4px 0 rgba(0,0,0,0.15), inset 2px 2px 0 rgba(255,255,255,0.2)`
            : `0 0 0 3px #ef4444, 0 0 16px 6px rgba(239, 68, 68, 0.5), inset -2px -4px 0 rgba(0,0,0,0.15), inset 2px 2px 0 rgba(255,255,255,0.2)`,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '35%',
            background: `linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)`,
            borderRadius: '2px 2px 0 0',
            pointerEvents: 'none',
          }}
        />
        {studs}
      </div>
    );
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--app-bg)',
        cursor: isPanning ? 'grabbing' : 'grab',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          willChange: 'transform',
          transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <div
          data-plate-bg="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${PLATE_SIZE_PX}px`,
            height: `${PLATE_SIZE_PX}px`,
            backgroundColor: '#ffffff',
            backgroundImage: `linear-gradient(to right, #e0e0e0 1px, transparent 1px), linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)`,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            boxShadow: '0 0 0 1px #d0d0d0',
          }}
        />
        {bricks.map((brick) => (
          <Brick
            key={brick.id}
            brick={brick}
            selected={selectedId === brick.id}
            onClick={() => handleBrickClick(brick.id)}
            scale={viewport.scale}
          />
        ))}
        {renderPreview()}
      </div>
    </div>
  );
};

export default BuildPlate;
