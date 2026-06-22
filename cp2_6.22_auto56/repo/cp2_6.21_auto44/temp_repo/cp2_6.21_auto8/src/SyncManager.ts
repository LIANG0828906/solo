import type { GameStore } from './GameStore';

const SYNC_INTERVAL = 100;
const INTERPOLATION_THRESHOLD = 200;

type Listener = (state: Partial<GameStore>) => void;

class SyncManagerClass {
  private listeners: Set<Listener> = new Set();
  private lastBroadcastTime: number = 0;
  private lastRemoteState: Partial<GameStore> | null = null;
  private simulationInterval: number | null = null;

  start() {
    this.simulationInterval = window.setInterval(() => {
      this.simulateRemoteUpdates();
    }, SYNC_INTERVAL);
  }

  stop() {
    if (this.simulationInterval !== null) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.listeners.clear();
  }

  broadcast(state: Partial<GameStore>) {
    const now = Date.now();
    this.lastBroadcastTime = now;

    const stateWithTimestamp = {
      ...state,
      timestamp: now,
    };

    this.lastRemoteState = stateWithTimestamp;
    this.listeners.forEach((listener) => {
      try {
        listener(stateWithTimestamp);
      } catch (e) {
        console.error('Sync listener error:', e);
      }
    });
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private simulateRemoteUpdates() {
    // Polling simulation - in real WebSocket implementation,
    // this would receive updates from the server
    if (this.lastRemoteState) {
      // Broadcast to all listeners (local clients)
      this.listeners.forEach((listener) => {
        try {
          listener(this.lastRemoteState!);
        } catch (e) {
          console.error('Simulation listener error:', e);
        }
      });
    }
  }

  shouldInterpolate(localTimestamp: number, remoteTimestamp: number): boolean {
    const diff = Math.abs(localTimestamp - remoteTimestamp);
    return diff < INTERPOLATION_THRESHOLD && diff > 0;
  }

  interpolateValue(
    localValue: number,
    remoteValue: number,
    localTimestamp: number,
    remoteTimestamp: number,
  ): number {
    if (!this.shouldInterpolate(localTimestamp, remoteTimestamp)) {
      return remoteValue;
    }

    const diff = Math.abs(localTimestamp - remoteTimestamp);
    const alpha = 1 - diff / INTERPOLATION_THRESHOLD;
    return localValue + (remoteValue - localValue) * alpha;
  }
}

export const SyncManager = new SyncManagerClass();
