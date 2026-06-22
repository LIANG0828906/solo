import React, { useRef, useState, useEffect, useCallback } from 'react';
import CardItem from './CardItem';
import { CANVAS_WIDTH, CANVAS_HEIGHT, isInViewport, clamp } from './utils';
import type { Postcard } from './types';

interface CardWallProps {
  postcards: Postcard[];
  selectedId: string | null;
  zoomLevel: number;
  offsetX: number;
  offsetY: number;
  onCardClick: (id: string) => void;
  onViewChange: (offsetX: number, offsetY: number, zoomLevel: number) => void;
}

const CardWall: React.FC<CardWallProps> = function CardWall({
  postcards,
  selectedId,
  zoomLevel,
  offsetX,
  offsetY,
  onCardClick,
  onViewChange,
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startX: 0, startY: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        setViewportSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      startX: offsetX,
      startY: offsetY,
    });
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  }, [offsetX, offsetY]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const dx = (e.clientX - dragStart.x) / zoomLevel;
      const dy = (e.clientY - dragStart.y) / zoomLevel;
      const newOffsetX = dragStart.startX + dx;
      const newOffsetY = dragStart.startY + dy;
      onViewChange(newOffsetX, newOffsetY, zoomLevel);
      rafIdRef.current = null;
    });
  }, [isDragging, dragStart, zoomLevel, onViewChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoomLevel = clamp(zoomLevel + delta, 0.5, 2);
      
      if (containerRef.current && newZoomLevel !== zoomLevel) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = mouseX / zoomLevel - offsetX;
        const worldY = mouseY / zoomLevel - offsetY;
        
        const newOffsetX = mouseX / newZoomLevel - worldX;
        const newOffsetY = mouseY / newZoomLevel - worldY;
        
        onViewChange(newOffsetX, newOffsetY, newZoomLevel);
      }
      rafIdRef.current = null;
    });
  }, [zoomLevel, offsetX, offsetY, onViewChange]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleWheel]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#F5F0EB',
    cursor: isDragging ? 'grabbing' : 'grab',
    position: 'relative',
  };

  const canvasStyle: React.CSSProperties = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate3d(${offsetX * zoomLevel}px, ${offsetY * zoomLevel}px, 0) scale3d(${zoomLevel}, ${zoomLevel}, 1)`,
    transformOrigin: '0 0',
    transition: isDragging ? 'none' : 'transform 0.3s ease',
  };

  const visiblePostcards = postcards.filter((card) => {
    return isInViewport(
      card.x,
      card.y,
      card.width,
      card.height,
      offsetX,
      offsetY,
      zoomLevel,
      viewportSize.width,
      viewportSize.height,
    );
  });

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
    >
      <div style={canvasStyle}>
        {visiblePostcards.map((postcard) => (
          <CardItem
            key={postcard.id}
            postcard={postcard}
            selected={selectedId === postcard.id}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};

export default CardWall;
