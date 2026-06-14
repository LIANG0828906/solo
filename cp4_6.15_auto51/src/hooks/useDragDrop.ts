import { useState, useCallback, useRef, useEffect } from 'react';
import type { DragState, CardType, PileType } from '../types';

const initialDragState: DragState = {
  isDragging: false,
  draggedCards: [],
  sourceType: null,
  sourceIndex: -1,
  sourceColumn: -1,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  currentX: 0,
  currentY: 0,
  velocityX: 0,
  velocityY: 0,
};

export const useDragDrop = (
  onDrop: (
    cards: CardType[],
    sourceType: PileType,
    sourceIndex: number,
    sourceColumn: number,
    targetType: PileType,
    targetIndex: number,
    targetColumn: number
  ) => boolean,
  isEnabled: boolean = true
) => {
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const [dropTarget, setDropTarget] = useState<{ type: PileType; column: number } | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const animateSpringBack = useCallback(() => {
    let startX = dragState.currentX;
    let startY = dragState.currentY;
    const targetX = dragState.startX;
    const targetY = dragState.startY;
    const startTime = performance.now();
    const duration = 250;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentX = startX + (targetX - startX) * easeOut;
      const currentY = startY + (targetY - startY) * easeOut;

      setDragState(prev => ({
        ...prev,
        currentX,
        currentY,
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDragState(initialDragState);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [dragState.currentX, dragState.currentY, dragState.startX, dragState.startY]);

  const handleDragStart = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    cards: CardType[],
    sourceType: PileType,
    sourceIndex: number,
    sourceColumn: number
  ) => {
    if (!isEnabled || cards.length === 0 || !cards[0].faceUp) return;

    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    lastMoveRef.current = { x: clientX, y: clientY, time: Date.now() };

    setDragState({
      isDragging: true,
      draggedCards: cards,
      sourceType,
      sourceIndex,
      sourceColumn,
      startX: rect.left,
      startY: rect.top,
      offsetX,
      offsetY,
      currentX: clientX - offsetX,
      currentY: clientY - offsetY,
      velocityX: 0,
      velocityY: 0,
    });
  }, [isEnabled]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging) return;

    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const now = Date.now();
    let velocityX = 0;
    let velocityY = 0;

    if (lastMoveRef.current) {
      const dt = now - lastMoveRef.current.time;
      if (dt > 0) {
        velocityX = (clientX - lastMoveRef.current.x) / dt;
        velocityY = (clientY - lastMoveRef.current.y) / dt;
      }
    }
    lastMoveRef.current = { x: clientX, y: clientY, time: now };

    setDragState(prev => ({
      ...prev,
      currentX: clientX - prev.offsetX,
      currentY: clientY - prev.offsetY,
      velocityX,
      velocityY,
    }));

    const element = document.elementFromPoint(clientX, clientY);
    if (element) {
      const pileType = element.closest('[data-pile-type]')?.getAttribute('data-pile-type') as PileType | null;
      const pileColumn = parseInt(element.closest('[data-pile-column]')?.getAttribute('data-pile-column') || '-1', 10);
      
      if (pileType && pileColumn >= 0) {
        setDropTarget({ type: pileType, column: pileColumn });
      } else {
        setDropTarget(null);
      }
    }
  }, [dragState.isDragging]);

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging) return;

    e.preventDefault();

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

    const element = document.elementFromPoint(clientX, clientY);
    let success = false;

    if (element && dropTarget) {
      const targetType = dropTarget.type;
      const targetColumn = dropTarget.column;

      success = onDrop(
        dragState.draggedCards,
        dragState.sourceType!,
        dragState.sourceIndex,
        dragState.sourceColumn,
        targetType,
        targetColumn,
        targetColumn
      );
    }

    if (!success) {
      animateSpringBack();
    } else {
      setDragState(initialDragState);
    }

    setDropTarget(null);
    lastMoveRef.current = null;
  }, [dragState, dropTarget, onDrop, animateSpringBack]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('touchcancel', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    dragState,
    dropTarget,
    handleDragStart,
  };
};
