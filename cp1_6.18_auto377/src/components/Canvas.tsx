import React, { useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { CanvasManager } from '../modules/canvas/CanvasManager';
import CanvasElementView from './CanvasElement';
import type { LibraryItem } from '../types';

export const Canvas: React.FC = () => {
  const elements = useCanvasStore((s) => s.elements);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const containerRef = useRef<HTMLDivElement>(null);

  const onClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-container')) {
      CanvasManager.clearSelection();
    }
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data || !containerRef.current) return;
    try {
      const item: LibraryItem = JSON.parse(data);
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - item.defaultWidth / 2;
      const y = e.clientY - rect.top - item.defaultHeight / 2;
      CanvasManager.addElement(item, x, y);
    } catch {
      /* ignore */
    }
  };

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="canvas-area" onClick={onClick}>
      <div className="canvas-wrapper">
        <div
          ref={containerRef}
          id="canvas-container"
          className="canvas-container"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {sorted.map((el) => (
            <CanvasElementView
              key={el.id}
              element={el}
              selected={selectedIds.includes(el.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
