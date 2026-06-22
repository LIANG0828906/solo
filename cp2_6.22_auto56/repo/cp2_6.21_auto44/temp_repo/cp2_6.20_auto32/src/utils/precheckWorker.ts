import type { GrammarError } from '@/types';

let worker: Worker | null = null;

export function getPrecheckWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/precheck.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return worker;
}

export function precheckInWorker(content: string): Promise<GrammarError[]> {
  return new Promise((resolve) => {
    const w = getPrecheckWorker();
    const handleMessage = (e: MessageEvent) => {
      w.removeEventListener('message', handleMessage);
      resolve(e.data.errors as GrammarError[]);
    };
    w.addEventListener('message', handleMessage);
    w.postMessage({ content });
  });
}

export function terminatePrecheckWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
