import { useRef, useCallback, useEffect } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useFragmentStore } from '../store/useFragmentStore';
import type { Fragment, PlacedFragment } from '../types';
import { playSnapSound, playPickupSound, playStackSound } from '../lib/audio';

interface UseDragDropOptions {
  workspaceRef: React.RefObject<HTMLDivElement>;
}

interface DragState {
  activeFragment: Fragment | PlacedFragment | null;
  isDragging: boolean;
  isStackingMode: boolean;
  currentPosition: { x: number; y: number } | null;
}

export function useDragDrop({ workspaceRef }: UseDragDropOptions) {
  const rafRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<DragState>({
    activeFragment: null,
    isDragging: false,
    isStackingMode: false,
    currentPosition: null,
  });

  const {
    libraryFragments: fragments,
    placedFragments,
    isStackingMode,
    soundEnabled,
    selectFragment,
    setDragging,
    setStackingMode,
    placeFragment,
    updateFragmentPosition,
    updateFragmentZIndex,
    incrementMoves,
  } = useFragmentStore();

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const sensors = useSensors(
    pointerSensor,
    touchSensor
  );

  const findFragmentById = useCallback(
    (id: string): Fragment | PlacedFragment | undefined => {
      return (
        placedFragments.find((f: PlacedFragment) => f.id === id) ||
        fragments.find((f: Fragment) => f.id === id)
      );
    },
    [fragments, placedFragments]
  );

  const getWorkspaceCoordinates = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!workspaceRef.current) {
        return { x: clientX, y: clientY };
      }
      const rect = workspaceRef.current.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [workspaceRef]
  );

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const startLongPressTimer = useCallback(
    (fragmentId: string) => {
      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        const fragment = findFragmentById(fragmentId);
        if (fragment && 'zIndex' in fragment) {
          setStackingMode(true);
          dragStateRef.current.isStackingMode = true;
          if (soundEnabled) {
            playStackSound();
          }
        }
      }, 500);
    },
    [clearLongPressTimer, findFragmentById, setStackingMode, soundEnabled]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const fragment = findFragmentById(String(active.id));
      if (!fragment) return;

      dragStateRef.current = {
        activeFragment: fragment,
        isDragging: true,
        isStackingMode: false,
        currentPosition: null,
      };

      setDragging(true);
      selectFragment(String(active.id));
      incrementMoves();

      if (soundEnabled) {
        playPickupSound();
      }

      if ('zIndex' in fragment) {
        startLongPressTimer(String(active.id));
      }
    },
    [
      findFragmentById,
      setDragging,
      selectFragment,
      incrementMoves,
      soundEnabled,
      startLongPressTimer,
    ]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { active } = event;
      if (!dragStateRef.current.isDragging) return;

      clearLongPressTimer();

      const activatorEvent = event.activatorEvent as MouseEvent | TouchEvent;
      let clientX: number, clientY: number;
      if ('touches' in activatorEvent && activatorEvent.touches.length > 0) {
        clientX = activatorEvent.touches[0].clientX;
        clientY = activatorEvent.touches[0].clientY;
      } else if ('clientX' in activatorEvent) {
        clientX = activatorEvent.clientX;
        clientY = activatorEvent.clientY;
      } else {
        clientX = 0;
        clientY = 0;
      }
      const { x, y } = getWorkspaceCoordinates(clientX, clientY);

      currentPosRef.current = { x, y };
      dragStateRef.current.currentPosition = { x, y };

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const fragment = findFragmentById(String(active.id));
        if (fragment && 'zIndex' in fragment && currentPosRef.current) {
          updateFragmentPosition(
            String(active.id),
            currentPosRef.current.x - fragment.width / 2,
            currentPosRef.current.y - fragment.height / 2
          );
        }
        rafRef.current = null;
      });
    },
    [clearLongPressTimer, findFragmentById, getWorkspaceCoordinates, updateFragmentPosition]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      clearLongPressTimer();

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const fragment = findFragmentById(String(active.id));
      if (!fragment) {
        resetDragState();
        return;
      }

      if (dragStateRef.current.isStackingMode && 'zIndex' in fragment) {
        const maxZIndex = placedFragments.reduce(
          (max, f) => Math.max(max, f.zIndex),
          0
        );
        updateFragmentZIndex(String(active.id), maxZIndex + 1);
        setStackingMode(false);
        dragStateRef.current.isStackingMode = false;
      } else if (over && currentPosRef.current) {
        const workspaceRect = workspaceRef.current?.getBoundingClientRect();
        if (workspaceRect) {
          const pos = {
            x: currentPosRef.current.x - fragment.width / 2,
            y: currentPosRef.current.y - fragment.height / 2,
          };

          if (!('zIndex' in fragment)) {
            const maxZIndex = placedFragments.reduce(
              (max, f) => Math.max(max, f.zIndex),
              0
            );
            const placedFragment: PlacedFragment = {
              ...fragment,
              x: pos.x,
              y: pos.y,
              zIndex: maxZIndex + 1,
              isPlaced: true,
              matchScore: 0,
            };
            placeFragment(placedFragment);
          } else {
            updateFragmentPosition(String(active.id), pos.x, pos.y);
          }

          if (soundEnabled) {
            playSnapSound();
          }
        }
      }

      resetDragState();
    },
    [
      clearLongPressTimer,
      findFragmentById,
      placedFragments,
      placeFragment,
      setStackingMode,
      soundEnabled,
      updateFragmentPosition,
      updateFragmentZIndex,
      workspaceRef,
    ]
  );

  const handleDragCancel = useCallback(() => {
    clearLongPressTimer();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    resetDragState();
  }, [clearLongPressTimer]);

  const resetDragState = useCallback(() => {
    dragStateRef.current = {
      activeFragment: null,
      isDragging: false,
      isStackingMode: false,
      currentPosition: null,
    };
    setDragging(false);
    selectFragment(null);
    setStackingMode(false);
  }, [setDragging, selectFragment, setStackingMode]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [clearLongPressTimer]);

  const activeFragment = dragStateRef.current.activeFragment;
  const isDragging = dragStateRef.current.isDragging;
  const currentPosition = dragStateRef.current.currentPosition;

  return {
    sensors,
    isDragging,
    isStackingMode,
    activeFragment,
    currentPosition,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  } as const;
}

export type UseDragDropReturn = ReturnType<typeof useDragDrop>;
