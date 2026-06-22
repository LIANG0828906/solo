import type { SandboxRunMessage, SandboxTestMessage, SandboxResultMessage, SandboxTestResultMessage } from '@/types';

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('./sandbox.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return worker;
}

export function runCode(
  code: string,
  language: 'javascript' | 'python'
): Promise<SandboxResultMessage> {
  return new Promise((resolve) => {
    const w = getWorker();
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'run_result') {
        w.removeEventListener('message', handler);
        resolve(e.data as SandboxResultMessage);
      }
    };
    w.addEventListener('message', handler);

    const msg: SandboxRunMessage = { type: 'run', code, language };
    w.postMessage(msg);
  });
}

export function runTests(
  code: string,
  functionName: string,
  testCases: { input: string; expectedOutput: string }[],
  language: 'javascript' | 'python'
): Promise<SandboxTestResultMessage> {
  return new Promise((resolve) => {
    const w = getWorker();
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'test_result') {
        w.removeEventListener('message', handler);
        resolve(e.data as SandboxTestResultMessage);
      }
    };
    w.addEventListener('message', handler);

    const msg: SandboxTestMessage = { type: 'test', code, functionName, testCases, language };
    w.postMessage(msg);
  });
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
