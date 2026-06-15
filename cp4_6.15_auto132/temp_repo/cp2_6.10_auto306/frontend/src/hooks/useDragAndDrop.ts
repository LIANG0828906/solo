import { useState, useCallback, useRef, useEffect } from 'react';
import type { Sigil } from '@/types';

interface UseDragAndDropOptions {
  onDrop?: (sigil: Sigil, position: { x: number; y: number }) => void;
  maxSlots?: number;
}

interface DragState {
  isDragging: boolean;
  draggedSigil: Sigil | null;
  dragPosition: { x: number; y: number } | null;
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const { onDrop, maxSlots = 2 } = options;
  
  const [state, setState] = useState<DragState>({
    isDragging: false,
    draggedSigil: null,
    dragPosition: null,
  });
  
  const [placedSigils, setPlacedSigils] = useState<(Sigil | null)[]>(
    Array(maxSlots).fill(null)
  );
  
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleDragStart = useCallback((sigil: Sigil, event: React.DragEvent | React.TouchEvent) => {
    if ('dataTransfer' in event) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('sigil', JSON.stringify(sigil));
    }
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    if ('touches' in event) {
      touchStartPos.current = { x: clientX, y: clientY };
    }
    
    setState({
      isDragging: true,
      draggedSigil: sigil,
      dragPosition: { x: clientX, y: clientY },
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setState({
      isDragging: false,
      draggedSigil: null,
      dragPosition: null,
    });
    touchStartPos.current = null;
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent | React.TouchEvent) => {
    event.preventDefault();
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    if (state.isDragging) {
      setState(prev => ({
        ...prev,
        dragPosition: { x: clientX, y: clientY },
      }));
    }
  }, [state.isDragging]);

  const handleDrop = useCallback((event: React.DragEvent | React.TouchEvent, slotIndex?: number) => {
    event.preventDefault();
    
    let sigil: Sigil | null = state.draggedSigil;
    
    if (!sigil && 'dataTransfer' in event) {
      try {
        const sigilData = event.dataTransfer.getData('sigil');
        if (sigilData) {
          sigil = JSON.parse(sigilData);
        }
      } catch (e) {
        console.error('Failed to parse sigil data:', e);
      }
    }
    
    if (!sigil) return;
    
    const clientX = 'changedTouches' in event ? event.changedTouches[0].clientX : event.clientX;
    const clientY = 'changedTouches' in event ? event.changedTouches[0].clientY : event.clientY;
    
    if (slotIndex !== undefined) {
      setPlacedSigils(prev => {
        const newSigils = [...prev];
        if (newSigils[slotIndex] === null) {
          newSigils[slotIndex] = sigil;
        } else {
          const emptyIndex = newSigils.findIndex(s => s === null);
          if (emptyIndex !== -1) {
            newSigils[emptyIndex] = sigil;
          }
        }
        return newSigils;
      });
    } else {
      const emptyIndex = placedSigils.findIndex(s => s === null);
      if (emptyIndex !== -1) {
        setPlacedSigils(prev => {
          const newSigils = [...prev];
          newSigils[emptyIndex] = sigil!;
          return newSigils;
        });
      }
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    onDrop?.(sigil, { x: clientX, y: clientY });
    handleDragEnd();
  }, [state.draggedSigil, placedSigils, onDrop, handleDragEnd]);

  const removeSigil = useCallback((slotIndex: number) => {
    setPlacedSigils(prev => {
      const newSigils = [...prev];
      newSigils[slotIndex] = null;
      return newSigils;
    });
  }, []);

  const clearSigils = useCallback(() => {
    setPlacedSigils(Array(maxSlots).fill(null));
  }, [maxSlots]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (state.isDragging && state.draggedSigil) {
        e.preventDefault();
        const touch = e.touches[0];
        setState(prev => ({
          ...prev,
          dragPosition: { x: touch.clientX, y: touch.clientY },
        }));
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (state.isDragging && state.draggedSigil) {
        handleDragEnd();
      }
    };
    
    if (state.isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [state.isDragging, state.draggedSigil, handleDragEnd]);

  return {
    isDragging: state.isDragging,
    draggedSigil: state.draggedSigil,
    dragPosition: state.dragPosition,
    placedSigils,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    removeSigil,
    clearSigils,
  };
}
