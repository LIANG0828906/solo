import { useState, useRef } from 'react';
import type { Frame } from '../../types';

interface FrameThumbnailProps {
  frames: Frame[];
  currentFrameId: string | null;
  newFrameIds: Set<string>;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function FrameThumbnail({
  frames,
  currentFrameId,
  newFrameIds,
  collapsed,
  onSelect,
  onDelete,
  onReorder,
}: FrameThumbnailProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragOverTimer = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    if (dragOverTimer.current) {
      window.clearTimeout(dragOverTimer.current);
    }
    dragOverTimer.current = window.setTimeout(() => {
      setDragOverIndex(null);
    }, 50);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = draggingIndex;
    if (fromIndex !== null && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="thumbnail-list">
      {frames.map((frame, index) => (
        <div
          key={frame.id}
          className={`thumbnail-item ${
            currentFrameId === frame.id ? 'selected' : ''
          } ${draggingIndex === index ? 'dragging' : ''} ${
            dragOverIndex === index && draggingIndex !== index ? 'drag-over' : ''
          } ${newFrameIds.has(frame.id) ? 'animating-in' : ''}`}
          draggable
          onClick={() => onSelect(frame.id)}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <canvas className="thumbnail-canvas" width={160} height={90} />
          <span className="thumbnail-label">{frame.index}</span>
          {!collapsed && (
            <button
              className="thumbnail-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(frame.id);
              }}
              title="删除帧"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
