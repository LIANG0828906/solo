import { useState, useCallback, useRef, useEffect } from 'react';
import type { Card, CanvasState } from '../types/card';
import {
  MIN_SCALE,
  MAX_SCALE,
  SNAP_THRESHOLD,
  CARD_WIDTH,
  CARD_HEIGHT,
} from '../types/card';

export function useCanvasTransform() {
  const [transform, setTransform] = useState<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const isPanningRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  const transformRef = useRef(transform);
  transformRef.current = transform;

  const setTransformOptimized = useCallback((updates: Partial<CanvasState>) => {
    transformRef.current = { ...transformRef.current, ...updates };
    setTransform(transformRef.current);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, transformRef.current.scale + delta)
      );

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleDiff = newScale / transformRef.current.scale;

      const newOffsetX = mouseX - (mouseX - transformRef.current.offsetX) * scaleDiff;
      const newOffsetY = mouseY - (mouseY - transformRef.current.offsetY) * scaleDiff;

      setTransformOptimized({
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    } else if (!e.ctrlKey && !e.shiftKey === false) {
      e.preventDefault();
      setTransformOptimized({
        offsetX: transformRef.current.offsetX - e.deltaX,
        offsetY: transformRef.current.offsetY - e.deltaY,
      });
    }
  }, [setTransformOptimized]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanningRef.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanningRef.current) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        setTransformOptimized({
          offsetX: transformRef.current.offsetX + dx,
          offsetY: transformRef.current.offsetY + dy,
        });
        rafIdRef.current = null;
      });
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [setTransformOptimized]);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const resetTransform = useCallback(() => {
    setTransformOptimized({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [setTransformOptimized]);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - transformRef.current.offsetX) / transformRef.current.scale,
        y: (screenY - transformRef.current.offsetY) / transformRef.current.scale,
      };
    },
    []
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    transform,
    handleWheel,
    handleMouseDown,
    resetTransform,
    screenToWorld,
    isPanning: isPanningRef.current,
  };
}

interface UseDragAdoptionOptions {
  cardId: string;
  initialX: number;
  initialY: number;
  scale: number;
  onPositionChange: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  otherCards: Card[];
  enableSnap?: boolean;
}

export function useDragAdoption({
  cardId,
  initialX,
  initialY,
  scale,
  onPositionChange,
  onDragEnd,
  otherCards,
  enableSnap = true,
}: UseDragAdoptionOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentPos, setCurrentPos] = useState({ x: initialX, y: initialY });
  const dragStartRef = useRef({
    startMouseX: 0,
    startMouseY: 0,
    startCardX: initialX,
    startCardY: initialY,
    offsetX: 0,
    offsetY: 0,
  });
  const rafIdRef = useRef<number | null>(null);

  const findSnapTarget = useCallback(
    (x: number, y: number) => {
      if (!enableSnap) return null;

      for (const other of otherCards) {
        if (other.id === cardId) continue;

        const cardRight = x + CARD_WIDTH;
        const cardBottom = y + CARD_HEIGHT;
        const otherRight = other.x + CARD_WIDTH;
        const otherBottom = other.y + CARD_HEIGHT;

        const rightDist = Math.abs(cardRight - other.x);
        const leftDist = Math.abs(x - otherRight);
        const bottomDist = Math.abs(cardBottom - other.y);
        const topDist = Math.abs(y - otherBottom);

        if (rightDist < SNAP_THRESHOLD &&
            y + CARD_HEIGHT > other.y &&
            y < otherBottom) {
          return { x: other.x - CARD_WIDTH - 8, y };
        }
        if (leftDist < SNAP_THRESHOLD &&
            y + CARD_HEIGHT > other.y &&
            y < otherBottom) {
          return { x: otherRight + 8, y };
        }
        if (bottomDist < SNAP_THRESHOLD &&
            x + CARD_WIDTH > other.x &&
            x < otherRight) {
          return { x, y: other.y - CARD_HEIGHT - 8 };
        }
        if (topDist < SNAP_THRESHOLD &&
            x + CARD_WIDTH > other.x &&
            x < otherRight) {
          return { x, y: otherBottom + 8 };
        }
      }
      return null;
    },
    [cardId, otherCards, enableSnap]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      dragStartRef.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startCardX: initialX,
        startCardY: initialY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };

      setIsDragging(true);
    },
    [initialX, initialY]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = (e.clientX - dragStartRef.current.startMouseX) / scale;
      const deltaY = (e.clientY - dragStartRef.current.startMouseY) / scale;

      let newX = dragStartRef.current.startCardX + deltaX;
      let newY = dragStartRef.current.startCardY + deltaY;

      const snapTarget = findSnapTarget(newX, newY);
      if (snapTarget) {
        newX = snapTarget.x;
        newY = snapTarget.y;
      }

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          setCurrentPos({ x: newX, y: newY });
          onPositionChange(newX, newY);
          rafIdRef.current = null;
        });
      }
    },
    [isDragging, scale, findSnapTarget, onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.(currentPos.x, currentPos.y);
    }
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, [isDragging, currentPos, onDragEnd]);

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

  useEffect(() => {
    setCurrentPos({ x: initialX, y: initialY });
  }, [initialX, initialY]);

  return {
    isDragging,
    currentPos,
    handleMouseDown,
  };
}

export function detectCollision(
  card1: { x: number; y: number },
  card2: { x: number; y: number },
  width = CARD_WIDTH,
  height = CARD_HEIGHT
): boolean {
  return (
    card1.x < card2.x + width + 8 &&
    card1.x + width + 8 > card2.x &&
    card1.y < card2.y + height + 8 &&
    card1.y + height + 8 > card2.y
  );
}

export function snapToGrid(
  x: number,
  y: number,
  gridSize: number = 8
): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

export function calculateGridLayout(
  cards: Card[],
  containerWidth: number,
  cardWidth: number = CARD_WIDTH,
  gap: number = 24
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const padding = 100;
  const cardsPerRow = Math.max(
    1,
    Math.floor((containerWidth - padding * 2) / (cardWidth + gap))
  );

  cards.forEach((_, index) => {
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    positions.push({
      x: padding + col * (cardWidth + gap),
      y: padding + row * (CARD_HEIGHT + gap),
    });
  });

  return positions;
}
