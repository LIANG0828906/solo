import { useEffect, useRef, useState, useCallback } from 'react';
import type { Layer, Transform } from './DataModel';

interface SVGEditorProps {
  layers: Layer[];
  selectedIds: string[];
  onSelect: (id: string, additive: boolean) => void;
  onClearSelection: () => void;
  onTransformUpdate: (id: string, transform: Partial<Transform>) => void;
  onTransformCommit: (id: string) => void;
  previewPath?: string;
  maintainAspectRatio?: boolean;
}

type HandleType =
  | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  | 'rotate' | 'move';

interface DragState {
  type: HandleType;
  startX: number;
  startY: number;
  layerIds: string[];
  originalTransforms: Map<string, Transform>;
  originalBounds: Map<string, Layer['path']['bounds']>;
  currentAngle?: number;
}

const HANDLE_SIZE = 10;
const ROTATE_OFFSET = 30;
const MIN_SIZE = 10;

export function SVGEditor({
  layers,
  selectedIds,
  onSelect,
  onClearSelection,
  onTransformUpdate,
  onTransformCommit,
  previewPath,
  maintainAspectRatio = false
}: SVGEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<HandleType | null>(null);
  const [currentRotation, setCurrentRotation] = useState<number | null>(null);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const updateSize = () => {
      const rect = svg.getBoundingClientRect();
      setSvgSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    resizeObserverRef.current = new ResizeObserver(updateSize);
    resizeObserverRef.current.observe(svg);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const getTransformedCenter = useCallback((layer: Layer) => {
    const { bounds } = layer.path;
    const { tx, ty } = layer.transform;
    return { x: bounds.centerX + tx, y: bounds.centerY + ty };
  }, []);

  const applyScale = useCallback((
    layer: Layer,
    handleType: HandleType,
    dx: number,
    dy: number,
    originalTransform: Transform,
    origBounds: Layer['path']['bounds']
  ): Partial<Transform> => {
    let scaleX = originalTransform.scaleX;
    let scaleY = originalTransform.scaleY;
    let tx = originalTransform.tx;
    let ty = originalTransform.ty;

    const origWidth = origBounds.width * originalTransform.scaleX;
    const origHeight = origBounds.height * originalTransform.scaleY;
    const centerX = origBounds.centerX + originalTransform.tx;
    const centerY = origBounds.centerY + originalTransform.ty;

    const rad = (originalTransform.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const localDx = dx * cos + dy * sin;
    const localDy = -dx * sin + dy * cos;

    let signX = 1, signY = 1;
    let factorX = 0, factorY = 0;

    switch (handleType) {
      case 'nw': signX = -1; signY = -1; factorX = factorY = 0.5; break;
      case 'n': signY = -1; factorY = 1; break;
      case 'ne': signX = 1; signY = -1; factorX = factorY = 0.5; break;
      case 'e': signX = 1; factorX = 1; break;
      case 'se': signX = 1; signY = 1; factorX = factorY = 0.5; break;
      case 's': signY = 1; factorY = 1; break;
      case 'sw': signX = -1; signY = 1; factorX = factorY = 0.5; break;
      case 'w': signX = -1; factorX = 1; break;
    }

    if (origWidth > 0 && (factorX > 0 || signX !== 1 || handleType === 'e' || handleType === 'w')) {
      const changeX = (signX * localDx * 2 * factorX) / origWidth;
      scaleX = Math.max(MIN_SIZE / origBounds.width, originalTransform.scaleX + changeX);
    }
    if (origHeight > 0 && (factorY > 0 || signY !== 1 || handleType === 'n' || handleType === 's')) {
      const changeY = (signY * localDy * 2 * factorY) / origHeight;
      scaleY = Math.max(MIN_SIZE / origBounds.height, originalTransform.scaleY + changeY);
    }

    if (maintainAspectRatio && handleType !== 'n' && handleType !== 's' && handleType !== 'e' && handleType !== 'w') {
      const ratio = Math.max(scaleX / originalTransform.scaleX, scaleY / originalTransform.scaleY);
      scaleX = originalTransform.scaleX * ratio;
      scaleY = originalTransform.scaleY * ratio;
    }

    const dScaleX = scaleX - originalTransform.scaleX;
    const dScaleY = scaleY - originalTransform.scaleY;
    const moveLocalX = -signX * (origBounds.width / 2) * dScaleX * factorX * 2;
    const moveLocalY = -signY * (origBounds.height / 2) * dScaleY * factorY * 2;

    const worldMoveX = moveLocalX * cos - moveLocalY * sin;
    const worldMoveY = moveLocalX * sin + moveLocalY * cos;

    tx = originalTransform.tx + worldMoveX;
    ty = originalTransform.ty + worldMoveY;

    if (handleType === 'nw' || handleType === 'ne' || handleType === 'sw' || handleType === 'se') {
      tx = centerX - (centerX - (origBounds.centerX + originalTransform.tx)) - worldMoveX * 0;
      ty = centerY - (centerY - (origBounds.centerY + originalTransform.ty)) - worldMoveY * 0;
    }

    void centerX; void centerY;

    return { scaleX, scaleY, tx, ty };
  }, [maintainAspectRatio]);

  const startDrag = useCallback((
    e: React.PointerEvent,
    type: HandleType,
    layerIds: string[]
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const pt = getSvgPoint(e.clientX, e.clientY);
    const originalTransforms = new Map<string, Transform>();
    const originalBounds = new Map<string, Layer['path']['bounds']>();

    layerIds.forEach(id => {
      const layer = layers.find(l => l.id === id);
      if (layer) {
        originalTransforms.set(id, { ...layer.transform });
        originalBounds.set(id, { ...layer.path.bounds });
      }
    });

    dragStateRef.current = {
      type,
      startX: pt.x,
      startY: pt.y,
      layerIds,
      originalTransforms,
      originalBounds,
    };

    setCurrentRotation(null);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [getSvgPoint, layers]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const state = dragStateRef.current;
    if (!state) return;
    e.preventDefault();

    const pt = getSvgPoint(e.clientX, e.clientY);
    const dx = pt.x - state.startX;
    const dy = pt.y - state.startY;

    state.layerIds.forEach(id => {
      const layer = layers.find(l => l.id === id);
      if (!layer || layer.locked) return;

      const originalTransform = state.originalTransforms.get(id)!;
      const origBounds = state.originalBounds.get(id)!;

      let newTransform: Partial<Transform> = {};

      switch (state.type) {
        case 'move': {
          newTransform = {
            tx: originalTransform.tx + dx,
            ty: originalTransform.ty + dy
          };
          break;
        }
        case 'rotate': {
          const center = {
            x: origBounds.centerX + originalTransform.tx,
            y: origBounds.centerY + originalTransform.ty
          };
          const startAngle = Math.atan2(state.startY - center.y, state.startX - center.x);
          const currentAngle = Math.atan2(pt.y - center.y, pt.x - center.x);
          const angleDeg = ((currentAngle - startAngle) * 180) / Math.PI;
          newTransform = {
            rotation: originalTransform.rotation + angleDeg
          };
          const finalRotation = originalTransform.rotation + angleDeg;
          const normalizedRotation = ((finalRotation % 360) + 360) % 360;
          setCurrentRotation(normalizedRotation);
          break;
        }
        default: {
          newTransform = applyScale(layer, state.type, dx, dy, originalTransform, origBounds);
          break;
        }
      }

      onTransformUpdate(id, newTransform);
    });
  }, [getSvgPoint, layers, onTransformUpdate, applyScale]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const state = dragStateRef.current;
    if (!state) return;

    state.layerIds.forEach(id => {
      onTransformCommit(id);
    });

    dragStateRef.current = null;
    setCurrentRotation(null);
    setHoveredHandle(null);
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
  }, [onTransformCommit]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const selectedLayers = layers.filter(l => selectedIds.includes(l.id) && l.visible);

  const getSelectionBoundingBox = () => {
    if (selectedLayers.length === 0) return null;

    let overallMinX = Infinity, overallMinY = Infinity;
    let overallMaxX = -Infinity, overallMaxY = -Infinity;

    selectedLayers.forEach(layer => {
      const { bounds } = layer.path;
      const { tx, ty, scaleX, scaleY, rotation } = layer.transform;
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const scaledW = bounds.width * scaleX;
      const scaledH = bounds.height * scaleY;
      const rotatedW = scaledW * cos + scaledH * sin;
      const rotatedH = scaledW * sin + scaledH * cos;
      const cx = bounds.centerX + tx;
      const cy = bounds.centerY + ty;

      overallMinX = Math.min(overallMinX, cx - rotatedW / 2);
      overallMinY = Math.min(overallMinY, cy - rotatedH / 2);
      overallMaxX = Math.max(overallMaxX, cx + rotatedW / 2);
      overallMaxY = Math.max(overallMaxY, cy + rotatedH / 2);
    });

    return {
      minX: overallMinX,
      minY: overallMinY,
      maxX: overallMaxX,
      maxY: overallMaxY,
      width: overallMaxX - overallMinX,
      height: overallMaxY - overallMinY,
      centerX: (overallMinX + overallMaxX) / 2,
      centerY: (overallMinY + overallMaxY) / 2
    };
  };

  const bbox = getSelectionBoundingBox();

  const renderHandle = (type: HandleType, x: number, y: number, cursor: string) => {
    const isHovered = hoveredHandle === type;
    return (
      <rect
        key={type}
        x={x - HANDLE_SIZE / 2}
        y={y - HANDLE_SIZE / 2}
        width={HANDLE_SIZE}
        height={HANDLE_SIZE}
        rx={2}
        ry={2}
        fill={isHovered ? '#ffd700' : '#ffffff'}
        stroke={isHovered ? '#ffaa00' : '#888'}
        strokeWidth={1}
        style={{ cursor, pointerEvents: 'auto' }}
        onPointerEnter={() => setHoveredHandle(type)}
        onPointerLeave={() => setHoveredHandle(null)}
        onPointerDown={(e) => startDrag(e, type, selectedIds)}
      />
    );
  };

  const cursorForHandle = (type: HandleType): string => {
    const angle = bbox ? selectedLayers[0]?.transform.rotation || 0 : 0;
    switch (type) {
      case 'nw': case 'se': return `nwse-resize`;
      case 'ne': case 'sw': return `nesw-resize`;
      case 'n': case 's': return `ns-resize`;
      case 'e': case 'w': return `ew-resize`;
      case 'rotate': return 'grab';
      case 'move': return 'move';
      default: return 'default';
    }
    void angle;
  };

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
      onClick={(e) => {
        if (e.target === svgRef.current) {
          onClearSelection();
        }
      }}
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a2a3e" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" style={{ pointerEvents: 'none' }} />

      {layers
        .filter(l => l.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(layer => {
          const isSelected = selectedIds.includes(layer.id);
          const { bounds, pathString, color, strokeWidth } = layer.path;
          const { tx, ty, scaleX, scaleY, rotation } = layer.transform;

          return (
            <g
              key={layer.id}
              style={{
                pointerEvents: layer.locked ? 'none' : 'auto',
                cursor: layer.locked ? 'not-allowed' : (isSelected ? 'move' : 'pointer')
              }}
              onPointerDown={(e) => {
                if (layer.locked) return;
                e.stopPropagation();
                const additive = e.shiftKey || e.ctrlKey || e.metaKey;
                onSelect(layer.id, additive);
                if (isSelected) {
                  startDrag(e, 'move', [layer.id]);
                }
              }}
            >
              <g
                transform={`translate(${tx}, ${ty}) rotate(${rotation}, ${bounds.centerX}, ${bounds.centerY}) scale(${scaleX}, ${scaleY}) translate(${-bounds.centerX + bounds.centerX * 0}, ${-bounds.centerY + bounds.centerY * 0})`}
                style={{ transformOrigin: `${bounds.centerX}px ${bounds.centerY}px` }}
              >
                <path
                  d={pathString}
                  fill="none"
                  stroke={isSelected ? '#ff8c00' : color}
                  strokeWidth={isSelected ? Math.max(3, strokeWidth * 1.5) : strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
              <g transform={`translate(${tx}, ${ty}) rotate(${rotation}, ${bounds.centerX}, ${bounds.centerY}) scale(${scaleX}, ${scaleY})`} style={{ transformBox: 'fill-box' }}>
              </g>
            </g>
          );
        })}

      {previewPath && (
        <path
          d={previewPath}
          fill="none"
          stroke="#4a9eff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 4"
          opacity={0.6}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {bbox && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={bbox.minX - 2}
            y={bbox.minY - 2}
            width={bbox.width + 4}
            height={bbox.height + 4}
            fill="none"
            stroke="#ff8c00"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            style={{ pointerEvents: 'auto', cursor: cursorForHandle('move') }}
            onPointerDown={(e) => {
              if (selectedIds.length > 0) {
                startDrag(e, 'move', selectedIds);
              }
            }}
          />

          {renderHandle('nw', bbox.minX, bbox.minY, cursorForHandle('nw'))}
          {renderHandle('n', bbox.centerX, bbox.minY, cursorForHandle('n'))}
          {renderHandle('ne', bbox.maxX, bbox.minY, cursorForHandle('ne'))}
          {renderHandle('e', bbox.maxX, bbox.centerY, cursorForHandle('e'))}
          {renderHandle('se', bbox.maxX, bbox.maxY, cursorForHandle('se'))}
          {renderHandle('s', bbox.centerX, bbox.maxY, cursorForHandle('s'))}
          {renderHandle('sw', bbox.minX, bbox.maxY, cursorForHandle('sw'))}
          {renderHandle('w', bbox.minX, bbox.centerY, cursorForHandle('w'))}

          <line
            x1={bbox.centerX}
            y1={bbox.minY - ROTATE_OFFSET}
            x2={bbox.centerX}
            y2={bbox.minY}
            stroke="#ff8c00"
            strokeWidth={1}
            strokeDasharray="2 2"
            style={{ pointerEvents: 'none' }}
          />

          {(() => {
            const handleX = bbox.centerX;
            const handleY = bbox.minY - ROTATE_OFFSET;
            const isHovered = hoveredHandle === 'rotate';
            return (
              <g
                style={{ pointerEvents: 'auto', cursor: 'grab' }}
                onPointerEnter={() => setHoveredHandle('rotate')}
                onPointerLeave={() => setHoveredHandle(null)}
                onPointerDown={(e) => startDrag(e, 'rotate', selectedIds)}
              >
                <circle
                  cx={handleX}
                  cy={handleY}
                  r={HANDLE_SIZE / 2 + 2}
                  fill={isHovered ? '#ffd700' : '#ffffff'}
                  stroke={isHovered ? '#ffaa00' : '#888'}
                  strokeWidth={1}
                />
                <path
                  d={`M ${handleX - 4} ${handleY} a 4 4 0 1 1 4 4`}
                  fill="none"
                  stroke="#666"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                />
                <polygon
                  points={`${handleX},${handleY - 6} ${handleX - 2},${handleY - 2} ${handleX + 2},${handleY - 2}`}
                  fill="#666"
                />
              </g>
            );
          })()}

          {currentRotation !== null && (
            <g>
              <rect
                x={bbox.centerX + 12}
                y={bbox.minY - ROTATE_OFFSET - 14}
                width={48}
                height={20}
                rx={3}
                fill="rgba(0,0,0,0.8)"
              />
              <text
                x={bbox.centerX + 36}
                y={bbox.minY - ROTATE_OFFSET}
                fill="#fff"
                fontSize={12}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {currentRotation.toFixed(1)}°
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
