import React, { useCallback, useRef, useState, useMemo } from 'react';
import { useDrag, useDrop, DragLayerMonitor, XYCoord, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import {
  useStore,
  ComponentData,
  ComponentType,
  COMPONENT_COLORS,
  GRID_SIZE,
  COMPONENT_DEFAULTS,
} from '../store';
import { useDragAndDrop } from '../modules/dragNest';
import { getEffectiveLayout } from '../modules/responsiveStrategy';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const SNAP_THRESHOLD = 20;

interface DragItem {
  type: string;
  componentType?: ComponentType;
  id?: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  _clientStartX?: number;
  _clientStartY?: number;
}

interface InsertIndicator {
  x: number;
  y: number;
  width: number;
  targetId?: string;
  isBefore: boolean;
}

interface SnapGuideLines {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
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

  const isHighlighted = highlightedComponentId === component.id;
  const isSelected = selectedComponentId === component.id;
  const layout = getEffectiveLayout(component, breakpointId);
  const borderColor = COMPONENT_COLORS[component.type];
  const isHidden = !layout.visible;

  const [{ isDragging }, dragRef] = useDrag({
    type: 'CANVAS_COMPONENT',
    item: (monitor) => {
      const clientOffset = monitor.getClientOffset();
      return {
        type: 'CANVAS_COMPONENT',
        id: component.id,
        startX: component.x,
        startY: component.y,
        offsetX: 0,
        offsetY: 0,
        _clientStartX: clientOffset?.x ?? 0,
        _clientStartY: clientOffset?.y ?? 0,
      };
    },
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
    transition: simulationMode ? 'width 0.5s ease-in-out, height 0.5s ease-in-out, left 0.5s ease-in-out, top 0.5s ease-in-out, opacity 0.3s ease' : 'width 0.3s ease, opacity 0.3s ease',
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
      data-component-id={component.id}
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

const DragThumbnail: React.FC = () => {
  const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer(
    (monitor: DragLayerMonitor<DragItem>) => ({
      item: monitor.getItem() as DragItem | null,
      itemType: monitor.getItemType() as string | null,
      initialOffset: monitor.getInitialSourceClientOffset(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
    })
  );

  const components = useStore(s => s.components);

  if (!isDragging || !item) return null;

  let compType: ComponentType | null = null;
  let label: string = '';

  if (item.type === 'NEW_COMPONENT' && item.componentType) {
    compType = item.componentType;
    label = COMPONENT_DEFAULTS[compType].label;
  } else if (item.type === 'CANVAS_COMPONENT' && item.id) {
    const comp = components.find(c => c.id === item.id);
    if (comp) {
      compType = comp.type;
      label = comp.label;
    }
  }

  if (!compType) return null;

  const color = COMPONENT_COLORS[compType];
  const icons: Record<ComponentType, string> = {
    container: '📦',
    button: '🔘',
    textblock: '📝',
    image: '🖼',
  };

  const transform = currentOffset
    ? `translate(${currentOffset.x + 15}px, ${currentOffset.y + 15}px)`
    : 'translate(-1000px, -1000px)';

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 99999,
        left: 0,
        top: 0,
        transform,
        transition: 'transform 0.02s linear',
      }}
    >
      <div
        style={{
          width: 60,
          height: 40,
          borderRadius: 6,
          border: `2px solid ${color}`,
          background: '#fff',
          opacity: 0.8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        <span style={{ fontSize: 14 }}>{icons[compType]}</span>
        <span style={{
          fontSize: 8,
          color: '#333',
          marginTop: 2,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 2px',
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};

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
  const [insertIndicator, setInsertIndicator] = useState<InsertIndicator | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuideLines>({});
  const [isDragging, setIsDragging] = useState(false);

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

  const computeSnapGuides = useCallback(
    (compLeft: number, compTop: number, compWidth: number, compHeight: number): SnapGuideLines => {
      const guides: SnapGuideLines = {};

      const compRight = compLeft + compWidth;
      const compBottom = compTop + compHeight;

      const nearestLeft = Math.round(compLeft / GRID_SIZE) * GRID_SIZE;
      if (Math.abs(compLeft - nearestLeft) <= SNAP_THRESHOLD) {
        guides.left = nearestLeft;
      }

      const nearestRight = Math.round(compRight / GRID_SIZE) * GRID_SIZE;
      if (Math.abs(compRight - nearestRight) <= SNAP_THRESHOLD && guides.left === undefined) {
        guides.right = nearestRight;
      } else if (Math.abs(compRight - nearestRight) <= SNAP_THRESHOLD && Math.abs(compRight - nearestRight) < Math.abs(compLeft - nearestLeft)) {
        guides.right = nearestRight;
        delete guides.left;
      }

      const nearestTop = Math.round(compTop / GRID_SIZE) * GRID_SIZE;
      if (Math.abs(compTop - nearestTop) <= SNAP_THRESHOLD) {
        guides.top = nearestTop;
      }

      const nearestBottom = Math.round(compBottom / GRID_SIZE) * GRID_SIZE;
      if (Math.abs(compBottom - nearestBottom) <= SNAP_THRESHOLD && guides.top === undefined) {
        guides.bottom = nearestBottom;
      } else if (Math.abs(compBottom - nearestBottom) <= SNAP_THRESHOLD && Math.abs(compBottom - nearestBottom) < Math.abs(compTop - nearestTop)) {
        guides.bottom = nearestBottom;
        delete guides.top;
      }

      return guides;
    },
    []
  );

  const computeInsertIndicator = useCallback(
    (canvasX: number, canvasY: number, draggingId?: string): InsertIndicator | null => {
      const canvasWidth = simulationMode && simulationDevice ? simulationDevice.width : CANVAS_WIDTH;

      let nearest: {
        comp: ComponentData;
        distance: number;
        isBefore: boolean;
        absY: number;
      } | null = null;

      for (const comp of components) {
        if (comp.id === draggingId) continue;
        if (comp.parentId !== null) continue;
        const layout = getEffectiveLayout(comp, activeBreakpoint);
        if (!layout.visible) continue;

        const effectiveWidth =
          typeof layout.width === 'string' && layout.width.endsWith('%')
            ? (parseFloat(layout.width) / 100) * canvasWidth
            : Number(layout.width);

        const x = comp.x;
        const y = comp.y;
        const w = effectiveWidth;
        const h = comp.height;

        if (canvasX < x - 40 || canvasX > x + w + 40) continue;

        const midY = y + h / 2;
        const isBefore = canvasY < midY;
        const insertY = isBefore ? y : y + h;
        const distance = Math.abs(canvasY - insertY);

        if (!nearest || distance < nearest.distance) {
          nearest = { comp, distance, isBefore, absY: insertY };
        }
      }

      if (nearest && nearest.distance <= 60) {
        const layout = getEffectiveLayout(nearest.comp, activeBreakpoint);
        const effectiveWidth =
          typeof layout.width === 'string' && layout.width.endsWith('%')
            ? (parseFloat(layout.width) / 100) * canvasWidth
            : Number(layout.width);
        return {
          x: nearest.comp.x,
          y: snapPosition(nearest.absY),
          width: effectiveWidth,
          targetId: nearest.comp.id,
          isBefore: nearest.isBefore,
        };
      }

      return {
        x: 0,
        y: snapPosition(canvasY),
        width: canvasWidth,
        isBefore: false,
      };
    },
    [components, activeBreakpoint, simulationMode, simulationDevice, snapPosition]
  );

  const getDraggedDimensions = useCallback(
    (item: DragItem): { width: number; height: number } => {
      if (item.type === 'NEW_COMPONENT' && item.componentType) {
        const d = COMPONENT_DEFAULTS[item.componentType];
        return { width: d.width, height: d.height };
      } else if (item.type === 'CANVAS_COMPONENT' && item.id) {
        const comp = components.find(c => c.id === item.id);
        if (comp) {
          const layout = getEffectiveLayout(comp, activeBreakpoint);
          const canvasWidth = simulationMode && simulationDevice ? simulationDevice.width : CANVAS_WIDTH;
          const effectiveWidth =
            typeof layout.width === 'string' && layout.width.endsWith('%')
              ? (parseFloat(layout.width) / 100) * canvasWidth
              : Number(layout.width);
          return { width: effectiveWidth, height: comp.height };
        }
      }
      return { width: 100, height: 100 };
    },
    [components, activeBreakpoint, simulationMode, simulationDevice]
  );

  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: ['NEW_COMPONENT', 'CANVAS_COMPONENT'],
    drop: (item: DragItem, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const coords = getCanvasCoords(offset.x, offset.y);
      if (item.type === 'NEW_COMPONENT' && item.componentType) {
        const d = COMPONENT_DEFAULTS[item.componentType];
        handleNewComponentDrop(
          item.componentType,
          snapPosition(coords.x - d.width / 2),
          snapPosition(coords.y - d.height / 2)
        );
      } else if (item.type === 'CANVAS_COMPONENT' && item.id) {
        const diff = monitor.getDifferenceFromInitialOffset();
        const draggedComp = components.find(c => c.id === item.id);
        let targetX, targetY;
        if (diff && draggedComp) {
          const dx = diff.x / canvasZoom;
          const dy = diff.y / canvasZoom;
          targetX = draggedComp.x + dx;
          targetY = draggedComp.y + dy;
        } else {
          targetX = coords.x - item.offsetX;
          targetY = coords.y - item.offsetY;
        }
        handleCanvasComponentDrop(item.id, snapPosition(targetX), snapPosition(targetY));
      }
      setInsertIndicator(null);
      setSnapGuides({});
      setIsDragging(false);
    },
    hover: (item: DragItem, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset || !canvasRef.current) return;
      const coords = getCanvasCoords(offset.x, offset.y);
      setIsDragging(true);
      const indicator = computeInsertIndicator(
        coords.x,
        coords.y,
        item.type === 'CANVAS_COMPONENT' ? item.id : undefined
      );
      setInsertIndicator(indicator);

      const dims = getDraggedDimensions(item);
      let compLeft, compTop;
      if (item.type === 'NEW_COMPONENT' && item.componentType) {
        compLeft = coords.x - dims.width / 2;
        compTop = coords.y - dims.height / 2;
      } else if (item.type === 'CANVAS_COMPONENT' && item.id) {
        const diff = monitor.getDifferenceFromInitialOffset();
        const draggedComp = components.find(c => c.id === item.id);
        if (diff && draggedComp) {
          const dx = diff.x / canvasZoom;
          const dy = diff.y / canvasZoom;
          compLeft = draggedComp.x + dx;
          compTop = draggedComp.y + dy;
        } else {
          compLeft = coords.x - item.offsetX;
          compTop = coords.y - item.offsetY;
        }
      } else {
        compLeft = coords.x;
        compTop = coords.y;
      }
      const guides = computeSnapGuides(compLeft, compTop, dims.width, dims.height);
      setSnapGuides(guides);
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

  const effectiveCanvasWidth = simulationMode && simulationDevice ? simulationDevice.width : CANVAS_WIDTH;
  const effectiveCanvasHeight = simulationMode && simulationDevice ? simulationDevice.height : CANVAS_HEIGHT;

  const gridBackground = simulationMode ? 'none' : `
    linear-gradient(to right, #E0E0E0 1px, transparent 1px),
    linear-gradient(to bottom, #E0E0E0 1px, transparent 1px)
  `;
  const gridSize = `${GRID_SIZE}px ${GRID_SIZE}px`;

  const snapGuideStyle = {
    position: 'absolute' as const,
    background: '#87CEEB',
    opacity: 0.6,
    pointerEvents: 'none' as const,
    zIndex: 9998,
  };

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
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '2px solid #000',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#FFFFFFCC',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'width 0.5s ease-in-out, height 0.5s ease-in-out',
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
            transition: simulationMode
              ? 'width 0.5s ease-in-out, height 0.5s ease-in-out, box-shadow 0.3s ease, border-radius 0.5s ease-in-out'
              : 'transform 0.1s ease, width 0.5s ease-in-out, height 0.5s ease-in-out, box-shadow 0.3s ease',
            boxShadow: isOver && canDrop ? '0 0 0 3px #2196F3' : '0 4px 24px rgba(0,0,0,0.3)',
            overflow: simulationMode ? 'auto' : 'visible',
            borderRadius: simulationMode ? 8 : 0,
          }}
        >
          {rootComponents.map(comp => (
            <CanvasComponent
              key={comp.id}
              component={comp}
              breakpointId={activeBreakpoint}
              simulationMode={simulationMode}
            />
          ))}

          {snapGuides.left !== undefined && (
            <div style={{
              ...snapGuideStyle,
              left: snapGuides.left,
              top: 0,
              width: 2,
              height: '100%',
              borderLeft: '1px dashed #87CEEB',
              background: 'transparent',
            }} />
          )}
          {snapGuides.right !== undefined && (
            <div style={{
              ...snapGuideStyle,
              left: snapGuides.right,
              top: 0,
              width: 2,
              height: '100%',
              borderLeft: '1px dashed #87CEEB',
              background: 'transparent',
            }} />
          )}
          {snapGuides.top !== undefined && (
            <div style={{
              ...snapGuideStyle,
              left: 0,
              top: snapGuides.top,
              width: '100%',
              height: 2,
              borderTop: '1px dashed #87CEEB',
              background: 'transparent',
            }} />
          )}
          {snapGuides.bottom !== undefined && (
            <div style={{
              ...snapGuideStyle,
              left: 0,
              top: snapGuides.bottom,
              width: '100%',
              height: 2,
              borderTop: '1px dashed #87CEEB',
              background: 'transparent',
            }} />
          )}

          {insertIndicator && isOver && (
            <>
              <div style={{
                position: 'absolute',
                left: Math.max(0, insertIndicator.x - 4),
                top: insertIndicator.y - 8,
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '8px solid #2196F3',
                pointerEvents: 'none',
                zIndex: 9999,
              }} />
              <div style={{
                position: 'absolute',
                left: insertIndicator.x,
                right: Math.max(0, effectiveCanvasWidth - (insertIndicator.x + insertIndicator.width)),
                top: insertIndicator.y - 1,
                height: 2,
                background: '#2196F3',
                pointerEvents: 'none',
                zIndex: 9999,
                boxShadow: '0 0 8px rgba(33,150,243,0.6)',
              }} />
              <div style={{
                position: 'absolute',
                left: Math.min(effectiveCanvasWidth - 8, insertIndicator.x + insertIndicator.width - 4),
                top: insertIndicator.y - 8,
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '8px solid #2196F3',
                pointerEvents: 'none',
                zIndex: 9999,
              }} />
            </>
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
      <DragThumbnail />
    </DndProvider>
  );
};
