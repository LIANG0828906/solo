import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { ChartComponent } from './ChartComponent';
import type { Component as EditorComponent, TextData, ShapeData } from '../types';
import { syncColumnWidthOnResize, findTwoColumnPair } from '../utils/twoColumnUtils';

interface EditorCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ canvasRef }) => {
  const {
    components,
    selectedId,
    theme,
    zoom,
    pan,
    selectComponent,
    updateComponent,
    setZoom,
    setPan,
    isThemeTransition,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [componentStart, setComponentStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 750;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftPressed(true);
      if (e.key === ' ') {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftPressed(false);
      if (e.key === ' ') setSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  }, [zoom, setZoom]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || spacePressed) {
      e.preventDefault();
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if ((e.target as HTMLElement).closest('[data-component]') === null) {
      selectComponent(null);
    }
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDragging && dragId) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      updateComponent(dragId, {
        x: componentStart.x + dx,
        y: componentStart.y + dy,
      }, false);
    }

    if (isResizing && dragId && resizeHandle) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;

      let newWidth = componentStart.width;
      let newHeight = componentStart.height;
      let newX = componentStart.x;
      let newY = componentStart.y;

      if (resizeHandle.includes('e')) {
        newWidth = Math.max(50, componentStart.width + dx);
      }
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(50, componentStart.width - dx);
        newX = componentStart.x + dx;
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(50, componentStart.height + dy);
      }
      if (resizeHandle.includes('n')) {
        newHeight = Math.max(50, componentStart.height - dy);
        newY = componentStart.y + dy;
      }

      const state = useEditorStore.getState();
      const updatedComponents = syncColumnWidthOnResize(
        state.components,
        dragId,
        newWidth,
        shiftPressed
      );

      if (shiftPressed && findTwoColumnPair(state.components, dragId)) {
        useEditorStore.setState({ components: updatedComponents });
      } else {
        updateComponent(dragId, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        }, false);
      }
    }
  }, [isPanning, isDragging, isResizing, dragId, resizeHandle, dragStart, componentStart, zoom, pan, shiftPressed, updateComponent, setPan]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setDragId(null);
      setResizeHandle(null);
      if (dragId) {
        useEditorStore.getState().recordAction();
      }
    }
  }, [isPanning, isDragging, isResizing, dragId]);

  const handleComponentMouseDown = (e: React.MouseEvent, comp: EditorComponent) => {
    e.stopPropagation();
    if (isPanning) return;

    selectComponent(comp.id);
    setIsDragging(true);
    setDragId(comp.id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setComponentStart({ x: comp.x, y: comp.y, width: comp.width, height: comp.height });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, comp: EditorComponent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setDragId(comp.id);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setComponentStart({ x: comp.x, y: comp.y, width: comp.width, height: comp.height });
  };

  const renderComponentContent = (comp: EditorComponent) => {
    const transitionStyle = isThemeTransition
      ? { transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, fill 0.3s ease, stroke 0.3s ease' }
      : {};

    if (comp.type === 'text') {
      const data = comp.data as TextData;
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: '16px',
            boxSizing: 'border-box',
            backgroundColor: comp.style.fillColor || 'transparent',
            border: comp.style.strokeWidth
              ? `${comp.style.strokeWidth}px solid ${comp.style.strokeColor || 'transparent'}`
              : 'none',
            borderRadius: comp.borderRadius,
            color: comp.style.textColor || '#333',
            fontSize: comp.style.fontSize || 14,
            fontFamily: comp.style.fontFamily || 'system-ui',
            fontWeight: comp.style.fontWeight || 'normal',
            textAlign: (data?.textAlign as any) || 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: 'center',
            justifyContent: (data?.textAlign as any) || 'left',
            ...transitionStyle,
          }}
        >
          {data?.content || '文本内容'}
        </div>
      );
    }

    if (comp.type === 'image') {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: comp.style.fillColor || '#f0f0f0',
            border: comp.style.strokeWidth
              ? `${comp.style.strokeWidth}px solid ${comp.style.strokeColor || 'transparent'}`
              : 'none',
            borderRadius: comp.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: 14,
            ...transitionStyle,
          }}
        >
          图片占位符
        </div>
      );
    }

    if (comp.type === 'chart') {
      const data = comp.data as any;
      return (
        <div style={{ width: '100%', height: '100%', ...transitionStyle }}>
          <ChartComponent
            chartData={data}
            width={comp.width}
            height={comp.height}
            colors={theme.colors}
          />
        </div>
      );
    }

    if (comp.type === 'shape') {
      const data = comp.data as ShapeData;
      if (data.shapeType === 'rectangle') {
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: comp.style.fillColor || '#ccc',
              border: comp.style.strokeWidth
                ? `${comp.style.strokeWidth}px solid ${comp.style.strokeColor || 'transparent'}`
                : 'none',
              borderRadius: comp.borderRadius,
              ...transitionStyle,
            }}
          />
        );
      }
      if (data.shapeType === 'circle') {
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: comp.style.fillColor || '#ccc',
              border: comp.style.strokeWidth
                ? `${comp.style.strokeWidth}px solid ${comp.style.strokeColor || 'transparent'}`
                : 'none',
              borderRadius: '50%',
              ...transitionStyle,
            }}
          />
        );
      }
      if (data.shapeType === 'line') {
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: comp.style.fillColor || '#ccc',
              borderRadius: comp.borderRadius,
              ...transitionStyle,
            }}
          />
        );
      }
    }

    return null;
  };

  const renderResizeHandles = (comp: EditorComponent) => {
    if (selectedId !== comp.id) return null;

    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    const handleSize = 10;

    return handles.map((handle) => {
      const position: React.CSSProperties = {};
      if (handle.includes('n')) position.top = -handleSize / 2;
      if (handle.includes('s')) position.bottom = -handleSize / 2;
      if (handle.includes('w')) position.left = -handleSize / 2;
      if (handle.includes('e')) position.right = -handleSize / 2;
      if (handle === 'n' || handle === 's') position.left = '50%';
      if (handle === 'w' || handle === 'e') position.top = '50%';
      if (handle === 'n' || handle === 's') position.marginLeft = -handleSize / 2;
      if (handle === 'w' || handle === 'e') position.marginTop = -handleSize / 2;

      const cursor = handle.length === 2 ? `${handle}-resize` : `${handle}-resize`;

      return (
        <div
          key={handle}
          onMouseDown={(e) => handleResizeMouseDown(e, comp, handle)}
          style={{
            position: 'absolute',
            width: handleSize,
            height: handleSize,
            backgroundColor: '#fff',
            border: '2px solid #2196f3',
            borderRadius: 2,
            cursor,
            zIndex: 10,
            ...position,
          }}
        />
      );
    });
  };

  const renderSelectionIndicator = (comp: EditorComponent) => {
    if (selectedId !== comp.id) return null;

    return (
      <div
        style={{
          position: 'absolute',
          inset: -4,
          border: '2px dashed #2196f3',
          borderRadius: comp.borderRadius + 4,
          pointerEvents: 'none',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
        }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#f5f7fa',
        cursor: isPanning ? 'grabbing' : spacePressed ? 'grab' : 'default',
        position: 'relative',
      }}
    >
      <div
        ref={canvasRef}
        id="editor-canvas"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
          transformOrigin: 'center center',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {components.map((comp) => (
          <div
            key={comp.id}
            data-component="true"
            data-component-id={comp.id}
            onMouseDown={(e) => handleComponentMouseDown(e, comp)}
            style={{
              position: 'absolute',
              left: comp.x,
              top: comp.y,
              width: comp.width,
              height: comp.height,
              transform: `rotate(${comp.rotation}deg)`,
              opacity: comp.opacity,
              cursor: isDragging && dragId === comp.id ? 'grabbing' : 'grab',
              zIndex: selectedId === comp.id ? 100 : 1,
              userSelect: 'none',
            }}
          >
            {renderSelectionIndicator(comp)}
            {renderComponentContent(comp)}
            {renderResizeHandles(comp)}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 12,
          color: '#666',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        缩放: {Math.round(zoom * 100)}% | 滚轮缩放 | 空格拖拽平移
        {shiftPressed && ' | Shift已按下 (同步栏宽)'}
      </div>
    </div>
  );
};
