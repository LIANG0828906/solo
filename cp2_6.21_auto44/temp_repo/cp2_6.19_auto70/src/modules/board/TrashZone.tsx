import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface TrashZoneProps {
  isDragging: boolean;
  onDrop: () => void;
}

export function TrashZone({ isDragging, onDrop }: TrashZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop();
  };

  if (!isDragging) return null;

  return (
    <div
      className={`trash-zone ${isDragOver ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`trash-icon ${isDragOver ? 'animate-pulseRed' : ''}`}>
        <Trash2 size={32} />
      </div>
      <span className="trash-text">拖拽到此处删除</span>
    </div>
  );
}
