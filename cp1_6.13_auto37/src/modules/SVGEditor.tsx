import { useEffect, useRef, useState, useCallback } from 'react';
import type { Layer, Transform, PathBounds } from './DataModel';

interface SVGEditorProps {
  layers: Layer[];
  selectedIds: string[];
  onSelect: (id: string, additive: boolean) => void;
  onClearSelection: () => void;
  onTransformUpdate: (id: string, transform: Partial<Transform>) => void;
  onTransformCommit: (ids: string[]) => void;
  previewPath?: string;
  maintainAspectRatio?: boolean;
  onWheelScale?: (id: string, delta: number, centerX: number, centerY: number) => void;
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
  originalBounds: Map<string, PathBounds>;
  currentAngle?: number;
}

const HANDLE_SIZE = 10;
const ROTATE_OFFSET = 32;
const MIN_SCALE = 0.05;
const WHEEL_SCALE_FACTOR = 0.0015;

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

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const applyScaleToLayer = useCallback((
    layer: Layer,
    handleType: HandleType,
    startX: number, startY: number,
    currX: number, currY: number,
    originalTransform: Transform,
    origBounds: PathBounds
  ): Partial<Transform> => {
    const dx = currX - startX;
    const dy = currY - startY;

    const origScaleX = originalTransform.scaleX;
    const origScaleY = originalTransform.scaleY;
    const origTx = originalTransform.tx;
    const origTy = originalTransform.ty;
    const origRot = originalTransform.rotation;

    const origCenterX = origBounds.centerX + origTx;
    const origCenterY = origBounds.centerY + origTy;

    const rad = (origRot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const localDx = dx * cos + dy * sin;
    const localDy = -dx * sin + dy * cos;

    let scaleX = origScaleX;
    let scaleY = origScaleY;

    const origLocalW = origBounds.width * origScaleX;
    const origLocalH = origBounds.height * origScaleY;

    switch (handleType) {
      case 'nw': {
        if (origLocalW > 0) {
          const factor = (origLocalW - localDx) / origLocalW;
          scaleX = Math.max(MIN_SCALE, origScaleX * factor);
        }
        if (origLocalH > 0) {
          const factor = (origLocalH - localDy) / origLocalH;
          scaleY = Math.max(MIN_SCALE, origScaleY * factor);
        }
        break;
      }
      case 'n': {
        if (origLocalH > 0) {
          const factor = (origLocalH - localDy) / origLocalH;
          scaleY = Math.max(MIN_SCALE, origScaleY * factor);
        }
        break;
      }
      case 'ne': {
        if (origLocalW > 0) {
          const factor = (origLocalW + localDx) / origLocalW;
          scaleX = Math.max(MIN_SCALE, origScaleX * factor);
        }
        if (origLocalH > 0) {
          const factor = (origLocalH - localDy) / origLocalH;
          scaleY = Math.max(MIN_SCALE, origScaleY * factor);
        }
        break;
      }
      case 'e': {
        if (origLocalW > 0) {
          const factor = (origLocalW + localDx) / origLocalW;
          scaleX = Math.max(MIN_SCALE, origScaleX * factor);
        }
        break;
      }
      case 'se': {
        if (origLocalW > 0) {
          const factor = (origLocalW + localDx) / origLocalW;
          scaleX = Math.max(MIN_SCALE, origScaleX * factor);
        }
        if (origLocalH > 0) {
          const factor = (origLocalH + localDy) / origLocalH;
          scaleY = Math.max(MIN_SCALE, origScaleY * factor);
        }
        break;
      }
      case 's': {
        if (origLocalH > 0) {
          const factor = (origLocalH + localDy) / origLocalH;
          scaleY = Math.max(MIN_SCALE, origScaleY * factor);
        }
        break;
      }
      case 'sw': {
        if (origLocalW > 0) {
          const factor = (origLocalW - localDx) / origLocalW;
          scaleX = Math.max(MIN_SCALE, origScaleX * factor);
        }
        if (origLocalH > 0) {
          const factor = (origLocalH + localDy) / origLocalH;
          scaleY = Math.max(MIN_SCALE, origScaleY * factor);
        }
        break;
      }
      case 'w': {
        if (origLocalW > 0) {
          const factor = (origLocalW - localDx) / origLocalW;
          scaleX = Math.max(MIN_SCALE, origScaleX * factor);
        }
        break;
      }
    }

    if (maintainAspectRatio && handleType.length === 2) {
      const ratio = Math.max(scaleX / origScaleX, scaleY / origScaleY);
      scaleX = origScaleX * ratio;
      scaleY = origScaleY * ratio;
    }

    const dScaleX = scaleX / origScaleX;
    const dScaleY = scaleY / origScaleY;

    let anchorLocalX = origBounds.centerX;
    let anchorLocalY = origBounds.centerY;

    switch (handleType) {
      case 'nw': anchorLocalX = origBounds.minX; anchorLocalY = origBounds.minY; break;
      case 'n': anchorLocalY = origBounds.minY; break;
      case 'ne': anchorLocalX = origBounds.maxX; anchorLocalY = origBounds.minY; break;
      case 'e': anchorLocalX = origBounds.maxX; break;
      case 'se': anchorLocalX = origBounds.maxX; anchorLocalY = origBounds.maxY; break;
      case 's': anchorLocalY = origBounds.maxY; break;
      case 'sw': anchorLocalX = origBounds.minX; anchorLocalY = origBounds.maxY; break;
      case 'w': anchorLocalX = origBounds.minX; break;
    }

    const anchorOffsetLocalX = anchorLocalX - origBounds.centerX;
    const anchorOffsetLocalY = anchorLocalY - origBounds.centerY;

    const origAnchorWorldX = origCenterX + anchorOffsetLocalX * origScaleX * cos - anchorOffsetLocalY * origScaleY * sin;
    const origAnchorWorldY = origCenterY + anchorOffsetLocalX * origScaleX * sin + anchorOffsetLocalY * origScaleY * cos;

    const newAnchorWorldX = origCenterX + anchorOffsetLocalX * scaleX * cos - anchorOffsetLocalY * scaleY * sin;
    const newAnchorWorldY = origCenterY + anchorOffsetLocalX * scaleX * sin + anchorOffsetLocalY * scaleY * cos;

    const tx = origTx + (origAnchorWorldX - newAnchorWorldX);
    const ty = origTy + (origAnchorWorldY - newAnchorWorldY);

    return { scaleX, scaleY, tx, ty };
  }, [maintainAspectRatio]);

  const startDrag = useCallback((
    e: React.PointerEvent | PointerEvent,
    type: HandleType,
    layerIds: string[]
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const clientX = 'clientX' in e ? e.clientX : 0;
    const clientY = 'clientY' in e ? e.clientY : 0;
    const pt = getSvgPoint(clientX, clientY);
    const originalTransforms = new Map<string, Transform>();
    const originalBounds = new Map<string, PathBounds>();

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

    const target = e.target as Element;
    if (target && 'setPointerCapture' in target) {
      try { target.setPointerCapture(e.pointerId); } catch {}
    }
  }, [getSvgPoint, layers]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const state = dragStateRef.current;
    if (!state) return;
    e.preventDefault();

    const pt = getSvgPoint(e.clientX, e.clientY);

    state.layerIds.forEach(id => {
      const layer = layers.find(l => l.id === id);
      if (!layer || layer.locked) return;

      const originalTransform = state.originalTransforms.get(id)!;
      const origBounds = state.originalBounds.get(id)!;

      let newTransform: Partial<Transform> = {};

      switch (state.type) {
        case 'move': {
          newTransform = {
            tx: originalTransform.tx + (pt.x - state.startX),
            ty: originalTransform.ty + (pt.y - state.startY)
          };
          break;
        }
        case 'rotate': {
          const centerX = origBounds.centerX + originalTransform.tx;
          const centerY = origBounds.centerY + originalTransform.ty;
          const startAngle = Math.atan2(state.startY - centerY, state.startX - centerX);
          const currAngle = Math.atan2(pt.y - centerY, pt.x - centerX);
          const deltaDeg = ((currAngle - startAngle) * 180) / Math.PI;
          const finalRot = originalTransform.rotation + deltaDeg;
          newTransform = { rotation: finalRot };
          const normalized = ((finalRot % 360) + 360) % 360;
          setCurrentRotation(normalized);
          break;
        }
        default: {
          newTransform = applyScaleToLayer(
            layer, state.type,
            state.startX, state.startY,
            pt.x, pt.y,
            originalTransform, origBounds
          );
          break;
        }
      }

      onTransformUpdate(id, newTransform);
    });
  }, [getSvgPoint, layers, onTransformUpdate, applyScaleToLayer]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const state = dragStateRef.current;
    if (!state) return;

    if (state.layerIds.length > 0) {
      onTransformCommit(state.layerIds);
    }

    dragStateRef.current = null;
    setCurrentRotation(null);
    setHoveredHandle(null);

    const target = e.target as Element;
    if (target && 'releasePointerCapture' in target) {
      try { target.releasePointerCapture(e.pointerId); } catch {}
    }
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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (selectedIds.length === 0) return;
    e.preventDefault();
    e.stopPropagation();

    const pt = getSvgPoint(e.clientX, e.clientY);
    const scaleFactor = 1 + (-e.deltaY * WHEEL_SCALE_FACTOR);

    selectedIds.forEach(id => {
      const layer = layers.find(l => l.id === id);
      if (!layer || layer.locked) return;

      const { bounds, transform } = layer;
      const { tx, ty, scaleX, scaleY, rotation } = transform;
      const centerX = bounds.centerX + tx;
      const centerY = bounds.centerY + ty;

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const localMouseX = (pt.x - centerX) * cos + (pt.y - centerY) * sin;
      const localMouseY = -(pt.x - centerX) * sin + (pt.y - centerY) * cos;

      const newScaleX = Math.max(MIN_SCALE, scaleX * scaleFactor);
      const newScaleY = maintainAspectRatio ? newScaleX : Math.max(MIN_SCALE, scaleY * scaleFactor);
      const actualScaleFactorX = newScaleX / scaleX;
      const actualScaleFactorY = newScaleY / scaleY;

      const newLocalMouseX = localMouseX * actualScaleFactorX;
      const newLocalMouseY = localMouseY * actualScaleFactorY;

      const newCenterX = pt.x - (newLocalMouseX * cos - newLocalMouseY * sin);
      const newCenterY = pt.y - (newLocalMouseX * sin + newLocalMouseY * cos);

      onTransformUpdate(id, {
        scaleX: newScaleX,
        scaleY: newScaleY,
        tx: newCenterX - bounds.centerX,
        ty: newCenterY - bounds.centerY
      });
    });

    onTransformCommit(selectedIds);
  }, [selectedIds, layers, getSvgPoint, maintainAspectRatio, onTransformUpdate, onTransformCommit]);

  const selectedLayers = layers.filter(l => selectedIds.includes(l.id) && l.visible);

  const bbox = (() => {
    if (selectedLayers.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    selectedLayers.forEach(layer => {
      const { bounds } = layer.path;
      const { tx, ty, scaleX, scaleY, rotation } = layer.transform;
      const rad = (rotation * Math.PI) / 180;
      const cosVal = Math.abs(Math.cos(rad));
      const sinVal = Math.abs(Math.sin(rad));
      const w = bounds.width * scaleX;
      const h = bounds.height * scaleY;
      const rw = w * cosVal + h * sinVal;
      const rh = w * sinVal + h * cosVal;
      const cx = bounds.centerX + tx;
      const cy = bounds.centerY + ty;
      minX = Math.min(minX, cx - rw / 2);
      minY = Math.min(minY, cy - rh / 2);
      maxX = Math.max(maxX, cx + rw / 2);
      maxY = Math.max(maxY, cy + rh / 2);
    });

    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  })();

  const renderHandle = (type: HandleType, x: number, y: number) => {
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
        stroke={isHovered ? '#ff8c00' : '#666'}
        strokeWidth={1.2}
        style={{
          cursor: type === 'n' || type === 's' ? 'ns-resize'
            : type === 'e' || type === 'w' ? 'ew-resize'
            : type === 'nw' || type === 'se' ? 'nwse-resize'
            : 'nesw-resize',
          pointerEvents: 'auto'
        }}
        onPointerEnter={() => setHoveredHandle(type)}
        onPointerLeave={() => setHoveredHandle(null)}
        onPointerDown={(e) => startDrag(e, type, selectedIds)}
      />
    );
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
      onWheel={handleWheel}
      onClick={(e) => {
        if (e.target === svgRef.current) {
          onClearSelection();
        }
      }}
    >
      <defs>
        <pattern id="grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#26263a" strokeWidth="0.5" />
        </pattern>
        <pattern id="grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#grid-small)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#30304a" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-large)" style={{ pointerEvents: 'none' }} />

      <g style={{ pointerEvents: 'none' }}>
        <line x1="0" y1="0" x2="0" y2="100%" stroke="#444" strokeWidth="1" />
        <line x1="0" y1="0" x2="100%" y2="0" stroke="#444" strokeWidth="1" />
      </g>

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
                  startDrag(e as unknown as PointerEvent, 'move', [layer.id]);
                }
              }}
            >
              <g
                transform={`translate(${tx}, ${ty}) rotate(${rotation}, ${bounds.centerX}, ${bounds.centerY}) scale(${scaleX}, ${scaleY})`}
              >
                <path
                  d={pathString}
                  fill="none"
                  stroke={isSelected ? '#ff8c00' : color}
                  strokeWidth={isSelected ? Math.max(3, strokeWidth * 1.5) : strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={layer.locked ? 0.5 : 1}
                />
              </g>
            </g>
          );
        })}

      {previewPath && (
        <path
          d={previewPath}
          fill="none"
          stroke="#4a9eff"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 5"
          opacity={0.75}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {bbox && (
        <g>
          <rect
            x={bbox.minX - 3}
            y={bbox.minY - 3}
            width={bbox.width + 6}
            height={bbox.height + 6}
            fill="none"
            stroke="#ff8c00"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            style={{
              pointerEvents: 'auto',
              cursor: 'move'
            }}
            onPointerDown={(e) => {
              if (selectedIds.length > 0) {
                startDrag(e, 'move', selectedIds);
              }
            }}
          />

          {renderHandle('nw', bbox.minX, bbox.minY)}
          {renderHandle('n', bbox.centerX, bbox.minY)}
          {renderHandle('ne', bbox.maxX, bbox.minY)}
          {renderHandle('e', bbox.maxX, bbox.centerY)}
          {renderHandle('se', bbox.maxX, bbox.maxY)}
          {renderHandle('s', bbox.centerX, bbox.maxY)}
          {renderHandle('sw', bbox.minX, bbox.maxY)}
          {renderHandle('w', bbox.minX, bbox.centerY)}

          <line
            x1={bbox.centerX}
            y1={bbox.minY - 3}
            x2={bbox.centerX}
            y2={bbox.minY - ROTATE_OFFSET + HANDLE_SIZE / 2}
            stroke="#ff8c00"
            strokeWidth={1.2}
            strokeDasharray="3 2"
            style={{ pointerEvents: 'none' }}
          />

          {(() => {
            const hx = bbox.centerX;
            const hy = bbox.minY - ROTATE_OFFSET;
            const isHovered = hoveredHandle === 'rotate';
            return (
              <g
                style={{ pointerEvents: 'auto', cursor: 'grab' }}
                onPointerEnter={() => setHoveredHandle('rotate')}
                onPointerLeave={() => setHoveredHandle(null)}
                onPointerDown={(e) => startDrag(e, 'rotate', selectedIds)}
              >
                <circle
                  cx={hx}
                  cy={hy}
                  r={HANDLE_SIZE / 2 + 2}
                  fill={isHovered ? '#ffd700' : '#ffffff'}
                  stroke={isHovered ? '#ff8c00' : '#666'}
                  strokeWidth={1.2}
                />
                <path
                  d={`M ${hx - 4} ${hy} a 4 4 0 1 1 3.5 2`}
                  fill="none"
                  stroke="#555"
                  strokeWidth={1.3}
                  strokeLinecap="round"
                />
                <polygon
                  points={`${hx - 0.5},${hy - 7} ${hx - 3.5},${hy - 3} ${hx + 2.5},${hy - 3}`}
                  fill="#555"
                />
              </g>
            );
          })()}

          {currentRotation !== null && (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={bbox.centerX + 14}
                y={bbox.minY - ROTATE_OFFSET - 15}
                width={52}
                height={22}
                rx={4}
                fill="rgba(0,0,0,0.85)"
              />
              <text
                x={bbox.centerX + 40}
                y={bbox.minY - ROTATE_OFFSET}
                fill="#ffd700"
                fontSize={12}
                fontWeight={600}
                textAnchor="middle"
                fontFamily="'Consolas', 'Monaco', monospace"
                dominantBaseline="middle"
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
