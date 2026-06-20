import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useDrop } from 'react-dnd';
import {
  LayoutState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DRAG_TYPES,
  MaterialDragItem,
} from '../types';
import { LayoutManager } from '../layout/LayoutManager';
import { CanvasElement } from './CanvasElement';

interface CanvasProps {
  layoutManager: LayoutManager;
  backgroundColor: string;
  onDropMaterial: (elementType: MaterialDragItem['elementType'], x: number, y: number) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export const Canvas: React.FC<CanvasProps> = memo(
  ({ layoutManager, backgroundColor, onDropMaterial, canvasRef }) => {
    const [state, setState] = useState<LayoutState>(layoutManager.getState());
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
      return layoutManager.subscribe((s) => {
        setState(s);
      });
    }, [layoutManager]);

    const updateCanvasRect = useCallback(() => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasRect(rect);
        const container = containerRef.current;
        if (container) {
          const containerWidth = container.clientWidth - 40;
          const containerHeight = container.clientHeight - 40;
          const s = Math.min(containerWidth / CANVAS_WIDTH, containerHeight / CANVAS_HEIGHT, 1);
          setScale(s);
        }
      }
    }, [canvasRef]);

    useEffect(() => {
      updateCanvasRect();
      window.addEventListener('resize', updateCanvasRect);
      return () => window.removeEventListener('resize', updateCanvasRect);
    }, [updateCanvasRect]);

    const [{ isOver }, drop] = useDrop<MaterialDragItem, void, { isOver: boolean }>(
      () => ({
        accept: DRAG_TYPES.MATERIAL,
        drop: (item, monitor) => {
          const offset = monitor.getClientOffset();
          if (!offset || !canvasRect) return;
          const x = (offset.x - canvasRect.left) / scale;
          const y = (offset.y - canvasRect.top) / scale;
          onDropMaterial(item.elementType, x, y);
        },
        collect: (monitor) => ({
          isOver: monitor.isOver(),
        }),
      }),
      [canvasRect, scale, onDropMaterial]
    );

    const setRefs = (node: HTMLDivElement) => {
      drop(node);
      if (typeof canvasRef === 'function') {
        canvasRef(node);
      } else if (canvasRef && 'current' in canvasRef) {
        (canvasRef as React.MutableRefObject<HTMLDivElement>).current = node;
      }
      updateCanvasRect();
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas === 'true') {
        layoutManager.selectElement(null);
      }
    };

    const sortedElements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);

    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minWidth: 0,
          background: '#E8ECF0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: CANVAS_WIDTH * scale,
            height: CANVAS_HEIGHT * scale,
            transformOrigin: 'top left',
          }}
        >
          <div
            ref={setRefs}
            data-canvas="true"
            onClick={handleCanvasClick}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              background: backgroundColor,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              boxShadow: `inset 0 0 10px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.1)`,
              overflow: 'hidden',
              cursor: isOver ? 'copy' : 'default',
              outline: isOver ? '2px dashed #4A6B8C' : 'none',
              outlineOffset: '-4px',
            }}
          >
            {sortedElements.map((el) => (
              <CanvasElement
                key={el.id}
                element={el}
                isSelected={el.id === state.selectedId}
                layoutManager={layoutManager}
                canvasRect={canvasRect}
                scale={scale}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';
