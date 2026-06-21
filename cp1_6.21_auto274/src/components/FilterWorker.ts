import type { StyleType, FilterParams } from '../types';
import { applyFilter } from '../utils/styleFilters';

interface WorkerMessage {
  type: 'process';
  imageData: ImageData;
  style: StyleType;
  params: FilterParams;
}

interface WorkerResponse {
  type: 'processed';
  imageData: ImageData;
}

const ctx: Worker = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, imageData, style, params } = e.data;

  if (type === 'process') {
    try {
      const processed = applyFilter(imageData, style, params);
      const response: WorkerResponse = {
        type: 'processed',
        imageData: processed
      };
      ctx.postMessage(response, [processed.data.buffer as ArrayBuffer]);
    } catch (error) {
      console.error('Filter processing error:', error);
    }
  }
};

export {};
