import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePrototypeStore } from '../../stores/prototypeStore';
import { useDragDrop } from '../../hooks/useDragDrop';
import { useCanvasPan } from '../../hooks/useCanvasPan';
import { ContextMenu } from '../../components/ContextMenu';
import { ConnectionLine } from '../../components/ConnectionLine';
import { CommentBubble } from '../collab/CommentBubble';
import { getDefaultComponent } from '../../utils/helpers';
import type { Component, ContextMenuState, ComponentInteraction } from '../../types';

interface BoardCanvasProps {
  onComponentUpdate?: (id: string, updates: Record<string, unknown>) => void;
  onComponentSelect?: (id: string | null) => void;
}

export const BoardCanvas: React.FC<BoardCanvasProps> = ({
  onComponentUpdate,
  onComponentSelect,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    componentId: null,
  });
  const [isPulsing, setIsPulsing] = useState<string | null>(null);

  const {
    currentProjectId,
    currentScreenId,
    selectedComponentId,
    components,
    screens,
    connections,
    activeTool,
    connectingFromId,
    selectComponent,
    addComponent,
    updateComponent,
    deleteComponent,
    duplicateComponent,
    setComponentInteraction,
    addConnection,
    setActiveTool,
    setConnectingFromId,
  } = usePrototypeStore();

  const handleUpdate = useCallback(
    (id: string, updates: Record<string, number>) => {
      updateComponent(id, updates);
      onComponentUpdate?.(id, updates);
    },
    [updateComponent, onComponentUpdate]
  );

  const {
    isDragging,
    isResizing,
    draggingComponentId,
    resizingComponentId,
    handleDragStart,
    handleResizeStart,
    handleMouseMove: handleDragMouseMove,
    handleMouseUp: handleDragMouseUp,
  } = useDragDrop(handleUpdate);

  const {
    offset,
    scale,
    handleWheel,
    handleMouseMove: handlePanMouseMove,
    handleMouseUp: handlePanMouseUp,
  } = useCanvasPan();

  const currentComponents = components.filter(
    (c) => c.screenId === currentScreenId
  );

  const projectScreens = screens.filter(
    (s) => s.projectId === currentProjectId
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current) return;

      if (activeTool && activeTool !== 'connection' && currentScreenId) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;

        const newComponent = getDefaultComponent(
          activeTool,
          currentScreenId,
          Math.round(x - 60),
          Math.round(y - 30)
        );
        addComponent(newComponent);
        setActiveTool(null);
      } else {
        selectComponent(null);
        onComponentSelect?.(null);
      }
    },
    [activeTool, currentScreenId, offset, scale, addComponent, selectComponent, setActiveTool, onComponentSelect]
  );

  const handleComponentClick = useCallback(
    (e: React.MouseEvent, component: Component) => {
      e.stopPropagation();

      if (activeTool === 'connection') {
        if (connectingFromId) {
          const targetScreen = projectScreens.find(
            (s) => s.id === currentScreenId
          );
          if (targetScreen && connectingFromId !== component.id) {
            addConnection(connectingFromId, currentScreenId!);
          } else {
            setConnectingFromId(null);
            setActiveTool(null);
          }
        } else {
          setConnectingFromId(component.id);
        }
        return;
      }

      setIsPulsing(component.id);
      setTimeout(() => setIsPulsing(null), 100);
      selectComponent(component.id);
      onComponentSelect?.(component.id);
    },
    [activeTool, connectingFromId, currentScreenId, projectScreens, addConnection, setConnectingFromId, setActiveTool, selectComponent, onComponentSelect]
  );

  const handleComponentDoubleClick = useCallback(
    (e: React.MouseEvent, component: Component) => {
      e.stopPropagation();
      setActiveTool('connection');
      setConnectingFromId(component.id);
    },
    [setActiveTool, setConnectingFromId]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, componentId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        componentId,
      });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleDragMouseMove(e, offset);
      handlePanMouseMove(e);
    },
    [handleDragMouseMove, handlePanMouseMove, offset]
  );

  const handleMouseUp = useCallback(() => {
    handleDragMouseUp();
    handlePanMouseUp();
    setIsDraggingCanvas(false);
  }, [handleDragMouseUp, handlePanMouseUp]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || e.ctrlKey) {
        setIsDraggingCanvas(true);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleDelete = () => {
    if (contextMenu.componentId) {
      deleteComponent(contextMenu.componentId);
    }
  };

  const handleDuplicate = () => {
    if (contextMenu.componentId) {
      duplicateComponent(contextMenu.componentId);
    }
  };

  const handleSetInteraction = () => {
    if (contextMenu.componentId) {
      const component = components.find(
        (c) => c.id === contextMenu.componentId
      );
      if (component && projectScreens.length > 1) {
        const targetScreen = projectScreens.find(
          (s) => s.id !== component.screenId
        );
        if (targetScreen) {
          const interaction: ComponentInteraction = {
            type: 'navigate',
            targetScreenId: targetScreen.id,
          };
          setComponentInteraction(component.id, interaction);
        }
      }
    }
  };

  const renderComponent = (component: Component) => {
    const isSelected = selectedComponentId === component.id;
    const isConnectingSource = connectingFromId === component.id;
    const hasPulse = isPulsing === component.id;
    const isThisDragging = draggingComponentId === component.id;
    const isThisResizing = resizingComponentId === component.id;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: component.x,
      top: component.y,
      width: component.width,
      height: component.height,
      backgroundColor: component.backgroundColor,
      borderRadius: component.borderRadius,
      border: `1px solid ${isSelected ? '#6366F1' : component.borderColor}`,
      cursor: activeTool === 'connection' ? 'pointer' : 'move',
      transition: isThisDragging || isThisResizing
        ? 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
        : 'border-color 0.15s, box-shadow 0.15s, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow: isSelected
        ? '0 0 0 2px rgba(99, 102, 241, 0.3)'
        : 'none',
      transform: isThisDragging ? 'scale(1.05)' : hasPulse ? 'scale(1.02)' : 'scale(1)',
      zIndex: isSelected || isThisDragging ? 10 : 1,
    };

    return (
      <div
        key={component.id}
        style={baseStyle}
        className={`group hover:!border-[#6366F1] ${
          hasPulse ? 'animate-pulse' : ''
        } ${isConnectingSource ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        onClick={(e) => handleComponentClick(e, component)}
        onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
        onMouseDown={(e) => {
          if (activeTool !== 'connection') {
            handleDragStart(e, component.id, component.x, component.y);
          }
        }}
        onContextMenu={(e) => handleContextMenu(e, component.id)}
      >
        {component.type === 'text' && component.text && (
          <div
            className="w-full h-full flex items-center justify-center px-2 overflow-hidden"
            style={{
              fontSize: component.fontSize,
              fontWeight: component.fontWeight,
              color: '#1E293B',
            }}
          >
            {component.text}
          </div>
        )}

        {component.type === 'button' && (
          <div
            className="w-full h-full flex items-center justify-center text-white font-medium select-none"
            style={{
              fontSize: component.fontSize,
            }}
          >
            {component.text || '按钮'}
          </div>
        )}

        {component.type === 'image' && component.imageUrl && (
          <img
            src={component.imageUrl}
            alt=""
            className="w-full h-full object-cover rounded-inherit"
            draggable={false}
          />
        )}

        {isSelected && !isDragging && !isResizing && (
          <>
            <div
              className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full cursor-se-resize shadow"
              onMouseDown={(e) =>
                handleResizeStart(e, component.id, component.width, component.height)
              }
            />
            {component.interaction && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                ⚡
              </div>
            )}
          </>
        )}

        <CommentBubble componentId={component.id} />
      </div>
    );
  };

  const renderConnections = () => {
    return connections
      .filter((conn) => {
        const fromComponent = components.find(
          (c) => c.id === conn.fromComponentId
        );
        return fromComponent?.screenId === currentScreenId;
      })
      .map((conn) => {
        const fromComponent = components.find(
          (c) => c.id === conn.fromComponentId
        );
        const toScreen = screens.find((s) => s.id === conn.toScreenId);
        return (
          <ConnectionLine
            key={conn.id}
            connection={conn}
            fromComponent={fromComponent}
            toScreen={toScreen}
          />
        );
      });
  };

  const gridSize = 20;
  const gridStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(to right, #E2E8F0 1px, transparent 1px),
      linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundPosition: `${offset.x % gridSize}px ${offset.y % gridSize}px`,
  };

  return (
    <div
      ref={canvasRef}
      className={`flex-1 relative overflow-hidden ${
        isDraggingCanvas ? 'cursor-grabbing' : 'cursor-default'
      }`}
      style={gridStyle}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          {renderConnections()}
        </svg>

        <div className="absolute" style={{ minWidth: '2000px', minHeight: '2000px' }}>
          {currentComponents.map(renderComponent)}
        </div>
      </div>

      {connectingFromId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-pulse">
          <span className="animate-ping">⚡</span>
          点击目标屏幕或组件建立连线，按 Esc 取消
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow text-sm text-slate-600">
        {Math.round(scale * 100)}%
      </div>

      <ContextMenu
        state={contextMenu}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onSetInteraction={handleSetInteraction}
      />
    </div>
  );
};
