import { analyzeShadows } from '../utils/shadowAnalyzer';
import { AnalysisParams, ShadowAnalysisResult } from '../types';

type WorkerMessage =
  | { type: 'analyze'; payload: AnalysisParams }
  | { type: 'cancel' }
  | { type: 'progress'; payload: number }
  | { type: 'result'; payload: ShadowAnalysisResult }
  | { type: 'error'; payload: string };

let isCancelled = false;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;
  const { type } = message;

  if (type === 'cancel') {
    isCancelled = true;
    return;
  }

  if (type === 'analyze') {
    const { payload } = message;
    isCancelled = false;
    const params = payload as AnalysisParams;

    try {
      const result = analyzeShadows(
        params.buildings,
        params.dayOfYear,
        params.latitude,
        params.longitude,
        params.gridSize,
        params.sampleResolution,
        (progress: number) => {
          if (isCancelled) {
            throw new Error('Cancelled');
          }
          self.postMessage({ type: 'progress', payload: progress } as WorkerMessage);
        }
      );

      if (!isCancelled) {
        self.postMessage({ type: 'result', payload: result } as WorkerMessage);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Cancelled') {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      self.postMessage({ type: 'error', payload: errorMessage } as WorkerMessage);
    }
  }
};
