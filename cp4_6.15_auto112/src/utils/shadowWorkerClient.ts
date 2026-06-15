import { AnalysisParams, ShadowAnalysisResult } from '../types';

type WorkerMessage =
  | { type: 'analyze'; payload: AnalysisParams }
  | { type: 'cancel' }
  | { type: 'progress'; payload: number }
  | { type: 'result'; payload: ShadowAnalysisResult }
  | { type: 'error'; payload: string };

export class ShadowAnalysisWorker {
  private worker: Worker | null = null;
  private resolve: ((value: ShadowAnalysisResult) => void) | null = null;
  private reject: ((reason: string) => void) | null = null;
  private onProgress: ((progress: number) => void) | null = null;

  constructor() {}

  private createWorker(): Worker {
    const worker = new Worker(new URL('../workers/shadowWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const message = e.data;

      if (message.type === 'progress') {
        this.onProgress?.(message.payload);
      } else if (message.type === 'result') {
        this.resolve?.(message.payload);
        this.cleanup();
      } else if (message.type === 'error') {
        this.reject?.(message.payload);
        this.cleanup();
      }
    };

    worker.onerror = (e) => {
      this.reject?.(e.message || 'Worker error');
      this.cleanup();
    };

    return worker;
  }

  analyze(
    params: AnalysisParams,
    onProgress?: (progress: number) => void
  ): Promise<ShadowAnalysisResult> {
    if (this.worker) {
      this.cancel();
    }

    this.worker = this.createWorker();
    this.onProgress = onProgress || null;

    return new Promise<ShadowAnalysisResult>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;

      this.worker?.postMessage({
        type: 'analyze',
        payload: params,
      } as WorkerMessage);
    });
  }

  cancel(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'cancel' } as WorkerMessage);
      this.reject?.('Cancelled');
      this.cleanup();
    }
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.resolve = null;
    this.reject = null;
    this.onProgress = null;
    this.worker = null;
  }
}

export const shadowAnalysisWorker = new ShadowAnalysisWorker();
