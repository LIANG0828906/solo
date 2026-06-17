import { WhiteboardElement } from '@types/index';
import { useElementStore } from '@data/elementStore';
import { websocket } from '@network/websocket';
import { throttle } from 'lodash';

const BATCH_INTERVAL = 16;

class SyncScheduler {
  private pendingAdd: WhiteboardElement[] = [];
  private pendingUpdate: Map<string, Partial<WhiteboardElement>> = new Map();
  private pendingDelete: Set<string> = new Set();
  private batchTimer: number | null = null;

  addElement(element: WhiteboardElement): void {
    if (useElementStore.getState().replay.isPlaying) return;

    this.pendingAdd.push(element);
    this.scheduleBatch();
  }

  updateElement(id: string, patch: Partial<WhiteboardElement>): void {
    if (useElementStore.getState().replay.isPlaying) return;

    const existing = this.pendingUpdate.get(id) || {};
    this.pendingUpdate.set(id, { ...existing, ...patch });
    this.scheduleBatch();
  }

  deleteElement(id: string): void {
    if (useElementStore.getState().replay.isPlaying) return;

    this.pendingDelete.add(id);
    this.scheduleBatch();
  }

  undo(): void {
    const state = useElementStore.getState();
    if (state.historyIndex <= 0) return;

    state.undo();
    const newState = useElementStore.getState();
    websocket.broadcastUndo(newState.elements);
  }

  redo(): void {
    const state = useElementStore.getState();
    if (state.redoStack.length === 0) return;

    state.redo();
    const newState = useElementStore.getState();
    websocket.broadcastRedo(newState.elements);
  }

  private scheduleBatch(): void {
    if (this.batchTimer !== null) return;

    this.batchTimer = window.setTimeout(() => {
      this.flushBatch();
      this.batchTimer = null;
    }, BATCH_INTERVAL);
  }

  private flushBatch(): void {
    const state = useElementStore.getState();
    let elements = [...state.elements];
    let changed = false;

    if (this.pendingDelete.size > 0) {
      elements = elements.filter((e) => !this.pendingDelete.has(e.id));
      this.pendingDelete.forEach((id) => websocket.broadcastElementDelete(id));
      this.pendingDelete.clear();
      changed = true;
    }

    if (this.pendingUpdate.size > 0) {
      elements = elements.map((e) => {
        const patch = this.pendingUpdate.get(e.id);
        if (patch) {
          const updated = {
            ...e,
            ...patch,
            updatedAt: Date.now(),
          } as WhiteboardElement;
          websocket.broadcastElementUpdate(e.id, patch);
          return updated;
        }
        return e;
      });
      this.pendingUpdate.clear();
      changed = true;
    }

    if (this.pendingAdd.length > 0) {
      this.pendingAdd.forEach((el) => websocket.broadcastElementAdd(el));
      elements = [...elements, ...this.pendingAdd];
      this.pendingAdd = [];
      changed = true;
    }

    if (changed) {
      useElementStore.setState({
        elements,
        lastOperationTime: Date.now(),
      });
      useElementStore.getState().pushHistory(elements);
    }
  }

  immediateAdd(element: WhiteboardElement): void {
    const state = useElementStore.getState();
    if (state.replay.isPlaying) return;

    const elements = [...state.elements, element];
    useElementStore.setState({
      elements,
      lastOperationTime: Date.now(),
    });
    useElementStore.getState().pushHistory(elements);
    websocket.broadcastElementAdd(element);
  }

  immediateUpdate(id: string, patch: Partial<WhiteboardElement>): void {
    const state = useElementStore.getState();
    if (state.replay.isPlaying) return;

    const elements = state.elements.map((e) =>
      e.id === id
        ? ({ ...e, ...patch, updatedAt: Date.now() } as WhiteboardElement)
        : e,
    );
    useElementStore.setState({
      elements,
      lastOperationTime: Date.now(),
    });
    useElementStore.getState().pushHistory(elements);
    websocket.broadcastElementUpdate(id, patch);
  }

  immediateDelete(id: string): void {
    const state = useElementStore.getState();
    if (state.replay.isPlaying) return;

    const elements = state.elements.filter((e) => e.id !== id);
    useElementStore.setState({
      elements,
      lastOperationTime: Date.now(),
      selectedElementId: null,
    });
    useElementStore.getState().pushHistory(elements);
    websocket.broadcastElementDelete(id);
  }

  sendCursor = throttle((x: number, y: number) => {
    websocket.broadcastCursorMove(x, y);
  }, 16);
}

export const syncScheduler = new SyncScheduler();
