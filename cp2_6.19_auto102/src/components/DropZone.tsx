import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DropZoneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const DropZone: React.FC<DropZoneProps> = ({ id, children, className, style }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        ...style,
        outline: isOver ? '2px dashed #00d2ff' : undefined,
        outlineOffset: '-2px',
      }}
    >
      {children}
    </div>
  );
};

export default DropZone;
