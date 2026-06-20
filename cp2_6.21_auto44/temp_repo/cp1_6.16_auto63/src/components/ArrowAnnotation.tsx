import React, { useState, useRef, useEffect } from 'react';
import './ArrowAnnotation.css';

export interface ArrowAnnotationData {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  text: string;
}

interface ArrowAnnotationProps {
  arrow: ArrowAnnotationData;
  scale: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ArrowAnnotationData>) => void;
  onDelete: (id: string) => void;
}

const ArrowAnnotation: React.FC<ArrowAnnotationProps> = ({
  arrow,
  scale,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [dragTarget, setDragTarget] = useState<'start' | 'end' | 'move' | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, endX: 0, endY: 0 });

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  const getAngle = () => {
    const dx = arrow.endX - arrow.startX;
    const dy = arrow.endY - arrow.startY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getMidPoint = () => {
    return {
      x: (arrow.startX + arrow.endX) / 2,
      y: (arrow.startY + arrow.endY) / 2,
    };
  };

  const handleLineMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(arrow.id);
    setDragTarget('move');
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: arrow.startX,
      startY: arrow.startY,
      endX: arrow.endX,
      endY: arrow.endY,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;
      onUpdate(arrow.id, {
        startX: dragStartRef.current.startX + dx,
        startY: dragStartRef.current.startY + dy,
        endX: dragStartRef.current.endX + dx,
        endY: dragStartRef.current.endY + dy,
      });
    };

    const handleMouseUp = () => {
      setDragTarget(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleStartPointMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(arrow.id);
    setDragTarget('start');
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: arrow.startX,
      startY: arrow.startY,
      endX: arrow.endX,
      endY: arrow.endY,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;
      onUpdate(arrow.id, {
        startX: dragStartRef.current.startX + dx,
        startY: dragStartRef.current.startY + dy,
      });
    };

    const handleMouseUp = () => {
      setDragTarget(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleEndPointMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(arrow.id);
    setDragTarget('end');
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: arrow.startX,
      startY: arrow.startY,
      endX: arrow.endX,
      endY: arrow.endY,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;
      onUpdate(arrow.id, {
        endX: dragStartRef.current.endX + dx,
        endY: dragStartRef.current.endY + dy,
      });
    };

    const handleMouseUp = () => {
      setDragTarget(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(arrow.id);
    setIsEditing(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(arrow.id, { text: e.target.value });
  };

  const handleTextBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
    e.stopPropagation();
  };

  const handleDelete = () => {
    onDelete(arrow.id);
  };

  const midPoint = getMidPoint();
  const angle = getAngle();

  const textOffsetAngle = angle + 90;
  const textOffsetDistance = 30;
  const textX = midPoint.x + Math.cos((textOffsetAngle * Math.PI) / 180) * textOffsetDistance;
  const textY = midPoint.y + Math.sin((textOffsetAngle * Math.PI) / 180) * textOffsetDistance;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {isSelected && (
        <line
          x1={arrow.startX}
          y1={arrow.startY}
          x2={arrow.endX}
          y2={arrow.endY}
          stroke="#607D8B"
          strokeWidth={4 / scale}
          strokeDasharray={`${8 / scale} ${6 / scale}`}
          className="selection-line"
          style={{ pointerEvents: 'none' }}
        />
      )}

      <line
        x1={arrow.startX}
        y1={arrow.startY}
        x2={arrow.endX}
        y2={arrow.endY}
        stroke={arrow.color}
        strokeWidth={2 / scale}
        strokeLinecap="round"
        style={{ cursor: 'move', pointerEvents: 'stroke' }}
        onMouseDown={handleLineMouseDown}
      />

      <circle
        cx={arrow.startX}
        cy={arrow.startY}
        r={4 / scale}
        fill={arrow.color}
        style={{ cursor: dragTarget === 'start' ? 'grabbing' : 'grab', pointerEvents: 'auto' }}
        onMouseDown={handleStartPointMouseDown}
      />

      <polygon
        points={getArrowPoints(arrow.endX, arrow.endY, angle, scale)}
        fill={arrow.color}
        style={{ cursor: dragTarget === 'end' ? 'grabbing' : 'grab', pointerEvents: 'auto' }}
        onMouseDown={handleEndPointMouseDown}
      />

      {isSelected && (
        <foreignObject
          x={textX - 60}
          y={textY - 20}
          width={120}
          height={40}
          style={{ overflow: 'visible', pointerEvents: 'auto' }}
        >
          <div
            className="annotation-text-wrapper"
            style={{
              transform: `rotate(${-angle}deg)`,
              transformOrigin: 'center center',
            }}
            onClick={handleTextClick}
          >
            {isEditing ? (
              <textarea
                ref={textRef}
                className="annotation-textarea"
                value={arrow.text}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
                onKeyDown={handleKeyDown}
                placeholder="输入批注..."
                autoFocus
              />
            ) : (
              <div className="annotation-text" onClick={handleTextClick}>
                {arrow.text || '点击添加批注...'}
              </div>
            )}
            {isSelected && !isEditing && (
              <button className="annotation-delete" onClick={handleDelete}>
                ×
              </button>
            )}
          </div>
        </foreignObject>
      )}

      {!isSelected && arrow.text && (
        <foreignObject
          x={textX - 60}
          y={textY - 20}
          width={120}
          height={40}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div
            className="annotation-text-wrapper"
            style={{
              transform: `rotate(${-angle}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <div className="annotation-text preview">{arrow.text}</div>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

function getArrowPoints(endX: number, endY: number, angle: number, scale: number) {
  const arrowSize = 10 / scale;
  const angleRad = (angle * Math.PI) / 180;
  const p1x = endX;
  const p1y = endY;
  const p2x = endX - arrowSize * Math.cos(angleRad - Math.PI / 6);
  const p2y = endY - arrowSize * Math.sin(angleRad - Math.PI / 6);
  const p3x = endX - arrowSize * Math.cos(angleRad + Math.PI / 6);
  const p3y = endY - arrowSize * Math.sin(angleRad + Math.PI / 6);
  return `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`;
}

export default ArrowAnnotation;
