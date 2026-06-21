import { useEffect, useRef, useCallback } from 'react';
import { useSandboxStore } from '../store/sandboxStore';
import { useMockStore } from '../../moduleB/store/mockStore';
import { useLoggerStore } from '../../moduleC/store/loggerStore';
import { interactionLogger } from '../../moduleC/logger/InteractionLogger';
import type { StateSnapshot } from '../../types';
import { debounce } from '../../utils';

const MAX_SNAPSHOTS = 50;
const SNAPSHOT_DEBOUNCE = 100;

export function useUndoRedo() {
  const undoStackRef = useRef<StateSnapshot[]>([]);
  const redoStackRef = useRef<StateSnapshot[]>([]);
  const isRestoringRef = useRef(false);

  const createSnapshot = useCallback((): StateSnapshot => {
    return {
      sandbox: JSON.parse(JSON.stringify(useSandboxStore.getState())),
      mock: JSON.parse(JSON.stringify(useMockStore.getState())),
      logger: JSON.parse(JSON.stringify(useLoggerStore.getState())),
      timestamp: Date.now(),
    };
  }, []);

  const restoreSnapshot = useCallback((snapshot: StateSnapshot) => {
    isRestoringRef.current = true;
    interactionLogger.pause();

    const { sandbox, mock, logger } = snapshot;

    useSandboxStore.getState().setState({
      components: sandbox.components,
      selectedComponentId: sandbox.selectedComponentId,
      draggingComponentId: sandbox.draggingComponentId,
    });

    useMockStore.getState().setState({
      data: mock.data,
    });

    useLoggerStore.getState().setState({
      logs: logger.logs,
      expandedLogId: logger.expandedLogId,
    });

    requestAnimationFrame(() => {
      interactionLogger.resume();
      isRestoringRef.current = false;
    });
  }, []);

  const takeSnapshot = useCallback(
    debounce(() => {
      if (isRestoringRef.current) return;

      const snapshot = createSnapshot();
      undoStackRef.current.push(snapshot);

      if (undoStackRef.current.length > MAX_SNAPSHOTS) {
        undoStackRef.current.shift();
      }

      redoStackRef.current = [];
    }, SNAPSHOT_DEBOUNCE),
    [createSnapshot]
  );

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;

    window.dispatchEvent(new Event('undo-restore-start'));
    const currentSnapshot = createSnapshot();
    const previousSnapshot = undoStackRef.current.pop()!;

    redoStackRef.current.push(currentSnapshot);
    restoreSnapshot(previousSnapshot);
    window.dispatchEvent(new Event('undo-restore-end'));

    interactionLogger.log('undo', {
      snapshotTimestamp: previousSnapshot.timestamp,
    });
  }, [createSnapshot, restoreSnapshot]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;

    window.dispatchEvent(new Event('redo-restore-start'));
    const currentSnapshot = createSnapshot();
    const nextSnapshot = redoStackRef.current.pop()!;

    undoStackRef.current.push(currentSnapshot);
    restoreSnapshot(nextSnapshot);
    window.dispatchEvent(new Event('redo-restore-end'));

    interactionLogger.log('redo', {
      snapshotTimestamp: nextSnapshot.timestamp,
    });
  }, [createSnapshot, restoreSnapshot]);

  useEffect(() => {
    const sandboxUnsubscribe = useSandboxStore.subscribe(takeSnapshot);
    const mockUnsubscribe = useMockStore.subscribe(takeSnapshot);

    return () => {
      sandboxUnsubscribe();
      mockUnsubscribe();
    };
  }, [takeSnapshot]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo: () => undoStackRef.current.length > 0,
    canRedo: () => redoStackRef.current.length > 0,
  };
}
