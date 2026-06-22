import { get, set } from 'idb-keyval';
import { wsManager } from './websocket';
import { useCanvasStore } from './store';
import type { CanvasElement, CanvasOperation } from './types';

const SNAPSHOT_KEY = 'canvas_snapshot';
const processedOperations = new Set<string>();
const pendingOperations: CanvasOperation[] = [];

export class SyncManager {
  private unsubscribers: Array<() => void> = [];
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;
  private localOperationBuffer: CanvasOperation[] = [];
  private flushBufferTimeout: ReturnType<typeof setTimeout> | null = null;

  async init(wsUrl: string): Promise<void> {
    if (this.isInitialized) return;

    await this.loadFromIndexedDB();
    this.setupWebSocketListeners();
    this.setupStoreListeners();
    wsManager.connect(wsUrl);

    this.isInitialized = true;
  }

  destroy(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    wsManager.disconnect();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    if (this.flushBufferTimeout) {
      clearTimeout(this.flushBufferTimeout);
    }
    this.isInitialized = false;
  }

  private async loadFromIndexedDB(): Promise<void> {
    try {
      const snapshot = await get<CanvasElement[]>(SNAPSHOT_KEY);
      if (snapshot && Array.isArray(snapshot)) {
        useCanvasStore.getState().loadSnapshot(snapshot);
        console.log('[Sync] Loaded snapshot from IndexedDB, elements:', snapshot.length);
      }
    } catch (e) {
      console.error('[Sync] Failed to load snapshot from IndexedDB:', e);
    }
  }

  private saveToIndexedDB(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      try {
        const elements = useCanvasStore.getState().elements;
        await set(SNAPSHOT_KEY, elements);
      } catch (e) {
        console.error('[Sync] Failed to save snapshot to IndexedDB:', e);
      }
    }, 500);
  }

  private setupWebSocketListeners(): void {
    const unsubMessage = wsManager.onMessage((msg: CanvasOperation) => {
      this.handleIncomingMessage(msg);
    });

    const unsubStatus = wsManager.onStatusChange((status) => {
      useCanvasStore.getState().setConnectionStatus(status);

      if (status === 'connected') {
        console.log('[Sync] Connected, requesting snapshot...');
        this.sendLocalSnapshot();
      } else if (status === 'disconnected') {
        console.log('[Sync] Disconnected');
      }
    });

    this.unsubscribers.push(unsubMessage, unsubStatus);
  }

  private setupStoreListeners(): void {
    let lastElementsJson = JSON.stringify(useCanvasStore.getState().elements);

    const unsubscribe = useCanvasStore.subscribe(() => {
      const currentElementsJson = JSON.stringify(useCanvasStore.getState().elements);
      if (currentElementsJson !== lastElementsJson) {
        lastElementsJson = currentElementsJson;
        this.saveToIndexedDB();
      }
    });

    this.unsubscribers.push(unsubscribe);
  }

  private handleIncomingMessage(msg: CanvasOperation): void {
    if (msg.clientId === wsManager.getClientId()) {
      return;
    }

    if (processedOperations.has(msg.id)) {
      return;
    }

    const localSeq = useCanvasStore.getState().getSequence();
    const msgSeq = msg.sequence || 0;

    if (msgSeq > 0 && msgSeq <= localSeq && msg.type !== 'snapshot') {
      console.log(`[Sync] Skipping old op (seq ${msgSeq} <= local ${localSeq})`);
      return;
    }

    if (msg.type === 'snapshot') {
      const snapshotElements = msg.payload as CanvasElement[];
      const localElements = useCanvasStore.getState().elements;

      if (snapshotElements.length > localElements.length) {
        console.log('[Sync] Applying remote snapshot, elements:', snapshotElements.length);
        processedOperations.add(msg.id);
        useCanvasStore.getState().applyRemoteOperation(msg);
      } else if (localElements.length > 0) {
        console.log('[Sync] Local has more elements, sending local snapshot');
        this.sendLocalSnapshot();
      }
      return;
    }

    if (pendingOperations.length > 0) {
      pendingOperations.push(msg);
      pendingOperations.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

      const nextOp = pendingOperations.shift();
      if (nextOp) {
        this.applyOperation(nextOp);
      }
    } else {
      this.applyOperation(msg);
    }
  }

  private applyOperation(op: CanvasOperation): void {
    if (processedOperations.has(op.id)) return;
    processedOperations.add(op.id);

    console.log(`[Sync] Applying remote operation: ${op.type}`, op.id);
    useCanvasStore.getState().applyRemoteOperation(op);
  }

  private sendLocalSnapshot(): void {
    const elements = useCanvasStore.getState().elements;
    const seq = useCanvasStore.getState().getSequence();

    if (elements.length === 0) return;

    wsManager.send({
      type: 'snapshot',
      id: 'snapshot_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      payload: elements,
      sequence: seq,
    });

    console.log('[Sync] Sent local snapshot, elements:', elements.length, 'seq:', seq);
  }

  broadcastOperation(op: Omit<CanvasOperation, 'clientId' | 'timestamp'>): void {
    if (processedOperations.has(op.id)) return;
    processedOperations.add(op.id);
    wsManager.send(op as CanvasOperation);
  }

  bufferLocalOperation(op: Omit<CanvasOperation, 'clientId' | 'timestamp'>): void {
    this.localOperationBuffer.push(op as CanvasOperation);

    if (!this.flushBufferTimeout) {
      this.flushBufferTimeout = setTimeout(() => {
        this.flushBuffer();
      }, 50);
    }
  }

  private flushBuffer(): void {
    if (this.localOperationBuffer.length === 0) {
      this.flushBufferTimeout = null;
      return;
    }

    const ops = [...this.localOperationBuffer];
    this.localOperationBuffer = [];

    ops.forEach((op) => {
      this.broadcastOperation(op);
    });

    this.flushBufferTimeout = null;
  }
}

export const syncManager = new SyncManager();
