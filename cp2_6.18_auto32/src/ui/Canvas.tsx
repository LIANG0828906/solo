import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import {
  useStore,
  ComponentData,
  ComponentType,
  COMPONENT_COLORS,
  GRID_SIZE,
} from '../store';
import { useDragAndDrop } from '../modules/dragNest';
import { getEffectiveLayout } from '../modules/responsiveStrategy';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

interface DragItem {
  type: string;
  componentType?: ComponentType;
  id?: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

const CanvasComponent: React.FC<{
  component: ComponentData;
  breakpointId: string;
  simulationMode: boolean;
}> = React.memo(({ component, breakpointId, simulationMode }) => {
  const highlightedComponentId = useStore(s => s.highlightedComponentId);
  const selectedComponentId = useStore(s => s.selectedComponentId);
  const setHighlight = useStore(s => s.setHighlight);
  const setSelected = useStore(s => s.setSelected);
  const handleDragStart = useDragAndDrop().handleDragStart;
  const handleCanvasComponentDrop = useDragAndDrop().handleCanvasComponentDrop;
  const canvasZoom = useStore(s => s.canvasZoom);

  const isHighlighted = highlightedComponentId === component.id;
  const isSelected = selectedComponentId === component.id;
  const layout = getEffectiveLayout(component, breakpointId);
  const borderColor = COMPONENT_COLORS[component.type];
  const isHidden = !layout.visible;

  const [{ isDragging }, dragRef] = useDrag({
    type: 'CANVAS_COMPONENT',
    item: { type: 'CANVAS_COMPONENT', id: component.id },
    canDrag: !simulationMode,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const style: React.CSSProperties = {
    position: component.parentId ? 'relative' : 'absolute',
    left: component.parentId ? undefined : component.x,
    top: component.parentId ? undefined : component.y,
    width: layout.width,
    minWidth: component.type === 'container' ? 60 : undefined,
    height: component.height,
    zIndex: component.zIndex,
    border: isHighlighted
      ? '2px dashed #FF6B6B'
      : isSelected
      ? `2px solid ${borderColor}`
      : `1px solid ${borderColor}`,
    opacity: isDragging ? 0.7 : isHidden ? 0.4 : 1,
    borderRadius: 4,
    cursor: simulationMode ? 'default' : 'move',
    transition: 'width 0.3s ease, opacity 0.3s ease',
    overflow: 'hidden',
    boxSizing: 'border-box',
    background: component.type === 'container' ? 'rgba(74,144,217,0.05)' : component.type === 'image' ? '#e8e8e8' : '#fff',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(component.id);
  };

  const handleMouseEnter = () => {
    if (!isHighlighted) setHighlight(component.id);
  };

  const handleMouseLeave = () => {
    if (highlightedComponentId === component.id) setHighlight(null);
  };

  const renderContent = () => {
    switch (component.type) {
      case 'container':
        return (
          <>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: '#F0F0F0',
              color: '#333',
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: '4px 4px 0 0',
              zIndex: 1,
            }}>
              {component.label} ({component.childrenOrder.length})
            </div>
          </>
        );
      case 'button':
        return (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#27AE60',
            color: '#fff',
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 500,
          }}>
            {component.label}
          </div>
        );
      case 'textblock':
        return (
          <div style={{
            padding: 8,
            fontSize: 14,
            color: '#333',
            lineHeight: 1.4,
          }}>
            {component.label}
          </div>
        );
      case 'image':
        return (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0e6f6',
            color: '#8E44AD',
            fontSize: 24,
          }}>
            🖼
          </div>
        );
    }
  };

  return (
    <div
      ref={dragRef as unknown as React.Ref<HTMLDivElement>}
      style={style}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderContent()}
      {(isHighlighted || isSelected) && !simulationMode && (
        <div style={{
          position: 'absolute',
          top: -20,
          left: 0,
          background: '#333',
          color: '#fff',
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          zIndex: 10000,
          pointerEvents: 'none',
        }}>
          {component.id.slice(0, 8)}
        </div>
      )}
      {isHidden && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(45deg, rgba(255,0,0,0.15), rgba(255,0,0,0.15) 5px, transparent 5px, transparent 10px)',
          pointerEvents: 'none',
          zIndex: 9999,
        }} />
      )}
    </div>
  );
});

CanvasComponent.displayName = 'CanvasComponent';

const CanvasInner: React.FC = () => {
  const components = useStore(s => s.components);
  const canvasZoom = useStore(s => s.canvasZoom);
  const setCanvasZoom = useStore(s => s.setCanvasZoom);
  const activeBreakpoint = useStore(s => s.activeBreakpoint);
  const simulationMode = useStore(s => s.simulationMode);
  const simulationDevice = useStore(s => s.simulationDevice);
  const setSelected = useStore(s => s.setSelected);
  const setHighlight = useStore(s => s.setHighlight);
  const handleNewComponentDrop = useDragAndDrop().handleNewComponentDrop;
  const handleCanvasComponentDrop = useDragAndDrop().handleCanvasComponentDrop;

  const canvasRef = useRef<HTMLDivElement>(null);
  const [insertLine, setInsertLine] = useState<{ x: number; y: number; horizontal: boolean } | null>(null);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / canvasZoom;
    const y = (clientY - rect.top) / canvasZoom;
    return { x, y };
  }, [canvasZoom]);

  const snapPosition = useCallback((val: number) => {
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  }, []);

  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: ['NEW_COMPONENT', 'CANVAS_COMPONENT'],
    drop: (item: DragItem, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const coords = getCanvasCoords(offset.x, offset.y);
      if (item.type === 'NEW_COMPONENT' && item.componentType) {
        const defaults = { container: { w: 300, h: 200 }, button: { w: 120, h: 40 }, textblock: { w: 200, h: 60 }, image: { w: 160, h: 120 } };
        const d = defaults[item.componentType];
        handleNewComponentDrop(
          item.componentType,
          snapPosition(coords.x - d.w / 2),
          snapPosition(coords.y - d.h / 2)
        );
      } else if (item.type === 'CANVAS_COMPONENT' && item.id) {
        handleCanvasComponentDrop(item.id, snapPosition(coords.x - item.offsetX), snapPosition(coords.y - item.offsetY));
      }
      setInsertLine(null);
    },
    hover: (item: DragItem, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset || !canvasRef.current) return;
      const coords = getCanvasCoords(offset.x, offset.y);
      setInsertLine({
        x: snapPosition(coords.x),
        y: snapPosition(coords.y),
        horizontal: false,
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setCanvasZoom(canvasZoom + delta);
  }, [canvasZoom, setCanvasZoom]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === (canvasRef.current?.children[0] as HTMLElement)) {
      setSelected(null);
      setHighlight(null);
    }
  };

  const rootComponents = components.filter(c => c.parentId === null).sort((a, b) => a.zIndex - b.zIndex);
  const childComponents = (parentId: string) =>
    components.filter(c => c.parentId === parentId)
      .sort((a, b) => {
        const parent = components.find(p => p.id === parentId);
        if (parent) {
          const ai = parent.childrenOrder.indexOf(a.id);
          const bi = parent.childrenOrder.indexOf(b.id);
          if (ai !== -1 && bi !== -1) return ai - bi;
        }
        return 0;
      });

  const renderComponent = (comp: ComponentData): React.ReactNode => {
    const children = childComponents(comp.id);
    return (
      <CanvasComponent
        key={comp.id}
        component={{
          ...comp,
          childrenOrder: comp.childrenOrder,
        }}
        breakpointId={activeBreakpoint}
        simulationMode={simulationMode}
      >
        {comp.type === 'container' && children.map(renderComponent)}
      </CanvasComponent>
    );
  };

  const effectiveCanvasWidth = simulationMode && simulationDevice ? simulationDevice.width : CANVAS_WIDTH;
  const effectiveCanvasHeight = simulationMode && simulationDevice ? simulationDevice.height : CANVAS_HEIGHT;

  const gridBackground = simulationMode ? 'none' : `
    linear-gradient(to right, #E0E0E0 1px, transparent 1px),
    linear-gradient(to bottom, #E0E0E0 1px, transparent 1px)
  `;
  const gridSize = `${GRID_SIZE}px ${GRID_SIZE}px`;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1A1A28',
        overflow: 'auto',
        position: 'relative',
      }}
      onWheel={handleWheel}
    >
      {simulationMode && simulationDevice && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: '#FFFFFFCC',
          color: '#333',
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          zIndex: 10001,
        }}>
          {simulationDevice.name} ({simulationDevice.width}×{simulationDevice.height})
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {simulationMode && simulationDevice && (
          <div style={{
            border: '2px solid #000',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#FFFFFFCC',
          }}>
            <div style={{
              position: 'absolute',
              top: -1,
              left: 8,
              background: '#000',
              color: '#fff',
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: '0 0 4px 4px',
              zIndex: 1,
            }}>
              {simulationDevice.name}
            </div>
          </div>
        )}

        <div
          ref={(node) => {
            dropRef(node);
            (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onClick={handleCanvasClick}
          style={{
            width: effectiveCanvasWidth,
            height: effectiveCanvasHeight,
            background: '#FFFFFF',
            backgroundImage: gridBackground,
            backgroundSize: gridSize,
            position: 'relative',
            transform: simulationMode ? 'none' : `scale(${canvasZoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease, width 0.3s ease, height 0.3s ease',
            boxShadow: isOver && canDrop ? '0 0 0 3px #2196F3' : '0 4px 24px rgba(0,0,0,0.3)',
            overflow: simulationMode ? 'auto' : 'visible',
            borderRadius: simulationMode ? 8 : 0,
          }}
        >
          {rootComponents.map(comp => {
            const children = childComponents(comp.id);
            return (
              <CanvasComponent
                key={comp.id}
                component={comp}
                breakpointId={activeBreakpoint}
                simulationMode={simulationMode}
              />
            );
          })}
          {insertLine && isOver && (
            <div style={{
              position: 'absolute',
              left: insertLine.x,
              top: 0,
              width: 2,
              height: '100%',
              background: '#2196F3',
              pointerEvents: 'none',
              zIndex: 9999,
            }} />
          )}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        background: '#2A2A3E',
        padding: '6px 14px',
        borderRadius: 8,
        fontSize: 13,
        color: '#E0E0E0',
        border: '1px solid #4A4A5E',
        fontWeight: 600,
      }}>
        {Math.round(canvasZoom * 100)}%
      </div>
    </div>
  );
};

export const Canvas: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <CanvasInner />
    </DndProvider>
  );
};
