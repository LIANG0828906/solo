import type { Snapshot, HistoryState, MindMapNode } from '@/types/mindMap';
import { HISTORY_MAX_DEPTH } from '@/types/mindMap';

export function createSnapshot(
  nodes: Record<string, MindMapNode>,
  rootId: string
): Snapshot {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    rootId,
  };
}

export function pushHistory(
  history: HistoryState,
  snapshot: Snapshot
): HistoryState {
  const newPast = [...history.past, snapshot];
  if (newPast.length > HISTORY_MAX_DEPTH) {
    newPast.shift();
  }
  return {
    past: newPast,
    future: [],
  };
}

export function undoHistory(
  history: HistoryState,
  currentSnapshot: Snapshot
): { history: HistoryState; snapshot: Snapshot | null } {
  if (history.past.length === 0) {
    return { history, snapshot: null };
  }
  const newPast = [...history.past];
  const previous = newPast.pop()!;
  return {
    history: {
      past: newPast,
      future: [currentSnapshot, ...history.future],
    },
    snapshot: previous,
  };
}

export function redoHistory(
  history: HistoryState,
  currentSnapshot: Snapshot
): { history: HistoryState; snapshot: Snapshot | null } {
  if (history.future.length === 0) {
    return { history, snapshot: null };
  }
  const newFuture = [...history.future];
  const next = newFuture.shift()!;
  return {
    history: {
      past: [...history.past, currentSnapshot],
      future: newFuture,
    },
    snapshot: next,
  };
}
