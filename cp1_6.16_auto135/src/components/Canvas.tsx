import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGeneStore } from '@/store/useGeneStore';
import { GeneticElement, Connection, ELEMENT_SIZE, ElementType, ELEMENT_PRESETS, Position } from '@/models/GeneticElement';
import { socketService } from '@/services/socketService';

const ElementShape: React.FC<{
  element: GeneticElement;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({ element, isSelected, isDragging, onMouseDown, onMouseEnter, onMouseLeave }) => {
  const w = ELEMENT_SIZE.width;
  const h = ELEMENT_SIZE.height;
  const cx = w / 2;
  const cy = h / 2;

  const renderShape = () => {
    const commonProps = {
      fill: element.color,
      stroke: isSelected ? '#FFD700' : '#fff',
      strokeWidth: isSelected ? 3 : 1,
      style: {
        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
        cursor: 'move',
        transformOrigin: 'center',
        transformBox: 'fill-box' as any
      }
    };

    switch (element.shape) {
      case 'rectangle':
        return <rect x="0" y="0" width={w} height={h} rx="8" {...commonProps} />;
      case 'diamond':
        return <polygon points={`${cx},0 ${w},${cy} ${cx},${h} 0,${cy}`} {...commonProps} />;
      case 'triangle':
        return <polygon points={`${cx},0 ${w},${h} 0,${h}`} {...commonProps} />;
      case 'circle':
        return <circle cx={cx} cy={cy} r={Math.min(w, h) / 2} {...commonProps} />;
      case 'hexagon': {
        const r = Math.min(w, h) / 2;
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon points={points} {...commonProps} />;
      }
      default:
        return null;
    }
  };

  return (
    <g
      transform={`translate(${element.position.x}, ${element.position.y})`}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        opacity: isDragging ? 0.8 : 1,
        cursor: 'move'
      }}
      className={`canvas-element ${isSelected ? 'selected' : ''}`}
    >
      {renderShape()}
      <text
        x={cx} y={h + 14} textAnchor="middle"
        fill="#333" fontSize="11" fontFamily="Roboto, sans-serif"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {element.label}
      </text>
    </g>
  );
};

const BezierConnection: React.FC<{
  connection: Connection;
  from: GeneticElement;
  to: GeneticElement;
  isBeingDrawn?: boolean;
}> = ({ connection, from, to }) => {
  const fx = from.position.x + ELEMENT_SIZE.width / 2;
  const fy = from.position.y + ELEMENT_SIZE.height / 2;
  const tx = to.position.x + ELEMENT_SIZE.width / 2;
  const ty = to.position.y + ELEMENT_SIZE.height / 2;

  const dx = tx - fx;
  const cx1 = fx + dx * 0.5;
  const cy1 = fy;
  const cx2 = fx + dx * 0.5;
  const cy2 = ty;

  const angle = Math.atan2(ty - cy2, tx - cx2);
  const arrowSize = 8;
  const ax1 = tx - arrowSize * Math.cos(angle - Math.PI / 6);
  const ay1 = ty - arrowSize * Math.sin(angle - Math.PI / 6);
  const ax2 = tx - arrowSize * Math.cos(angle + Math.PI / 6);
  const ay2 = ty - arrowSize * Math.sin(angle + Math.PI / 6);

  return (
    <g>
      <path
        d={`M ${fx} ${fy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`}
        fill="none"
        stroke={connection.color}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.15))' }}
      />
      <polygon
        points={`${tx},${ty} ${ax1},${ay1} ${ax2},${ay2}`}
        fill={connection.color}
      />
    </g>
  );
};

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 700 });
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const elements = useGeneStore((s) => s.elements);
  const connections = useGeneStore((s) => s.connections);
  const selectedElementId = useGeneStore((s) => s.selectedElementId);
  const draggingElement = useGeneStore((s) => s.draggingElement);
  const isDraggingNew = useGeneStore((s) => s.isDraggingNew);
  const connectionStartId = useGeneStore((s) => s.connectionStartId);
  const tempConnectionEnd = useGeneStore((s) => s.tempConnectionEnd);
  const simulation = useGeneStore((s) => s.simulation);
  const remoteCursors = useGeneStore((s) => s.remoteCursors);
  const isTransitioning = useGeneStore((s) => s.isTransitioning);

  const addElement = useGeneStore((s) => s.addElement);
  const moveElement = useGeneStore((s) => s.moveElement);
  const setSelectedElement = useGeneStore((s) => s.setSelectedElement);
  const setDraggingElement = useGeneStore((s) => s.setDraggingElement);
  const startConnection = useGeneStore((s) => s.startConnection);
  const updateTempConnection = useGeneStore((s) => s.updateTempConnection);
  const finishConnection = useGeneStore((s) => s.finishConnection);
  const cancelConnection = useGeneStore((s) => s.cancelConnection);

  const [movingElementId, setMovingElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(rect.width, 800),
          height: Math.max(rect.height, 700)
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    socketService.connect();
    return () => socketService.disconnect();
  }, []);

  useEffect(() => {
    let lastEmit = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastEmit > 50) {
        if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          socketService.emitCursorMove(pos);
        }
        lastEmit = now;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getCanvasPosition = useCallback((clientX: number, clientY: number): Position => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const snapToGrid = useCallback((pos: Position, gridSize: number = 20): Position => {
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize
    };
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain') as ElementType;
    if (!type || !ELEMENT_PRESETS[type]) return;

    const pos = getCanvasPosition(e.clientX, e.clientY);
    const snapped = snapToGrid({
      x: pos.x - ELEMENT_SIZE.width / 2,
      y: pos.y - ELEMENT_SIZE.height / 2
    });

    addElement(type, snapped);
    setDraggingElement(null, false);
  }, [addElement, getCanvasPosition, snapToGrid, setDraggingElement]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const pos = getCanvasPosition(e.clientX, e.clientY);
    setMousePos(pos);
  }, [getCanvasPosition]);

  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: GeneticElement) => {
    e.stopPropagation();
    setSelectedElement(element.id);
    setMovingElementId(element.id);
    const pos = getCanvasPosition(e.clientX, e.clientY);
    setDragOffset({
      x: pos.x - element.position.x,
      y: pos.y - element.position.y
    });
  }, [getCanvasPosition, setSelectedElement]);

  const handleElementClick = useCallback((e: React.MouseEvent, element: GeneticElement) => {
    e.stopPropagation();
    if (connectionStartId) {
      finishConnection(element.id);
    } else if (!movingElementId) {
      startConnection(element.id);
    }
  }, [connectionStartId, finishConnection, movingElementId, startConnection]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPosition(e.clientX, e.clientY);
    setMousePos(pos);

    if (movingElementId) {
      const newPos = snapToGrid({
        x: pos.x - dragOffset.x,
        y: pos.y - dragOffset.y
      });
      moveElement(movingElementId, newPos);
      socketService.emitElementMove(movingElementId, newPos);
    }

    if (connectionStartId) {
      updateTempConnection(pos);
    }
  }, [connectionStartId, dragOffset, getCanvasPosition, moveElement, movingElementId, snapToGrid, updateTempConnection]);

  const handleCanvasMouseUp = useCallback(() => {
    setMovingElementId(null);
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (connectionStartId) {
      cancelConnection();
    }
    setSelectedElement(null);
  }, [cancelConnection, connectionStartId, setSelectedElement]);

  const renderGrid = () => {
    const gridSize = 20;
    const lines = [];
    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={canvasSize.height} stroke="#E0E0E0" strokeWidth="1" />);
    }
    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      lines.push(<line key={`h${y}`} x1={0} y1={y} x2={canvasSize.width} y2={y} stroke="#E0E0E0" strokeWidth="1" />);
    }
    return lines;
  };

  const renderConnections = () => {
    return connections.map((conn) => {
      const from = elements.find((el) => el.id === conn.fromId);
      const to = elements.find((el) => el.id === conn.toId);
      if (!from || !to) return null;
      return <BezierConnection key={conn.id} connection={conn} from={from} to={to} />;
    });
  };

  const renderTempConnection = () => {
    if (!connectionStartId || !tempConnectionEnd) return null;
    const from = elements.find((el) => el.id === connectionStartId);
    if (!from) return null;
    const fx = from.position.x + ELEMENT_SIZE.width / 2;
    const fy = from.position.y + ELEMENT_SIZE.height / 2;
    const tx = tempConnectionEnd.x;
    const ty = tempConnectionEnd.y;
    const dx = tx - fx;
    const cx1 = fx + dx * 0.5;
    const cy1 = fy;
    const cx2 = fx + dx * 0.5;
    const cy2 = ty;

    return (
      <path
        d={`M ${fx} ${fy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`}
        fill="none"
        stroke={from.color}
        strokeWidth="2"
        strokeDasharray="6 4"
        opacity="0.7"
      />
    );
  };

  const renderPolymerase = () => {
    if (!simulation.polymerasePosition || !simulation.isPlaying) return null;
    const { x, y } = simulation.polymerasePosition;
    const size = 18;
    return (
      <g transform={`translate(${x - size / 2}, ${y - size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#FFA726" stroke="#E65100" strokeWidth="2" />
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect
              key={deg}
              x="-1" y={-size / 2 + 1} width="2" height="4"
              fill="#E65100"
              transform={`rotate(${deg})`}
              style={{ animation: 'spin 1s linear infinite', transformOrigin: 'center' }}
            />
          ))}
        </g>
      </g>
    );
  };

  const renderMRNA = () => {
    if (!simulation.mrnaGenerated) return null;
    const structuralGene = elements.find((e) => e.type === 'structural-gene');
    if (!structuralGene) return null;
    const baseX = structuralGene.position.x + ELEMENT_SIZE.width + 30;
    const baseY = structuralGene.position.y + ELEMENT_SIZE.height / 2;

    return (
      <g>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${baseX + i * 40}, ${baseY})`}>
            <ellipse cx="0" cy="0" rx="16" ry="12" fill="rgba(33, 150, 243, 0.3)" stroke="#1565C0" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="#1565C0" fontSize="10" fontWeight="bold">tRNA</text>
          </g>
        ))}
      </g>
    );
  };

  return (
    <div
      ref={canvasRef}
      className={`canvas-container ${isTransitioning ? 'transitioning' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onClick={handleCanvasClick}
    >
      <svg
        ref={svgRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="canvas-svg"
      >
        {renderGrid()}
        {renderConnections()}
        {renderTempConnection()}
        {simulation.blockedByRepressor && (
          <circle cx={simulation.polymerasePosition?.x ?? 0} cy={simulation.polymerasePosition?.y ?? 0} r="25" fill="none" stroke="#C62828" strokeWidth="3" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="0.5s" repeatCount="indefinite" />
          </circle>
        )}
        {elements.map((element) => (
          <g key={element.id} onClick={(e) => handleElementClick(e as any, element)}>
            <ElementShape
              element={element}
              isSelected={selectedElementId === element.id}
              isDragging={movingElementId === element.id}
              onMouseDown={(e) => handleElementMouseDown(e, element)}
              onMouseEnter={() => setHoveredElement(element.id)}
              onMouseLeave={() => setHoveredElement(null)}
            />
          </g>
        ))}
        {renderPolymerase()}
        {renderMRNA()}
        {remoteCursors.map((cursor) => (
          <g key={cursor.userId} transform={`translate(${cursor.position.x}, ${cursor.position.y})`}>
            <path
              d="M0 0 L0 16 L4 12 L7 18 L10 17 L7 11 L13 11 Z"
              fill={cursor.color}
              stroke="#fff"
              strokeWidth="1"
              style={{ filter: `drop-shadow(0 0 3px ${cursor.color})` }}
            />
            <rect x="14" y="-2" rx="3" ry="3" width="auto" height="16" fill={cursor.color}>
              <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />
            </rect>
            <text x="18" y="10" fill="#fff" fontSize="10" fontWeight="500">{cursor.userName}</text>
          </g>
        ))}
      </svg>
      {draggingElement && isDraggingNew && (
        <div
          className="dragging-ghost"
          style={{
            left: mousePos.x - ELEMENT_SIZE.width / 2,
            top: mousePos.y - ELEMENT_SIZE.height / 2
          }}
        >
          <svg width={ELEMENT_SIZE.width} height={ELEMENT_SIZE.height}>
            <rect x="0" y="0" width={ELEMENT_SIZE.width} height={ELEMENT_SIZE.height} rx="8" fill={draggingElement.color} opacity="0.6" />
          </svg>
        </div>
      )}
      {simulation.status === 'complete' && simulation.pairedResult && (
        <div className="simulation-result">
          <h4>模拟结果</h4>
          <p>{simulation.pairedResult}</p>
        </div>
      )}
      {hoveredElement && connectionStartId && connectionStartId !== hoveredElement && (
        <div className="connection-hint">点击元件完成连接</div>
      )}
    </div>
  );
};
