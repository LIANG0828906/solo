import type { PipeData, RawPipeInput } from '../types';
import { usePipeStore } from '../store';

export function parsePipeData(raw: RawPipeInput[]): PipeData[] {
  return raw.map((item, index) => ({
    id: item.id ?? `pipe-${index}`,
    type: item.type,
    start: {
      x: item.start.x,
      y: item.start.y,
      z: item.start.z,
    },
    end: {
      x: item.end.x,
      y: item.end.y,
      z: item.end.z,
    },
    radius: item.radius,
    depth: item.depth ?? 0,
  }));
}

export function addPipe(pipe: PipeData): void {
  usePipeStore.getState().addPipe(pipe);
}

export function removePipe(id: string): void {
  usePipeStore.getState().removePipe(id);
}
