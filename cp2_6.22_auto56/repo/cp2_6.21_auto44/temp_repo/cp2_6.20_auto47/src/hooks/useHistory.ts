import { useCallback, useRef } from 'react';
import { create } from 'zustand';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface HistoryActions<T> {
  pushSnapshot: (nextState: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (initialState: T) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export interface UseHistoryReturn<T> {
  state: T;
  pushSnapshot: (nextState: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (initialState: T) => void;
  canUndo: boolean;
  canRedo: boolean;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function useHistory<T>(initialState: T, maxHistory: number = 50): UseHistoryReturn<T> {
  const stateRef = useRef<HistoryState<T>>({
    past: [],
    present: deepClone(initialState),
    future: [],
  });

  const listenersRef = useRef<Set<() => void>>(new Set());
  const snapshotVersionRef = useRef(0);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    return snapshotVersionRef.current;
  }, []);

  const notify = useCallback(() => {
    snapshotVersionRef.current += 1;
    listenersRef.current.forEach((l) => l());
  }, []);

  const pushSnapshot = useCallback(
    (nextState: T) => {
      const s = stateRef.current;
      const snapshot = deepClone(s.present);
      s.past = [...s.past, snapshot];
      if (s.past.length > maxHistory) {
        s.past = s.past.slice(s.past.length - maxHistory);
      }
      s.present = deepClone(nextState);
      s.future = [];
      notify();
    },
    [maxHistory, notify]
  );

  const undo = useCallback(() => {
    const s = stateRef.current;
    if (s.past.length === 0) return;
    const previous = s.past[s.past.length - 1];
    s.past = s.past.slice(0, -1);
    s.future = [deepClone(s.present), ...s.future];
    s.present = previous;
    notify();
  }, [notify]);

  const redo = useCallback(() => {
    const s = stateRef.current;
    if (s.future.length === 0) return;
    const next = s.future[0];
    s.future = s.future.slice(1);
    s.past = [...s.past, deepClone(s.present)];
    s.present = next;
    notify();
  }, [notify]);

  const resetFn = useCallback(
    (initialState: T) => {
      stateRef.current = {
        past: [],
        present: deepClone(initialState),
        future: [],
      };
      notify();
    },
    [notify]
  );

  const canUndo = stateRef.current.past.length > 0;
  const canRedo = stateRef.current.future.length > 0;

  return {
    state: stateRef.current.present,
    pushSnapshot,
    undo,
    redo,
    reset: resetFn,
    canUndo,
    canRedo,
  };
}

export class ResumeHistoryManager<T> {
  private past: T[] = [];
  private present: T;
  private future: T[] = [];
  private maxHistory: number;

  constructor(initialState: T, maxHistory: number = 50) {
    this.present = deepClone(initialState);
    this.maxHistory = maxHistory;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get currentState(): T {
    return this.present;
  }

  pushSnapshot(nextState: T): void {
    this.past.push(deepClone(this.present));
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    this.present = deepClone(nextState);
    this.future = [];
  }

  undo(): T | null {
    if (this.past.length === 0) return null;
    const previous = this.past.pop()!;
    this.future.unshift(deepClone(this.present));
    this.present = previous;
    return deepClone(this.present);
  }

  redo(): T | null {
    if (this.future.length === 0) return null;
    const next = this.future.shift()!;
    this.past.push(deepClone(this.present));
    this.present = next;
    return deepClone(this.present);
  }

  reset(initialState: T): void {
    this.past = [];
    this.present = deepClone(initialState);
    this.future = [];
  }
}
