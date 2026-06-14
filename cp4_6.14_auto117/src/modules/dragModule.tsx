import React, { createContext, useContext, useCallback, useRef, useState, ReactNode, useEffect } from 'react';
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
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useGameStore } from '@/store/gameStore';
import { checkPlacement, Fragment, DEFAULT_PLACEMENT_THRESHOLD } from './puzzleManager';

interface DragContextType {
  isDragging: boolean;
  draggingId: string | null;
  draggingFragment: Fragment | null;
  dragPosition: { x: number; y: number };
  pointerOffset: { x: number; y: number };
}

const DragContext = createContext<DragContextType>({
  isDragging: false,
  draggingId: null,
  draggingFragment: null,
  dragPosition: { x: 0, y: 0 },
  pointerOffset: { x: 0, y: 0 },
});

export const useDragContext = () => useContext(DragContext);

interface DragProviderProps {
  children: ReactNode;
}

const dropAnimationConfig = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

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

  const [activeId, setActiveId] = useState<string | null>(null);
  const [clientPosition, setClientPosition] = useState({ x: 0, y: 0 });
  const pointerOffsetRef = useRef({ x: 0, y: 0 });

  const draggingFragment = fragments.find((f) => f.id === activeId) || null;

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

    setActiveId(id);
    setDraggingId(id);
    setFlashRed(null);

    const initialRect = active.rect.current.initial;
    if (initialRect) {
      pointerOffsetRef.current = {
        x: 0,
        y: 0,
      };
    }
  }, [fragments, setDraggingId, setFlashRed]);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    const fragment = fragments.find((f) => f.id === id);

    if (!fragment || fragment.isCorrect) return;

    const translatedRect = active.rect.current.translated;
    if (translatedRect) {
      setClientPosition({
        x: translatedRect.left,
        y: translatedRect.top,
      });
    }
  }, [fragments]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDraggingId(null);
    pointerOffsetRef.current = { x: 0, y: 0 };
  }, [setDraggingId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const id = active.id as string;

    const fragment = fragments.find((f) => f.id === id);
    if (!fragment || fragment.isCorrect) {
      setActiveId(null);
      setDraggingId(null);
      return;
    }

    if (over && over.id === 'canvas') {
      const canvasRect = document.getElementById('canvas-area')?.getBoundingClientRect();
      if (!canvasRect) {
        setActiveId(null);
        setDraggingId(null);
        return;
      }

      const translatedRect = active.rect.current.translated;
      const initialRect = active.rect.current.initial;
      const rect = translatedRect || initialRect;

      if (!rect) {
        setActiveId(null);
        setDraggingId(null);
        return;
      }

      const x = rect.left - canvasRect.left;
      const y = rect.top - canvasRect.top;

      const adjustedX = Math.max(0, Math.min(x, canvasRect.width - fragment.width));
      const adjustedY = Math.max(0, Math.min(y, canvasRect.height - fragment.height));

      updateFragmentPosition(id, adjustedX, adjustedY);

      const updatedFragment: Fragment = {
        ...fragment,
        currentX: adjustedX,
        currentY: adjustedY,
      };

      const isCorrect = checkPlacement(updatedFragment, DEFAULT_PLACEMENT_THRESHOLD);

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
        }, 300);
      }
    }

    setActiveId(null);
    setDraggingId(null);
    pointerOffsetRef.current = { x: 0, y: 0 };
  }, [fragments, setDraggingId, updateFragmentPosition, setFragmentCorrect, incrementStreak, resetStreak, setFlashOrange, setFlashRed, setShowSuccess]);

  const value: DragContextType = {
    isDragging: !!activeId,
    draggingId: activeId,
    draggingFragment,
    dragPosition: clientPosition,
    pointerOffset: pointerOffsetRef.current,
  };

  useEffect(() => {
    if (!activeId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDragCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeId, handleDragCancel]);

  return (
    <DragContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeId && draggingFragment ? (
            <div
              style={{
                width: draggingFragment.width,
                height: draggingFragment.height,
                backgroundColor: draggingFragment.bgColor,
                borderRadius: 8,
                transform: `rotate(${draggingFragment.rotation}deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 500,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                position: 'relative',
                cursor: 'grabbing',
                boxShadow: '3px 3px 0 rgba(0, 0, 0, 0.3)',
              }}
            >
              {draggingFragment.name}
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 8,
                  zIndex: -1,
                  pointerEvents: 'none',
                }}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DragContext.Provider>
  );
};

export function useDragHandlers() {
  const { isDragging, draggingId, draggingFragment, dragPosition } = useDragContext();
  return {
    isDragging,
    draggingId,
    draggingFragment,
    dragPosition,
  };
}

export default DragProvider;
