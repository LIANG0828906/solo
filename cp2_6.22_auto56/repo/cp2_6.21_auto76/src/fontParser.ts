import type { ParsedFont, GlyphData, PathCommand } from './types';

let worker: Worker | null = null;
const pendingResolvers = new Map<string, {
  resolve: (data: any) => void;
  reject: (err: Error) => void;
}>();
const pendingCharResolvers = new Map<string, {
  resolve: (data: any) => void;
  reject: (err: Error) => void;
}>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('./fontParser.worker.ts', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = (e: MessageEvent) => {
      const { type, id } = e.data;
      if (type === 'parsed') {
        const resolver = pendingResolvers.get(id);
        if (resolver) {
          pendingResolvers.delete(id);
          resolver.resolve(e.data.data);
        }
      } else if (type === 'charsUpdated') {
        const resolver = pendingCharResolvers.get(id);
        if (resolver) {
          pendingCharResolvers.delete(id);
          resolver.resolve({ glyphs: e.data.glyphs, kerningValues: e.data.kerningValues });
        }
      } else if (type === 'error') {
        const resolver = pendingResolvers.get(id);
        if (resolver) {
          pendingResolvers.delete(id);
          resolver.reject(new Error(e.data.error));
        }
      }
    };
  }
  return worker;
}

export function parseFont(
  buffer: ArrayBuffer,
  chars: string
): Promise<ParsedFont> {
  const w = getWorker();
  const id = `font_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return new Promise<ParsedFont>((resolve, reject) => {
    pendingResolvers.set(id, { resolve, reject });
    w.postMessage({ type: 'parse', id, buffer, chars }, [buffer]);
  });
}

export function updateChars(
  id: string,
  chars: string
): Promise<{ glyphs: Record<string, GlyphData>; kerningValues: Record<string, number> }> {
  const w = getWorker();
  return new Promise((resolve, reject) => {
    pendingCharResolvers.set(id, { resolve, reject });
    w.postMessage({ type: 'updateChars', id, chars });
  });
}

export function disposeFont(id: string): void {
  const w = getWorker();
  w.postMessage({ type: 'dispose', id });
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingResolvers.clear();
    pendingCharResolvers.clear();
  }
}
