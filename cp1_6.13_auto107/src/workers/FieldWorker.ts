import { calculateFieldLines } from '../core/FieldCalculator';

export interface MagnetData {
  id: string;
  position: { x: number; y: number; z: number };
  polarity: 'N' | 'S';
  strength: number;
}

export interface FieldLineData {
  points: { x: number; y: number; z: number }[];
  fieldStrengths: number[];
  magnetId: string;
}

export interface WorkerMessage {
  type: 'calculate' | 'init';
  magnets?: MagnetData[];
  lineCount?: number;
  sceneBounds?: number;
}

export interface WorkerResult {
  type: 'result';
  lines: FieldLineData[];
  timestamp: number;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, magnets, lineCount, sceneBounds } = e.data;

  if (type === 'calculate' && magnets) {
    const lines = calculateFieldLines(
      magnets,
      lineCount || 150,
      sceneBounds || 20
    );
    const result: WorkerResult = {
      type: 'result',
      lines,
      timestamp: Date.now(),
    };
    self.postMessage(result);
  }
};

export {};
