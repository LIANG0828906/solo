import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from '../store';
import {
  CANVAS_CENTER,
  CANVAS_SIZE,
  clientToSvgPoint,
  clamp,
  findNearestSymmetryAngle,
  getShapePath,
  getSymmetryTransforms,
  normalizeAngle,
  svgPointToPolar
} from '../utils/transform';
import type { Layer, ShapeType } from '../store';

interface CanvasProps {
  fadeKey?: number;
}

const renderShape = (shape: ShapeType, fill: string, stroke: string, strokeWidth: number) => {
  switch (shape) {
    case 'circle':
      return <circle cx={0} cy={0} r={22} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    case 'ellipse':
      return (
        <ellipse cx={0} cy={0} rx={26} ry={14} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      );
    case 'ring':
      return (
        <circle
          cx={0}
          cy={0}
          r={24}
          fill="none"
          stroke={stroke || fill}
          strokeWidth={strokeWidth + 2}
        />
      );
    default: {
      const d = getShapePath(shape);
      return (
        <path
          d={d}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      );
    }
  }
};

interface DragState {
  layerId: string;
  isMirror: boolean;
  startSymmetryAngle: number;
}

const LayerGroup = ({
  layer,
  isSelected,
  isDragging,
  onSelect,
  onPointerDown
}: {
  layer: Layer;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (id: string) => void;
  onPointerDown: (e: React.PointerEvent<SVGGElement>, layerId: string, key: string) => void;
}) => {
  const config = useEditorStore((s) => s.canvasConfig);
  const transforms = useMemo(
    () => getSymmetryTransforms(layer, config),
    [layer, config]
  );

  return (
    <g
      className="shape-element"
      style={{ cursor: isDragging ? 'grabbing' : isSelected ? 'grab' : 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(layer.id);
      }}
    >
      {transforms.map((t) => {
        const isMirror = t.key.endsWith('-mirror');
        return (
          <g
            key={t.key}
            transform={t.transform}
            onPointerDown={(e) => onPointerDown(e, layer.id, t.key)}
          >
            {isSelected && (
              <>
                <circle
                  cx={0}
                  cy={0}
                  r={38}
                  fill="none"
                  stroke="#f9c69b"
                  strokeWidth={6}
                  opacity={0.35}
                  filter="url(#glow-filter)"
                />
                <circle
                  cx={0}
                  cy={0}
                  r={34}
                  fill="none"
                  stroke="#f9c69b"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  opacity={0.95}
                />
              </>
            )}
            {renderShape(layer.shape, layer.fillColor, layer.strokeColor, layer.strokeWidth)}
            {isSelected && isMirror === false && (
              <circle
                cx={0}
                cy={0}
                r={6}
                fill="#f9c69b"
                stroke="#fff"
                strokeWidth={1.5}
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

export const Canvas = forwardRef<SVGSVGElement, CanvasProps>(({ fadeKey }, ref) => {
  const layers = useEditorStore((s) => s.layers);
  const selectedId = useEditorStore((s) => s.selectedLayerId);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const config = useEditorStore((s) => s.canvasConfig);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const setRefs = useCallback(
    (node: SVGSVGElement | null) => {
      svgRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<SVGSVGElement | null>).current = node;
    },
    [ref]
  );

  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>, layerId: string, key: string) => {
      if (!svgRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      selectLayer(layerId);

      const isMirror = key.endsWith('-mirror');
      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;

      let startSymmetryAngle = 0;
      if (config.symmetryMode === 'rotational') {
        const match = key.match(/-(\d+)$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          startSymmetryAngle = (360 / config.symmetryCount) * idx + config.angleOffset;
        }
      } else {
        startSymmetryAngle = isMirror ? 180 : 0;
      }

      dragStateRef.current = { layerId, isMirror, startSymmetryAngle };
      setIsDragging(true);
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [selectLayer, layers, config]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragStateRef.current;
      if (!drag || !svgRef.current) return;
      e.preventDefault();

      const { x, y } = clientToSvgPoint(e.clientX, e.clientY, svgRef.current);
      const { distance, angleDeg } = svgPointToPolar(x, y);
      const newRadial = clamp(distance, 0, 200);

      let selfRotation = 0;
      if (config.symmetryMode === 'rotational') {
        const { symmetryAngle } = findNearestSymmetryAngle(angleDeg, config);
        let diff = angleDeg - symmetryAngle;
        if (drag.isMirror) diff = -diff;
        selfRotation = normalizeAngle(diff);
      } else {
        let target = angleDeg;
        if (drag.isMirror) target = normalizeAngle(180 - angleDeg);
        selfRotation = normalizeAngle(target);
      }

      updateLayer(drag.layerId, {
        radialDistance: Math.round(newRadial),
        rotation: Math.round(selfRotation)
      });
    },
    [updateLayer, config]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    setIsDragging(false);
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const onUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div className="canvas-wrapper panel">
      <div className="canvas-container">
        <svg
          ref={setRefs}
          key={fadeKey}
          className={`canvas-svg ${isDragging ? 'is-dragging' : ''}`}
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          xmlns="http://www.w3.org/2000/svg"
          onClick={() => selectLayer(null)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffaf4" />
              <stop offset="100%" stopColor="#fff1dc" />
            </radialGradient>
            <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={CANVAS_CENTER}
            cy={CANVAS_CENTER}
            r={CANVAS_SIZE / 2}
            fill="url(#bg-grad)"
          />
          {isDragging && (
            <circle
              cx={CANVAS_CENTER}
              cy={CANVAS_CENTER}
              r={CANVAS_SIZE / 2 - 2}
              fill="none"
              stroke="#f9c69b"
              strokeWidth={1}
              strokeDasharray="2 6"
              opacity={0.5}
              pointerEvents="none"
            />
          )}
          {layers.map((layer) => (
            <LayerGroup
              key={layer.id}
              layer={layer}
              isSelected={selectedId === layer.id}
              isDragging={isDragging && dragStateRef.current?.layerId === layer.id}
              onSelect={selectLayer}
              onPointerDown={handlePointerDown}
            />
          ))}
        </svg>
      </div>
      {selectedId && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          拖拽元素可调整位置和角度
        </div>
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';
