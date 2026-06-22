export class SyncClient {
  private listeners: Map<string, Function[]> = new Map();
  private pollingInterval: number | null = null;
  private serverState: any = null;

  connect(): void {
    this.pollingInterval = window.setInterval(() => {
      if (this.serverState !== null) {
        this.notify('stateUpdate', this.serverState);
      }
    }, 500);
  }

  disconnect(): void {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  send(message: { type: string; payload: any }): void {
    this.serverState = message.payload;
    this.notify(message.type, message.payload);
  }

  on(event: string, callback: (data: any) => void): void {
    const existing = this.listeners.get(event);
    if (existing) {
      existing.push(callback);
    } else {
      this.listeners.set(event, [callback]);
    }
  }

  off(event: string, callback: Function): void {
    const existing = this.listeners.get(event);
    if (existing) {
      this.listeners.set(
        event,
        existing.filter((cb) => cb !== callback)
      );
    }
  }

  private notify(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) {
        cb(data);
      }
    }
  }
}

export default SyncClient;
