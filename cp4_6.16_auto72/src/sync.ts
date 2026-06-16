import { get, set } from 'idb-keyval';
import { wsManager } from './websocket';
import { useCanvasStore } from './store';
import type { CanvasElement, CanvasOperation } from './types';

const SNAPSHOT_KEY = 'canvas_snapshot';
const processedOperations = new Set<string>();

export class SyncManager {
  private unsubscribers: Array<() => void> = [];
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  async init(wsUrl: string): Promise<void> {
    if (this.isInitialized) return;

    await this.loadFromIndexedDB();
    this.setupWebSocketListeners();
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
    this.isInitialized = false;
  }

  private async loadFromIndexedDB(): Promise<void> {
    try {
      const snapshot = await get<CanvasElement[]>(SNAPSHOT_KEY);
      if (snapshot && Array.isArray(snapshot)) {
        useCanvasStore.getState().loadSnapshot(snapshot);
      }
    } catch (e) {
      console.error('Failed to load snapshot from IndexedDB:', e);
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
        console.error('Failed to save snapshot to IndexedDB:', e);
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
        this.sendSnapshot();
      }
    });

    this.unsubscribers.push(unsubMessage, unsubStatus);

    const unsubscribeStore = useCanvasStore.subscribe(
      (state: { elements: CanvasElement[] }) => {
        this.saveToIndexedDB();
      }
    );
    this.unsubscribers.push(unsubscribeStore);
  }

  private handleIncomingMessage(msg: CanvasOperation): void {
    if (msg.clientId === wsManager.getClientId()) {
      return;
    }

    if (processedOperations.has(msg.id)) {
      return;
    }
    processedOperations.add(msg.id);

    const store = useCanvasStore.getState();

    switch (msg.type) {
      case 'add': {
        const element = msg.payload as CanvasElement;
        if (!store.elements.find((e) => e.id === element.id)) {
          store.addElement(element, false);
        }
        break;
      }
      case 'update': {
        const element = msg.payload as CanvasElement;
        store.updateElement(element.id, element, false);
        break;
      }
      case 'delete': {
        const element = msg.payload as CanvasElement;
        store.deleteElement(element.id, false);
        break;
      }
      case 'snapshot': {
        const elements = msg.payload as CanvasElement[];
        if (elements.length > 0) {
          store.loadSnapshot(elements);
        }
        break;
      }
    }
  }

  private sendSnapshot(): void {
    const elements = useCanvasStore.getState().elements;
    if (elements.length === 0) return;

    wsManager.send({
      type: 'snapshot',
      id: 'snapshot_' + Date.now(),
      payload: elements,
    });
  }

  broadcastOperation(op: Omit<CanvasOperation, 'clientId' | 'timestamp'>): void {
    if (processedOperations.has(op.id)) return;
    processedOperations.add(op.id);
    wsManager.send(op);
  }
}

export const syncManager = new SyncManager();
