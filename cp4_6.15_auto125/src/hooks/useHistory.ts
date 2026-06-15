import { useState, useCallback, useRef, useEffect } from 'react';
import type { CanvasElement, HistoryState } from '@/types';

interface UseHistoryReturn {
  elements: CanvasElement[];
  past: HistoryState[];
  future: HistoryState[];
  pushHistory: (newElements: CanvasElement[], action?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyIndex: number;
}

export function useHistory(initialElements: CanvasElement[] = []): UseHistoryReturn {
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoRef = useRef(false);

  const pushHistory = useCallback(
    (newElements: CanvasElement[], action: string = 'update') => {
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        setElements(newElements);
        return;
      }

      setPast((prev) => [
        ...prev,
        { elements: [...elements], action: action as never, timestamp: Date.now() },
      ]);
      setFuture([]);
      setElements(newElements);
      setHistoryIndex((prev) => prev + 1);
    },
    [elements]
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    isUndoRedoRef.current = true;
    setFuture((prev) => [
      { elements: [...elements], action: 'update', timestamp: Date.now() },
      ...prev,
    ]);
    setPast(newPast);
    setElements(previous.elements);
    setHistoryIndex((prev) => prev - 1);
  }, [past, elements]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    isUndoRedoRef.current = true;
    setPast((prev) => [
      ...prev,
      { elements: [...elements], action: 'update', timestamp: Date.now() },
    ]);
    setFuture(newFuture);
    setElements(next.elements);
    setHistoryIndex((prev) => prev + 1);
  }, [future, elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    elements,
    past,
    future,
    pushHistory,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyIndex,
  };
}
