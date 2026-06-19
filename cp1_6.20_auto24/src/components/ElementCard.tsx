import React, { useState, useRef } from 'react';
import { ElementInfo } from '../utils/recipes';

interface ElementCardProps {
  element: ElementInfo;
  onDragStart: (e: React.DragEvent, element: ElementInfo) => void;
  onDragEnd: () => void;
}

export const ElementCard: React.FC<ElementCardProps> = ({
  element,
  onDragStart,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', element.type);
    onDragStart(e, element);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`element-card ${isDragging ? 'dragging' : ''}`}
      style={{
        '--element-color': element.color,
        '--element-glow': element.glowColor,
      } as React.CSSProperties}
    >
      <div className="card-glow" />
      <div className="card-content">
        <span className="element-icon">{element.icon}</span>
        <span className="element-name">{element.name}元素</span>
      </div>
    </div>
  );
};
