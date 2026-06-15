import React, { useRef, useEffect, useCallback, memo, useState } from 'react';
import type { Booth, PlacedArtwork, DragState, ViewMode } from './types';

interface RendererProps {
  booths: Booth[];
  placedArtworks: PlacedArtwork[];
  selectedBoothId: string | null;
  selectedArtworkId: string | null;
  viewMode: ViewMode;
  scale: number;
  offset: { x: number; y: number };
  dragState: DragState;
  onBoothClick: (booth: Booth) => void;
  onArtworkClick: (artwork: PlacedArtwork) => void;
  onScaleChange: (scale: number) => void;
  onOffsetChange: (offset: { x: number; y: number }) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onCanvasClick: () => void;
}

const Renderer: React.FC<RendererProps> = memo(({
  booths,
  placedArtworks,
  selectedBoothId,
  selectedArtworkId,
  viewMode,
  scale,
  offset,
  dragState,
  onBoothClick,
  onArtworkClick,
  onScaleChange,
  onOffsetChange,
  onMouseMove,
  onMouseUp,
  onCanvasClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const lastOffsetRef = useRef({ x: 0, y: 0 });

  const galleryWidth = booths.length > 0
    ? Math.max(...booths.map(b => b.x + b.width)) + 40
    : 600;
  const galleryHeight = booths.length > 0
    ? Math.max(...booths.map(b => b.y + b.height)) + 40
    : 600;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, scale * delta));
    onScaleChange(newScale);
  }, [scale, onScaleChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      lastOffsetRef.current = { ...offset };
    }
  }, [offset]);

  const handleMouseMoveInternal = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      onOffsetChange({
        x: lastOffsetRef.current.x + dx,
        y: lastOffsetRef.current.y + dy,
      });
    } else {
      onMouseMove(e);
    }
  }, [isPanning, onOffsetChange, onMouseMove]);

  const handleMouseUpInternal = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    } else {
      onMouseUp(e);
    }
  }, [isPanning, onMouseUp]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const getViewTransform = () => {
    if (viewMode === '3d') {
      return `translate(${offset.x}px, ${offset.y}px) scale(${scale}) perspective(1000px) rotateX(60deg) rotateZ(-45deg)`;
    }
    return `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
  };

  const getArtworkTransform = (artwork: PlacedArtwork) => {
    const centerX = artwork.x + artwork.width / 2;
    const centerY = artwork.y + artwork.height / 2;
    return `translate(${centerX}, ${centerY}) rotate(${artwork.rotation}) translate(${-centerX}, ${-centerY})`;
  };

  return (
    <div className="flex-1 relative bg-gallery-bg/50 rounded-lg overflow-hidden border border-gallery-accent/10">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        style={{
          cursor: isPanning ? 'grabbing' : dragState.isDragging ? 'copy' : 'crosshair',
          background: `
            radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.03) 0%, transparent 50%),
            linear-gradient(#0f172a, #0f172a)
          `,
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveInternal}
        onMouseUp={handleMouseUpInternal}
        onMouseLeave={handleMouseUpInternal}
        onClick={onCanvasClick}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1"/>
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadow3d">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3"/>
          </filter>
        </defs>

        <g
          style={{
            transform: getViewTransform(),
            transformOrigin: 'center center',
            transition: isPanning || dragState.isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transformStyle: viewMode === '3d' ? 'preserve-3d' : 'flat',
          }}
        >
          <rect
            x="-20"
            y="-20"
            width={galleryWidth}
            height={galleryHeight}
            fill="url(#grid)"
            className="pointer-events-none"
          />

          <rect
            x="-20"
            y="-20"
            width={galleryWidth}
            height={galleryHeight}
            fill="none"
            stroke="rgba(6, 182, 212, 0.3)"
            strokeWidth="2"
            rx="8"
            className="pointer-events-none"
          />

          {booths.map(booth => {
            const isSelected = selectedBoothId === booth.id;
            const isTarget = dragState.targetBoothId === booth.id;
            const isOccupied = placedArtworks.some(a => a.boothId === booth.id);

            return (
              <g key={booth.id}>
                <rect
                  x={booth.x}
                  y={booth.y}
                  width={booth.width}
                  height={booth.height}
                  fill={isTarget ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.05)'}
                  stroke={isSelected ? '#06b6d4' : isTarget ? '#06b6d4' : 'rgba(6, 182, 212, 0.3)'}
                  strokeWidth={isSelected || isTarget ? 2 : 1}
                  strokeDasharray={isOccupied && !isSelected ? '4,4' : undefined}
                  rx="4"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-gallery',
                    filter: isSelected || isTarget ? 'url(#glow)' : undefined,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBoothClick(booth);
                  }}
                />
                <text
                  x={booth.x + booth.width / 2}
                  y={booth.y + 16}
                  textAnchor="middle"
                  fill="rgba(6, 182, 212, 0.5)"
                  fontSize="10"
                  className="pointer-events-none select-none"
                >
                  {booth.row + 1}-{booth.col + 1}
                </text>
              </g>
            );
          })}

          {placedArtworks.map(artwork => {
            const isSelected = selectedArtworkId === artwork.id;
            
            return (
              <g
                key={artwork.id}
                style={{
                  transform: getArtworkTransform(artwork),
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: viewMode === '3d' ? 'url(#shadow3d)' : isSelected ? 'url(#glow)' : undefined,
                }}
              >
                <rect
                  x={artwork.x}
                  y={artwork.y}
                  width={artwork.width}
                  height={artwork.height}
                  fill={artwork.color}
                  stroke={isSelected ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)'}
                  strokeWidth={isSelected ? 3 : 1}
                  rx="4"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-gallery',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onArtworkClick(artwork);
                  }}
                />
                <text
                  x={artwork.x + artwork.width / 2}
                  y={artwork.y + artwork.height / 2 + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {artwork.title.charAt(0)}
                </text>
              </g>
            );
          })}
        </g>

        {dragState.isDragging && dragState.artwork && (
          <g
            style={{
              pointerEvents: 'none',
              transform: `translate(${dragState.mouseX - dragState.artwork.width / 2}, ${dragState.mouseY - dragState.artwork.height / 2})`,
            }}
          >
            <rect
              width={dragState.artwork.width}
              height={dragState.artwork.height}
              fill={dragState.artwork.color}
              opacity="0.7"
              stroke={dragState.targetBoothId ? '#06b6d4' : '#ef4444'}
              strokeWidth="2"
              strokeDasharray={dragState.targetBoothId ? undefined : '4,4'}
              rx="4"
              style={{
                transition: 'stroke 0.15s ease-gallery',
              }}
            />
            <text
              x={dragState.artwork.width / 2}
              y={dragState.artwork.height / 2 + 4}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              {dragState.artwork.title.charAt(0)}
            </text>
          </g>
        )}
      </svg>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gallery-bg/90 backdrop-blur-sm rounded-lg p-2 border border-gallery-accent/20">
        <button
          onClick={() => onScaleChange(Math.max(0.3, scale * 0.8))}
          className="w-8 h-8 flex items-center justify-center text-gallery-accent hover:text-white hover:bg-gallery-accent/20 rounded transition-all duration-200 hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="text-gallery-accent text-sm font-medium w-16 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => onScaleChange(Math.min(3, scale * 1.25))}
          className="w-8 h-8 flex items-center justify-center text-gallery-accent hover:text-white hover:bg-gallery-accent/20 rounded transition-all duration-200 hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            onScaleChange(1);
            onOffsetChange({ x: 0, y: 0 });
          }}
          className="w-8 h-8 flex items-center justify-center text-gallery-accent hover:text-white hover:bg-gallery-accent/20 rounded transition-all duration-200 hover:scale-105 ml-1"
          title="重置视图"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="absolute top-4 right-4 text-xs text-gray-500 bg-gallery-bg/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gallery-accent/10">
        按住 Alt + 拖拽平移 | 滚轮缩放
      </div>
    </div>
  );
});

Renderer.displayName = 'Renderer';

export default Renderer;
