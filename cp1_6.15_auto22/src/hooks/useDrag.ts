import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDragOptions {
  noteId: string;
  initialX: number;
  initialY: number;
  scale: number;
  onDragStart?: (noteId: string) => void;
  onDrag?: (noteId: string, x: number, y: number) => void;
  onDragEnd?: (noteId: string, x: number, y: number, group?: string) => void;
  getGroupAtPosition?: (x: number, y: number) => string | undefined;
}

export const useDrag = ({
  noteId,
  initialX,
  initialY,
  scale,
  onDragStart,
  onDrag,
  onDragEnd,
  getGroupAtPosition,
}: UseDragOptions) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const startPosRef = useRef({ x: 0, y: 0, noteX: 0, noteY: 0 });
  const dragStartedRef = useRef(false);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPosition({ x: initialX, y: initialY });
  }, [initialX, initialY]);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    startPosRef.current = {
      x: clientX,
      y: clientY,
      noteX: position.x,
      noteY: position.y,
    };
    dragStartedRef.current = false;

    setIsDragging(true);
    onDragStart?.(noteId);
  }, [noteId, position.x, position.y, onDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = (clientX - startPosRef.current.x) / scale;
    const deltaY = (clientY - startPosRef.current.y) / scale;

    const newX = startPosRef.current.noteX + deltaX;
    const newY = startPosRef.current.noteY + deltaY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragStartedRef.current = true;
    }

    setPosition({ x: newX, y: newY });

    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }
    moveTimeoutRef.current = setTimeout(() => {
      onDrag?.(noteId, newX, newY);
    }, 50);
  }, [isDragging, scale, noteId, onDrag]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }

    setIsDragging(false);

    const group = getGroupAtPosition?.(position.x, position.y);
    onDragEnd?.(noteId, position.x, position.y, group);
  }, [isDragging, noteId, position.x, position.y, getGroupAtPosition, onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    position,
    handleMouseDown,
    hasDragStarted: dragStartedRef.current,
  };
};

interface UsePanZoomOptions {
  onPan?: (offset: { x: number; y: number }) => void;
  onZoom?: (scale: number) => void;
}

export const usePanZoom = ({ onPan, onZoom }: UsePanZoomOptions = {}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(scale + delta, 0.3), 2);
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const oldScale = scale;
      const scaleChange = newScale / oldScale;
      
      const newOffsetX = mouseX - (mouseX - offset.x) * scaleChange;
      const newOffsetY = mouseY - (mouseY - offset.y) * scaleChange;
      
      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
      onZoom?.(newScale);
      onPan?.({ x: newOffsetX, y: newOffsetY });
    }
  }, [scale, offset, onZoom, onPan]);

  const handlePanStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.note-card, .group-zone, .toolbar')) {
      return;
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    panStartRef.current = {
      x: clientX,
      y: clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    setIsPanning(true);
  }, [offset]);

  const handlePanMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isPanning) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - panStartRef.current.x;
    const deltaY = clientY - panStartRef.current.y;

    const newOffset = {
      x: panStartRef.current.offsetX + deltaX,
      y: panStartRef.current.offsetY + deltaY,
    };
    setOffset(newOffset);
    onPan?.(newOffset);
  }, [isPanning, onPan]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handlePanMove);
      window.addEventListener('mouseup', handlePanEnd);
      window.addEventListener('touchmove', handlePanMove, { passive: false });
      window.addEventListener('touchend', handlePanEnd);

      return () => {
        window.removeEventListener('mousemove', handlePanMove);
        window.removeEventListener('mouseup', handlePanEnd);
        window.removeEventListener('touchmove', handlePanMove);
        window.removeEventListener('touchend', handlePanEnd);
      };
    }
  }, [isPanning, handlePanMove, handlePanEnd]);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    onZoom?.(1);
    onPan?.({ x: 0, y: 0 });
  }, [onZoom, onPan]);

  return {
    scale,
    offset,
    isPanning,
    containerRef,
    handleWheel,
    handlePanStart,
    resetView,
    setScale,
    setOffset,
  };
};
