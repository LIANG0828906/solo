import React, { useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { ShapeConfig, ShapeType } from '@/store/gameStore';

function ShapeSVG({ type, color, width, height }: { type: ShapeType; color: string; width: number; height: number }) {
  if (type === 'circle') {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <circle cx={width / 2} cy={height / 2} r={width / 2 - 1} fill={color} stroke={color} strokeWidth={1} opacity={0.9} />
      </svg>
    );
  }
  if (type === 'rectangle') {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x={1} y={1} width={width - 2} height={height - 2} rx={4} fill={color} stroke={color} strokeWidth={1} opacity={0.9} />
      </svg>
    );
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon points={`${width / 2},2 ${width - 2},${height - 2} 2,${height - 2}`} fill={color} stroke={color} strokeWidth={1} opacity={0.9} />
    </svg>
  );
}

const ShapeItem = React.memo(({ shape, handleMouseDown, elRef }: {
  shape: ShapeConfig;
  handleMouseDown: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
  elRef: (id: string, el: HTMLDivElement | null) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      elRef(shape.id, ref.current);
    }
  }, [shape.id, elRef]);

  return (
    <div
      ref={ref}
      className="shape-library-item"
      style={{
        width: shape.width,
        height: shape.height,
        opacity: shape.isSnapped ? 0.25 : 1,
        cursor: shape.isSnapped ? 'default' : 'grab',
        filter: shape.isSnapped ? 'grayscale(1)' : `drop-shadow(0 0 1px ${shape.color})`,
        transition: 'opacity 0.3s ease-out, filter 0.3s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={shape.isSnapped ? undefined : (e) => handleMouseDown(shape.id, e)}
      onTouchStart={shape.isSnapped ? undefined : (e) => handleMouseDown(shape.id, e)}
    >
      <ShapeSVG type={shape.type} color={shape.color} width={shape.width} height={shape.height} />
    </div>
  );
});
ShapeItem.displayName = 'ShapeItem';

export default function ShapeLibrary() {
  const shapes = useGameStore(s => s.shapes);
  const draggingId = useGameStore(s => s.draggingId);
  const shapeElRef = useGameStore.getState().shapeElRef;

  const { handleMouseDown } = useGameStore.getState();

  const elRefCallback = React.useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      (shapeElRef as React.MutableRefObject<Map<string, HTMLDivElement>>).current.set(id, el);
    }
  }, [shapeElRef]);

  const typeLabels: Record<ShapeType, string> = {
    circle: '圆形',
    rectangle: '矩形',
    triangle: '三角形',
  };

  return (
    <div className="shape-library">
      <h3 className="shape-library-title">形状库</h3>
      <div className="shape-library-list">
        {shapes.map(shape => (
          <div key={shape.id} className="shape-library-row">
            <span className="shape-label" style={{ color: shape.color }}>
              {typeLabels[shape.type]}
            </span>
            <ShapeItem
              shape={shape}
              handleMouseDown={handleMouseDown}
              elRef={elRefCallback}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
