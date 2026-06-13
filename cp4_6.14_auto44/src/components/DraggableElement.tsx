import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WireframeElement } from '../types';
import { useStore } from '../store/useStore';

interface DraggableElementProps {
  element: WireframeElement;
  pageId: string;
  containerWidth: number;
  containerHeight: number;
  allElements: WireframeElement[];
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

interface GuideLines {
  vertical: number | null;
  horizontal: number | null;
}

const SNAP_GRID = 4;
const GUIDE_THRESHOLD = 8;

export const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  pageId,
  containerWidth,
  containerHeight,
  allElements,
  onDragStart,
  onDragEnd,
}) => {
  const theme = useStore((state) => state.theme);
  const updateElementPosition = useStore((state) => state.updateElementPosition);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [guideLines, setGuideLines] = useState<GuideLines>({ vertical: null, horizontal: null });
  
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number; elementX: number; elementY: number } | null>(null);
  const animationFrame = useRef<number | null>(null);

  const snapToGrid = (value: number): number => {
    return Math.round(value / SNAP_GRID) * SNAP_GRID;
  };

  const findGuideLines = useCallback(
    (newX: number, newY: number, currentId: string): GuideLines => {
      let verticalGuide: number | null = null;
      let horizontalGuide: number | null = null;

      const elementCenterX = newX + element.width / 2;
      const elementCenterY = newY + element.height / 2;
      const elementRight = newX + element.width;
      const elementBottom = newY + element.height;

      for (const other of allElements) {
        if (other.id === currentId) continue;

        const otherCenterX = other.x + other.width / 2;
        const otherCenterY = other.y + other.height / 2;

        if (Math.abs(newX - other.x) < GUIDE_THRESHOLD) verticalGuide = other.x;
        else if (Math.abs(elementCenterX - otherCenterX) < GUIDE_THRESHOLD) verticalGuide = otherCenterX;
        else if (Math.abs(elementRight - (other.x + other.width)) < GUIDE_THRESHOLD) verticalGuide = other.x + other.width;

        if (Math.abs(newY - other.y) < GUIDE_THRESHOLD) horizontalGuide = other.y;
        else if (Math.abs(elementCenterY - otherCenterY) < GUIDE_THRESHOLD) horizontalGuide = otherCenterY;
        else if (Math.abs(elementBottom - (other.y + other.height)) < GUIDE_THRESHOLD) horizontalGuide = other.y + other.height;
      }

      if (Math.abs(newX) < GUIDE_THRESHOLD) verticalGuide = 0;
      if (Math.abs(newY) < GUIDE_THRESHOLD) horizontalGuide = 0;

      return { vertical: verticalGuide, horizontal: horizontalGuide };
    },
    [allElements, element.width, element.height]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = elementRef.current?.getBoundingClientRect();
      if (!rect) return;

      setIsDragging(true);
      onDragStart?.();

      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        elementX: element.x,
        elementY: element.y,
      };
    },
    [element.x, element.y, onDragStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStartPos.current) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      let newX = dragStartPos.current.elementX + (deltaX / containerWidth) * 100;
      let newY = dragStartPos.current.elementY + (deltaY / containerHeight) * 100;

      const maxX = 100 - element.width;
      const maxY = 100 - element.height;

      newX = Math.max(0, Math.min(maxX, newX));
      newY = Math.max(0, Math.min(maxY, newY));

      newX = snapToGrid(newX);
      newY = snapToGrid(newY);

      const guides = findGuideLines(newX, newY, element.id);
      setGuideLines(guides);

      if (guides.vertical !== null) {
        newX = snapToGrid(guides.vertical);
      }
      if (guides.horizontal !== null) {
        newY = snapToGrid(guides.horizontal);
      }

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      animationFrame.current = requestAnimationFrame(() => {
        updateElementPosition(pageId, element.id, newX, newY);
      });
    },
    [isDragging, containerWidth, containerHeight, element, pageId, findGuideLines, updateElementPosition]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    setGuideLines({ vertical: null, horizontal: null });
    dragStartPos.current = null;

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 150);

    onDragEnd?.();
  }, [isDragging, onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const renderElementContent = () => {
    const baseStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      userSelect: 'none',
      cursor: isDragging ? 'grabbing' : 'grab',
    };

    switch (element.type) {
      case 'button':
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {element.label}
          </div>
        );
      case 'input':
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: '#ffffff',
              border: `2px solid ${theme.colors.border}`,
              color: theme.colors.text,
              justifyContent: 'flex-start',
              paddingLeft: '12px',
            }}
          >
            {element.label}
          </div>
        );
      case 'nav':
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: theme.colors.cardBg,
              borderBottom: `2px solid ${theme.colors.border}`,
              borderRadius: 0,
              fontWeight: 600,
            }}
          >
            {element.label}
          </div>
        );
      case 'title':
        return (
          <div
            style={{
              ...baseStyle,
              fontSize: '18px',
              fontWeight: 700,
              color: theme.colors.text,
              justifyContent: 'flex-start',
            }}
          >
            {element.label}
          </div>
        );
      case 'text':
      default:
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: theme.colors.secondary,
              color: theme.colors.text,
            }}
          >
            {element.label}
          </div>
        );
    }
  };

  return (
    <>
      {guideLines.vertical !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${guideLines.vertical}%`,
            top: 0,
            width: '1px',
            height: '100%',
            borderLeft: '1px dashed #3b82f6',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />
      )}
      {guideLines.horizontal !== null && (
        <div
          style={{
            position: 'absolute',
            top: `${guideLines.horizontal}%`,
            left: 0,
            width: '100%',
            height: '1px',
            borderTop: '1px dashed #3b82f6',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />
      )}
      <div
        ref={elementRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: `${element.x}%`,
          top: `${element.y}%`,
          width: `${element.width}%`,
          height: `${element.height}%`,
          transform: isBouncing ? 'scale(1.03)' : 'scale(1)',
          transition: isBouncing ? 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          zIndex: isDragging ? 10 : 1,
          boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        {renderElementContent()}
      </div>
    </>
  );
};
