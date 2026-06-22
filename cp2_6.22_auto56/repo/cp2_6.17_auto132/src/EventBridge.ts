type EventCallback = (data: unknown) => void;

class EventBridgeClass {
  private target: EventTarget;

  constructor() {
    this.target = new EventTarget();
  }

  init(): void {}

  on(event: string, callback: EventCallback): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<unknown>;
      callback(customEvent.detail);
    };
    this.target.addEventListener(event, handler);
    return () => {
      this.target.removeEventListener(event, handler);
    };
  }

  emit(event: string, data?: unknown): void {
    const customEvent = new CustomEvent(event, { detail: data });
    this.target.dispatchEvent(customEvent);
  }
}

const EventBridge = new EventBridgeClass();

export default EventBridge;
