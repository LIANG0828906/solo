import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ArrowAnnotation as ArrowAnnotationType } from '../types';
import { AnnotationManager } from './AnnotationManager';
import styles from './ArrowAnnotation.module.css';

interface ArrowAnnotationProps {
  annotation: ArrowAnnotationType;
  isSelected: boolean;
  zoom: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ArrowAnnotationType>) => void;
  onDelete: (id: string) => void;
}

const annotationManager = new AnnotationManager();

export const ArrowAnnotation: React.FC<ArrowAnnotationProps> = ({
  annotation,
  isSelected,
  zoom,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'body' | 'start' | 'end' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const arrowPoints = annotationManager.getArrowPoints(annotation);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect(annotation.id);

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      const hit = annotationManager.getHitTest(annotation, x, y, 12 / zoom);
      if (hit) {
        setDragType(hit);
        setIsDragging(true);
        startPos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [annotation, onSelect, zoom]
  );

  useEffect(() => {
    if (!isDragging || !dragType) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const deltaX = (e.clientX - startPos.current.x) / zoom;
      const deltaY = (e.clientY - startPos.current.y) / zoom;

      if (dragType === 'body') {
        onUpdate(annotation.id, {
          startX: annotation.startX + deltaX,
          startY: annotation.startY + deltaY,
          endX: annotation.endX + deltaX,
          endY: annotation.endY + deltaY,
        });
      } else if (dragType === 'start') {
        onUpdate(annotation.id, {
          startX: annotation.startX + deltaX,
          startY: annotation.startY + deltaY,
        });
      } else if (dragType === 'end') {
        onUpdate(annotation.id, {
          endX: annotation.endX + deltaX,
          endY: annotation.endY + deltaY,
        });
      }

      startPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, annotation, zoom, onUpdate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
        onDelete(annotation.id);
      }
    },
    [isSelected, annotation.id, onDelete]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const minX = Math.min(annotation.startX, annotation.endX);
  const minY = Math.min(annotation.startY, annotation.endY);
  const maxX = Math.max(annotation.startX, annotation.endX);
  const maxY = Math.max(annotation.startY, annotation.endY);
  const padding = 20;

  const svgX = minX - padding;
  const svgY = minY - padding;
  const svgWidth = maxX - minX + padding * 2;
  const svgHeight = maxY - minY + padding * 2;

  const relStartX = annotation.startX - svgX;
  const relStartY = annotation.startY - svgY;
  const relEndX = annotation.endX - svgX;
  const relEndY = annotation.endY - svgY;
  const relArrowX1 = arrowPoints.x1 - svgX;
  const relArrowY1 = arrowPoints.y1 - svgY;
  const relArrowX2 = arrowPoints.x2 - svgX;
  const relArrowY2 = arrowPoints.y2 - svgY;

  return (
    <div
      className={`${styles.annotationWrapper} ${
        isSelected ? styles.selected : ''
      } ${isDragging ? styles.dragging : ''}`}
      style={{
        left: svgX,
        top: svgY,
        width: svgWidth,
        height: svgHeight,
        zIndex: annotation.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        className={styles.svg}
      >
        <line
          x1={relStartX}
          y1={relStartY}
          x2={relEndX}
          y2={relEndY}
          stroke={annotation.color}
          strokeWidth={annotation.lineWidth}
          strokeLinecap="round"
          className={styles.line}
        />
        <line
          x1={relEndX}
          y1={relEndY}
          x2={relArrowX1}
          y2={relArrowY1}
          stroke={annotation.color}
          strokeWidth={annotation.lineWidth}
          strokeLinecap="round"
        />
        <line
          x1={relEndX}
          y1={relEndY}
          x2={relArrowX2}
          y2={relArrowY2}
          stroke={annotation.color}
          strokeWidth={annotation.lineWidth}
          strokeLinecap="round"
        />

        {isSelected && (
          <>
            <circle
              cx={relStartX}
              cy={relStartY}
              r={6 / zoom}
              fill="#fff"
              stroke="#6c63ff"
              strokeWidth={2}
              className={styles.handle}
              style={{ cursor: 'move' }}
            />
            <circle
              cx={relEndX}
              cy={relEndY}
              r={6 / zoom}
              fill="#fff"
              stroke="#6c63ff"
              strokeWidth={2}
              className={styles.handle}
              style={{ cursor: 'move' }}
            />
          </>
        )}
      </svg>

      {isSelected && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(annotation.id);
          }}
          title="删除标注 (Delete)"
        >
          ✕
        </button>
      )}
    </div>
  );
};
