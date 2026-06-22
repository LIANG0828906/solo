import type { SyncAction } from './types';

const CHANNEL_NAME = 'book-co-reading-channel';

type Listener = (action: SyncAction) => void;

class SyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<Listener>();

  init() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (event: MessageEvent<SyncAction>) => {
      this.listeners.forEach((listener) => listener(event.data));
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  broadcast(action: SyncAction): void {
    if (!this.channel) {
      this.init();
    }
    this.channel!.postMessage(action);
  }

  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

export const syncManager = new SyncManager();
