import type { GestureData, WorkerMessage } from '@/types';

export class GestureTracker {
  private worker: Worker | null = null;
  private video: HTMLVideoElement;
  private onData: (data: GestureData) => void;

  constructor(videoElement: HTMLVideoElement, onData: (data: GestureData) => void) {
    this.video = videoElement;
    this.onData = onData;
  }

  start(): void {
    this.worker = new Worker(new URL('./gesture.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.type === 'gestureData') {
        this.onData(message.data);
      } else if (message.type === 'ready') {
        console.log('Gesture worker ready');
      }
    };
    this.worker.postMessage({ type: 'init' });
  }

  stop(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
