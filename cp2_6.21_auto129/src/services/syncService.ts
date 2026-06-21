type EventHandler = (data: unknown) => void;
type Unsubscribe = () => void;

class SyncService {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private ws: WebSocket | null = null;
  private currentRoom: string | null = null;
  private mockInterval: number | null = null;

  on(event: string, handler: EventHandler): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }

  emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }

  joinRoom(projectId: string): void {
    this.currentRoom = projectId;
    try {
      const wsUrl = `ws://localhost:3001?projectId=${projectId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type) {
            this.emit(parsed.type, parsed.data || parsed);
          }
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onopen = () => {
        // connected
      };
    } catch {
      // WebSocket connection failed, fall through to mock events
    }

    this._startMockEvents();
  }

  leaveRoom(): void {
    this.currentRoom = null;
    this.ws?.close();
    this.ws = null;
    this._stopMockEvents();
  }

  private _startMockEvents(): void {
    this._stopMockEvents();
    const names = ['Alice', 'Bob', 'Charlie', 'Diana'];
    this.mockInterval = window.setInterval(() => {
      if (Math.random() > 0.75) {
        const name = names[Math.floor(Math.random() * names.length)];
        const actions = ['trackUpdated', 'noteAdded', 'noteRemoved', 'trackAdded'] as const;
        const action = actions[Math.floor(Math.random() * actions.length)];
        this.emit(action, {
          userName: name,
          trackName: `Track ${Math.floor(Math.random() * 4) + 1}`,
          field: 'volume',
        });
      }
    }, 10000);
  }

  private _stopMockEvents(): void {
    if (this.mockInterval !== null) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }
}

export const syncService = new SyncService();
