import { forwardRef, useMemo } from 'react';
import { useEditorStore } from '../store';
import {
  CANVAS_SIZE,
  getShapePath,
  getSymmetryTransforms
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

const LayerGroup = ({
  layer,
  isSelected,
  onSelect
}: {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  const config = useEditorStore((s) => s.canvasConfig);
  const transforms = useMemo(
    () => getSymmetryTransforms(layer, config),
    [layer, config]
  );

  return (
    <g
      className="shape-element"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(layer.id);
      }}
      style={{ cursor: 'pointer' }}
    >
      {transforms.map((t) => (
        <g key={t.key} transform={t.transform}>
          {renderShape(layer.shape, layer.fillColor, layer.strokeColor, layer.strokeWidth)}
          {isSelected && (
            <circle
              cx={0}
              cy={0}
              r={34}
              fill="none"
              stroke="#d4884a"
              strokeWidth={2}
              strokeDasharray="4 3"
              opacity={0.7}
            />
          )}
        </g>
      ))}
    </g>
  );
};

export const Canvas = forwardRef<SVGSVGElement, CanvasProps>(({ fadeKey }, ref) => {
  const layers = useEditorStore((s) => s.layers);
  const selectedId = useEditorStore((s) => s.selectedLayerId);
  const selectLayer = useEditorStore((s) => s.selectLayer);

  return (
    <div className="canvas-wrapper panel">
      <div className="canvas-container">
        <svg
          ref={ref}
          key={fadeKey}
          className="canvas-svg"
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          xmlns="http://www.w3.org/2000/svg"
          onClick={() => selectLayer(null)}
        >
          <defs>
            <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffaf4" />
              <stop offset="100%" stopColor="#fff1dc" />
            </radialGradient>
          </defs>
          <circle cx={CANVAS_SIZE / 2} cy={CANVAS_SIZE / 2} r={CANVAS_SIZE / 2} fill="url(#bg-grad)" />
          {layers.map((layer) => (
            <LayerGroup
              key={layer.id}
              layer={layer}
              isSelected={selectedId === layer.id}
              onSelect={selectLayer}
            />
          ))}
        </svg>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';
