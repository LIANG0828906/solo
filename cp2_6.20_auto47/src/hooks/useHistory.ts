import { useState, useCallback, useRef, useEffect } from 'react';

interface UseHistoryOptions<T> {
  maxHistory?: number;
  initialState?: T;
}

interface UseHistoryReturn<T> {
  state: T;
  history: T[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  push: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (initialState: T) => void;
}

export function useHistory<T>(options: UseHistoryOptions<T> = {}): UseHistoryReturn<T> {
  const { maxHistory = 50, initialState } = options;

  const [history, setHistory] = useState<T[]>(
    initialState !== undefined ? [initialState] : []
  );
  const [currentIndex, setCurrentIndex] = useState<number>(
    initialState !== undefined ? 0 : -1
  );

  const historyRef = useRef(history);
  const indexRef = useRef(currentIndex);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const push = useCallback(
    (newState: T) => {
      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, indexRef.current + 1);
        newHistory.push(newState);
        if (newHistory.length > maxHistory) {
          newHistory.shift();
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
        return newHistory;
      });
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, []);

  const reset = useCallback((initialState: T) => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const state = history[currentIndex] ?? (initialState as T);

  return {
    state,
    history,
    currentIndex,
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    reset,
  };
}
