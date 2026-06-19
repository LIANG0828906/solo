import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BoardElement } from '@/types';
import { ShapeRenderer } from './ShapeRenderer';
import { useBoardStore } from '@/stores/useBoardStore';

interface DraggableElementProps {
  element: BoardElement;
  isSelected: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  isSelected,
  canvasRef,
}) => {
  const { selectElement, moveElement } = useBoardStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const targetPosition = useRef({ x: element.x, y: element.y });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(element.id);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y,
      };
    }
  }, [element.id, element.x, element.y, selectElement, canvasRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let newX = e.clientX - rect.left - dragOffset.current.x;
    let newY = e.clientY - rect.top - dragOffset.current.y;

    newX = Math.max(0, Math.min(rect.width - element.width, newX));
    newY = Math.max(0, Math.min(rect.height - element.height, newY));

    targetPosition.current = { x: newX, y: newY };

    if (animationRef.current === null) {
      const animate = () => {
        const dx = targetPosition.current.x - element.x;
        const dy = targetPosition.current.y - element.y;
        
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          const interpolatedX = element.x + dx * 0.3;
          const interpolatedY = element.y + dy * 0.3;
          moveElement(element.id, interpolatedX, interpolatedY);
          animationRef.current = requestAnimationFrame(animate);
        } else {
          moveElement(element.id, targetPosition.current.x, targetPosition.current.y);
          animationRef.current = null;
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isDragging, element.id, element.x, element.y, element.width, element.height, moveElement, canvasRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <motion.div
      data-element-id={element.id}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `translate3d(${element.x}px, ${element.y}px, 0) rotate(${element.rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        willChange: 'transform',
        outline: isSelected ? '2px dashed #9C27B0' : 'none',
        outlineOffset: '2px',
        boxSizing: 'border-box',
      }}
      animate={{
        scale: isSelected ? 1 : 1,
      }}
      transition={{ duration: 0.1 }}
    >
      <ShapeRenderer element={element} />
    </motion.div>
  );
};
