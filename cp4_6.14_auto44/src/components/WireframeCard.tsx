import React, { useRef, useState, useEffect } from 'react';
import { WireframePage, WireframeElement } from '../types';
import { useStore } from '../store/useStore';
import { DraggableElement } from './DraggableElement';
import axios from 'axios';

interface WireframeCardProps {
  page: WireframePage;
}

export const WireframeCard: React.FC<WireframeCardProps> = ({ page }) => {
  const theme = useStore((state) => state.theme);
  const saveLayout = useStore((state) => state.saveLayout);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    elementId: string;
    startElX: number;
    startElY: number;
  } | null>(null);
  const [animatingElement, setAnimatingElement] = useState<string | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleDragStart = (elementId: string, e: React.MouseEvent, element: WireframeElement) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elementId,
      startElX: element.x,
      startElY: element.y,
    };
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStateRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStateRef.current.startX;
    const deltaY = e.clientY - dragStateRef.current.startY;

    let newX = dragStateRef.current.startElX + (deltaX / rect.width) * 100;
    let newY = dragStateRef.current.startElY + (deltaY / rect.height) * 100;

    const element = page.elements.find((el) => el.id === dragStateRef.current!.elementId);
    if (!element) return;

    const maxX = 100 - element.width;
    const maxY = 100 - element.height;
    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(0, Math.min(maxY, newY));

    newX = Math.round(newX / 4) * 4;
    newY = Math.round(newY / 4) * 4;

    saveLayout(
      page.id,
      page.elements.map((el) =>
        el.id === dragStateRef.current!.elementId ? { ...el, x: newX, y: newY } : el
      )
    );
  };

  const handleDragEnd = () => {
    if (isDragging && dragStateRef.current) {
      setAnimatingElement(dragStateRef.current.elementId);
      setTimeout(() => setAnimatingElement(null), 150);
      
      const element = page.elements.find((el) => el.id === dragStateRef.current!.elementId);
      if (element) {
        axios.post('http://localhost:3001/api/save-layout', {
          pageId: page.id,
          elements: page.elements,
        }).catch(() => {});
      }
    }
    setIsDragging(false);
    dragStateRef.current = null;
  };

  const renderElement = (element: WireframeElement) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}%`,
      top: `${element.y}%`,
      width: `${element.width}%`,
      height: `${element.height}%`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      userSelect: 'none',
      cursor: 'grab',
      transition: animatingElement === element.id 
        ? 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' 
        : 'none',
      transform: animatingElement === element.id ? 'scale(1.05)' : 'scale(1)',
    };

    const commonProps = {
      onMouseDown: (e: React.MouseEvent) => handleDragStart(element.id, e, element),
    };

    switch (element.type) {
      case 'button':
        return (
          <div
            key={element.id}
            {...commonProps}
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
            key={element.id}
            {...commonProps}
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
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: theme.colors.cardBg,
              borderBottom: `2px solid ${theme.colors.border}`,
              borderRadius: 0,
              fontWeight: 600,
              cursor: 'default',
            }}
          >
            {element.label}
          </div>
        );
      case 'title':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: '18px',
              fontWeight: 700,
              color: theme.colors.text,
              justifyContent: 'flex-start',
              cursor: 'default',
            }}
          >
            {element.label}
          </div>
        );
      case 'text':
      default:
        return (
          <div
            key={element.id}
            {...commonProps}
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
    <div
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: theme.colors.cardBg,
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 6px 25px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: theme.colors.text,
          }}
        >
          {page.title}
        </h3>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            backgroundColor: theme.colors.secondary,
            color: theme.colors.text,
            borderRadius: '4px',
            textTransform: 'capitalize',
          }}
        >
          {page.type}
        </span>
      </div>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: '350px',
          backgroundColor: '#e2e8f0',
          overflow: 'hidden',
        }}
      >
        {page.elements.map(renderElement)}
      </div>
    </div>
  );
};
