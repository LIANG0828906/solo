import React, { createContext, useContext, useCallback, useRef, ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  MouseSensor,
} from '@dnd-kit/core';
import { useGameStore } from '@/store/gameStore';
import { checkPlacement } from './puzzleManager';

interface DragContextType {
  isDragging: boolean;
  draggingId: string | null;
  dragOffset: { x: number; y: number };
}

const DragContext = createContext<DragContextType>({
  isDragging: false,
  draggingId: null,
  dragOffset: { x: 0, y: 0 },
});

export const useDragContext = () => useContext(DragContext);

interface DragProviderProps {
  children: ReactNode;
}

export const DragProvider: React.FC<DragProviderProps> = ({ children }) => {
  const {
    fragments,
    draggingId,
    setDraggingId,
    updateFragmentPosition,
    setFragmentCorrect,
    incrementStreak,
    resetStreak,
    setFlashOrange,
    setFlashRed,
    setShowSuccess,
  } = useGameStore();

  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    const fragment = fragments.find((f) => f.id === id);
    
    if (fragment && fragment.isCorrect) {
      return;
    }
    
    setDraggingId(id);
    setFlashRed(null);
  }, [fragments, setDraggingId, setFlashRed]);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    const fragment = fragments.find((f) => f.id === id);
    
    if (!fragment || fragment.isCorrect) return;
    
    dragOffsetRef.current = { x: delta.x, y: delta.y };
  }, [fragments]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    const id = active.id as string;
    
    setDraggingId(null);
    
    const fragment = fragments.find((f) => f.id === id);
    if (!fragment || fragment.isCorrect) {
      return;
    }

    if (over && over.id === 'canvas') {
      const canvasRect = document.getElementById('canvas-area')?.getBoundingClientRect();
      if (!canvasRect) return;

      const activeRect = active.rect.current.translated || active.rect.current.initial;
      if (!activeRect) return;
      
      const x = delta.x + activeRect.left - canvasRect.left;
      const y = delta.y + activeRect.top - canvasRect.top;

      const adjustedX = x - dragOffsetRef.current.x;
      const adjustedY = y - dragOffsetRef.current.y;

      updateFragmentPosition(id, adjustedX, adjustedY);

      const isCorrect = checkPlacement(
        fragment.targetX,
        fragment.targetY,
        adjustedX,
        adjustedY
      );

      if (isCorrect) {
        setFragmentCorrect(id, true);
        const newStreak = incrementStreak();
        
        if (newStreak >= 3) {
          resetStreak();
          setFlashOrange(true);
          setTimeout(() => setFlashOrange(false), 400);
        }

        setTimeout(() => {
          const updatedFragments = useGameStore.getState().fragments;
          const allCorrect = updatedFragments.every((f) => f.isCorrect);
          if (allCorrect) {
            setShowSuccess(true);
          }
        }, 100);
      } else {
        setFragmentCorrect(id, false);
        setFlashRed(id);
        resetStreak();
        
        setTimeout(() => {
          setFlashRed(null);
          updateFragmentPosition(id, 0, 0);
        }, 200);
      }
    }
    
    dragOffsetRef.current = { x: 0, y: 0 };
  }, [fragments, setDraggingId, updateFragmentPosition, setFragmentCorrect, incrementStreak, resetStreak, setFlashOrange, setFlashRed, setShowSuccess]);

  const value: DragContextType = {
    isDragging: !!draggingId,
    draggingId,
    dragOffset: dragOffsetRef.current,
  };

  return (
    <DragContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {children}
      </DndContext>
    </DragContext.Provider>
  );
};

export function useDragHandlers() {
  const { isDragging, draggingId } = useDragContext();
  return {
    isDragging,
    draggingId,
  };
}

export default DragProvider;
