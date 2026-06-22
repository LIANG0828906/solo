import { useState, useRef, useEffect, useCallback } from 'react';
import { FloorPlan, PlacedItem, MaterialItem } from '../shared/types';
import { MATERIALS } from '../shared/data';

interface FloorPlanCanvasProps {
  floorPlan: FloorPlan;
  placedItems: PlacedItem[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  activeMaterial: MaterialItem | null;
  onCanvasClick: (x: number, y: number) => void;
  onUpdateItem: (id: string, updates: Partial<PlacedItem>) => void;
  onDeleteItem: (id: string) => void;
  onRotate: (id: string) => void;
}

const GRID_SIZE = 20;
const PADDING = 60;

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export default function FloorPlanCanvas(props: FloorPlanCanvasProps) {
  const {
    floorPlan, placedItems, selectedItemId, setSelectedItemId,
    activeMaterial, onCanvasClick, onUpdateItem, onDeleteItem, onRotate
  } = props;

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{
    type: 'move' | 'scale' | null;
    itemId: string;
    startX: number;
    startY: number;
    origX?: number;
    origY?: number;
    origScale?: number;
  } | null>(null);

  const { width, height } = floorPlan.layout;
  const svgWidth = width + PADDING * 2;
  const svgHeight = height + PADDING * 2;

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) * (svgWidth / rect.width) - PADDING;
    const y = (clientY - rect.top) * (svgHeight / rect.height) - PADDING;
    return { x, y };
  }, [svgWidth, svgHeight]);

  const handleSvgMouseDown = (e: React.MouseEvent, item: PlacedItem) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedItemId(item.id);
    const point = getSvgPoint(e.clientX, e.clientY);
    setDragging({
      type: 'move',
      itemId: item.id,
      startX: point.x,
      startY: point.y,
      origX: item.x,
      origY: item.y
    });
  };

  const handleScaleMouseDown = (e: React.MouseEvent, item: PlacedItem) => {
    e.stopPropagation();
    const point = getSvgPoint(e.clientX, e.clientY);
    setDragging({
      type: 'scale',
      itemId: item.id,
      startX: point.x,
      startY: point.y,
      origScale: item.scale
    });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const point = getSvgPoint(e.clientX, e.clientY);
      const dx = point.x - dragging.startX;
      const dy = point.y - dragging.startY;

      if (dragging.type === 'move' && dragging.origX !== undefined && dragging.origY !== undefined) {
        const newX = snapToGrid(dragging.origX + dx);
        const newY = snapToGrid(dragging.origY + dy);
        onUpdateItem(dragging.itemId, {
          x: Math.max(0, Math.min(width, newX)),
          y: Math.max(0, Math.min(height, newY))
        });
      } else if (dragging.type === 'scale' && dragging.origScale !== undefined) {
        const delta = (dx + dy) / 100;
        const newScale = Math.max(0.5, Math.min(2, dragging.origScale + delta));
        onUpdateItem(dragging.itemId, { scale: Number(newScale.toFixed(2)) });
      }
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, getSvgPoint, onUpdateItem, width, height]);

  const handleBgClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as SVGElement).tagName === 'rect' && (e.target as SVGElement).getAttribute('class')?.includes('grid')) {
      const point = getSvgPoint(e.clientX, e.clientY);
      if (activeMaterial) {
        const snappedX = snapToGrid(point.x);
        const snappedY = snapToGrid(point.y);
        if (snappedX >= 0 && snappedX <= width && snappedY >= 0 && snappedY <= height) {
          onCanvasClick(snappedX, snappedY);
        }
      } else {
        setSelectedItemId(null);
      }
    }
  };

  const renderGrid = () => {
    const lines = [];
    for (let x = 0; x <= width; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v${x}`}
          x1={x} y1={0} x2={x} y2={height}
          stroke="#E8DFD5"
          strokeWidth={x % (GRID_SIZE * 5) === 0 ? 1 : 0.5}
          className="grid"
        />
      );
    }
    for (let y = 0; y <= height; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h${y}`}
          x1={0} y1={y} x2={width} y2={y}
          stroke="#E8DFD5"
          strokeWidth={y % (GRID_SIZE * 5) === 0 ? 1 : 0.5}
          className="grid"
        />
      );
    }
    const dots = [];
    for (let x = 0; x <= width; x += GRID_SIZE) {
      for (let y = 0; y <= height; y += GRID_SIZE) {
        dots.push(
          <circle key={`d${x}-${y}`} cx={x} cy={y} r={1.5} fill="#D7CCC8" className="grid" />
        );
      }
    }
    return [...lines, ...dots];
  };

  const selectedItem = placedItems.find(i => i.id === selectedItemId);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      padding: 40,
      minWidth: svgWidth + 40
    }}>
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          background: '#FFFBF5',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(139,94,60,0.12)',
          maxWidth: '100%',
          cursor: activeMaterial ? 'crosshair' : 'default'
        }}
        onClick={handleBgClick}
      >
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        <g transform={`translate(${PADDING}, ${PADDING})`}>
          {renderGrid()}

          <rect
            x={0} y={0}
            width={width} height={height}
            fill="transparent"
            className="grid"
          />

          {floorPlan.layout.walls.map((wall, i) => (
            <rect
              key={`wall-${i}`}
              x={wall.x} y={wall.y}
              width={wall.width} height={wall.height}
              fill="#5D4037"
              rx={2}
            />
          ))}

          {floorPlan.layout.doors.map((door, i) => (
            <g key={`door-${i}`}>
              <rect
                x={door.x} y={door.y}
                width={door.width} height={door.height}
                fill="#8D6E63"
                rx={2}
              />
              <line
                x1={door.x + door.width * 0.2}
                y1={door.y + door.height / 2}
                x2={door.x + door.width * 0.8}
                y2={door.y + door.height / 2}
                stroke="#3E2723"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            </g>
          ))}

          {floorPlan.layout.windows.map((win, i) => (
            <g key={`window-${i}`}>
              <rect
                x={win.x} y={win.y}
                width={win.width} height={win.height}
                fill="#BBDEFB"
                stroke="#5D4037"
                strokeWidth={1}
                rx={2}
              />
              <line
                x1={win.x + win.width / 2}
                y1={win.y}
                x2={win.x + win.width / 2}
                y2={win.y + win.height}
                stroke="#5D4037"
                strokeWidth={1}
              />
            </g>
          ))}

          {placedItems.map((item, idx) => {
            const material = MATERIALS.find(m => m.id === item.materialId);
            if (!material) return null;

            const isSelected = item.id === selectedItemId;
            const w = material.width * item.scale * 0.5;
            const h = material.height * item.scale * 0.5;

            return (
              <g
                key={item.id}
                transform={`translate(${item.x}, ${item.y})`}
                style={{ cursor: isSelected ? 'move' : 'pointer' }}
              >
                <g transform={`rotate(${item.rotation})`}>
                  <g
                    className="animate-bounce-in"
                    style={{
                      animationDelay: `${idx * 0.02}s`
                    }}
                    onMouseDown={(e) => handleSvgMouseDown(e, item)}
                  >
                    <g transform={`translate(${-w/2}, ${-h/2})`}>
                      <foreignObject
                        width={w}
                        height={h}
                        style={{ pointerEvents: 'none' }}
                      >
                        <div
                          style={{ width: '100%', height: '100%' }}
                          dangerouslySetInnerHTML={{
                            __html: material.topViewSvg.replace(
                              /fill="#[0-9A-Fa-f]{3,6}"/g,
                              'fill="' + item.color + '"'
                            ).replace(
                              /viewBox="[^"]*"/,
                              'viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"'
                            )
                          }}
                        ></div>
                      </foreignObject>
                    </g>
                  </g>

                  {isSelected && (
                    <g>
                      <rect
                        x={-w / 2 - 6}
                        y={-h / 2 - 6}
                        width={w + 12}
                        height={h + 12}
                        fill="none"
                        stroke="#2196F3"
                        strokeWidth={2}
                        strokeDasharray="5 2"
                        rx={4}
                        style={{ pointerEvents: 'none' }}
                      />

                      <circle
                        cx={0}
                        cy={-h / 2 - 20}
                        r={7}
                        fill="#2196F3"
                        stroke="#fff"
                        strokeWidth={2}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotate(item.id);
                        }}
                      />
                      <text
                        x={0}
                        y={-h / 2 - 17}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={8}
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        ↻
                      </text>

                      <rect
                        x={w / 2}
                        y={h / 2}
                        width={12}
                        height={12}
                        fill="#2196F3"
                        stroke="#fff"
                        strokeWidth={2}
                        rx={2}
                        style={{ cursor: 'nwse-resize' }}
                        onMouseDown={(e) => handleScaleMouseDown(e, item)}
                      />
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
