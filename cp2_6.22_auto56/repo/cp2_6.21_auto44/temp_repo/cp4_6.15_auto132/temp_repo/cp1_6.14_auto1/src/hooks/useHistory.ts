import { useCallback, useRef, useState } from 'react';
import type { Shape, StickyNote } from '../types';

export type HistoryItem =
  | { kind: 'shape:add'; shape: Shape }
  | { kind: 'shape:update'; before: Shape; after: Shape }
  | { kind: 'shape:delete'; shape: Shape }
  | { kind: 'sticky:add'; sticky: StickyNote }
  | { kind: 'sticky:update'; before: StickyNote; after: StickyNote }
  | { kind: 'sticky:delete'; sticky: StickyNote };

const MAX_HISTORY = 5;

export interface HistoryHandlers {
  onShapeAdd: (shape: Shape) => void;
  onShapeUpdate: (shape: Shape) => void;
  onShapeDelete: (shapeId: string) => void;
  onStickyAdd: (sticky: StickyNote) => void;
  onStickyUpdate: (sticky: StickyNote) => void;
  onStickyDelete: (stickyId: string) => void;
}

export function useHistory(handlers: HistoryHandlers) {
  const [undoStack, setUndoStack] = useState<HistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([]);
  const shapesRef = useRef<Map<string, Shape>>(new Map());
  const stickiesRef = useRef<Map<string, StickyNote>>(new Map());

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const updateShapeCache = useCallback((shapes: Shape[]) => {
    shapesRef.current = new Map(shapes.map((s) => [s.id, s]));
  }, []);

  const updateStickyCache = useCallback((stickies: StickyNote[]) => {
    stickiesRef.current = new Map(stickies.map((s) => [s.id, s]));
  }, []);

  const pushHistory = useCallback((item: HistoryItem) => {
    setUndoStack((prev) => {
      const next = [...prev, item];
      if (next.length > MAX_HISTORY) {
        return next.slice(next.length - MAX_HISTORY);
      }
      return next;
    });
    setRedoStack([]);
  }, []);

  const recordShapeAdd = useCallback((shape: Shape) => {
    pushHistory({ kind: 'shape:add', shape });
  }, [pushHistory]);

  const recordShapeUpdate = useCallback((after: Shape) => {
    const before = shapesRef.current.get(after.id);
    if (before) {
      pushHistory({ kind: 'shape:update', before, after });
    }
  }, [pushHistory]);

  const recordShapeDelete = useCallback((shapeId: string) => {
    const shape = shapesRef.current.get(shapeId);
    if (shape) {
      pushHistory({ kind: 'shape:delete', shape });
    }
  }, [pushHistory]);

  const recordStickyAdd = useCallback((sticky: StickyNote) => {
    pushHistory({ kind: 'sticky:add', sticky });
  }, [pushHistory]);

  const recordStickyUpdate = useCallback((after: StickyNote) => {
    const before = stickiesRef.current.get(after.id);
    if (before) {
      pushHistory({ kind: 'sticky:update', before, after });
    }
  }, [pushHistory]);

  const recordStickyDelete = useCallback((stickyId: string) => {
    const sticky = stickiesRef.current.get(stickyId);
    if (sticky) {
      pushHistory({ kind: 'sticky:delete', sticky });
    }
  }, [pushHistory]);

  const applyInverse = useCallback(
    (item: HistoryItem) => {
      switch (item.kind) {
        case 'shape:add':
          handlers.onShapeDelete(item.shape.id);
          break;
        case 'shape:update':
          handlers.onShapeUpdate(item.before);
          break;
        case 'shape:delete':
          handlers.onShapeAdd(item.shape);
          break;
        case 'sticky:add':
          handlers.onStickyDelete(item.sticky.id);
          break;
        case 'sticky:update':
          handlers.onStickyUpdate(item.before);
          break;
        case 'sticky:delete':
          handlers.onStickyAdd(item.sticky);
          break;
      }
    },
    [handlers],
  );

  const applyForward = useCallback(
    (item: HistoryItem) => {
      switch (item.kind) {
        case 'shape:add':
          handlers.onShapeAdd(item.shape);
          break;
        case 'shape:update':
          handlers.onShapeUpdate(item.after);
          break;
        case 'shape:delete':
          handlers.onShapeDelete(item.shape.id);
          break;
        case 'sticky:add':
          handlers.onStickyAdd(item.sticky);
          break;
        case 'sticky:update':
          handlers.onStickyUpdate(item.after);
          break;
        case 'sticky:delete':
          handlers.onStickyDelete(item.sticky.id);
          break;
      }
    },
    [handlers],
  );

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const item = next.pop()!;
      applyInverse(item);
      setRedoStack((r) => [...r, item]);
      return next;
    });
  }, [applyInverse]);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const item = next.pop()!;
      applyForward(item);
      setUndoStack((u) => [...u, item]);
      return next;
    });
  }, [applyForward]);

  const undoCount = undoStack.length;
  const redoCount = redoStack.length;

  return {
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    maxHistory: MAX_HISTORY,
    undo,
    redo,
    updateShapeCache,
    updateStickyCache,
    recordShapeAdd,
    recordShapeUpdate,
    recordShapeDelete,
    recordStickyAdd,
    recordStickyUpdate,
    recordStickyDelete,
  };
}
