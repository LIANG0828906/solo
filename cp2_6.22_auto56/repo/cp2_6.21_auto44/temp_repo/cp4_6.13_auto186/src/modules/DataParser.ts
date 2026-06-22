import type { OceanDataset, WorkerMessage, WorkerResult } from '../types';

export class DataParser {
  private worker: Worker | null = null;
  private pendingResolve: ((value: OceanDataset) => void) | null = null;
  private pendingReject: ((reason: any) => void) | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new Worker(new URL('../workers/data.worker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (event: MessageEvent<WorkerResult>) => {
        this.handleMessage(event.data);
      };

      this.worker.onerror = (error) => {
        if (this.pendingReject) {
          this.pendingReject(new Error(error.message));
          this.pendingReject = null;
          this.pendingResolve = null;
        }
      };
    } catch (error) {
      console.error('Failed to initialize worker:', error);
    }
  }

  private handleMessage(result: WorkerResult) {
    switch (result.type) {
      case 'parseComplete':
        if (result.error) {
          if (this.pendingReject) {
            this.pendingReject(new Error(result.error));
          }
        } else {
          if (this.pendingResolve && result.payload?.dataset) {
            this.pendingResolve(result.payload.dataset);
          }
        }
        this.pendingResolve = null;
        this.pendingReject = null;
        break;
    }
  }

  async parseCSV(file: File): Promise<OceanDataset> {
    return new Promise((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (this.worker) {
          const message: WorkerMessage = {
            type: 'parse',
            payload: { csvText: text }
          };
          this.worker.postMessage(message);
        } else {
          reject(new Error('Worker not initialized'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  async parseCSVText(csvText: string): Promise<OceanDataset> {
    return new Promise((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      if (this.worker) {
        const message: WorkerMessage = {
          type: 'parse',
          payload: { csvText }
        };
        this.worker.postMessage(message);
      } else {
        reject(new Error('Worker not initialized'));
      }
    });
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingResolve = null;
    this.pendingReject = null;
  }
}
