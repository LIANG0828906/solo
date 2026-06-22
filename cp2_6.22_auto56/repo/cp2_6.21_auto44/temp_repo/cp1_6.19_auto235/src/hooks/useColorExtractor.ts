import { useCallback, useRef } from 'react';
import { useDesignStore } from '../store/useDesignStore';

interface ExtractionResult {
  primary: string[];
  accent: string[];
}

export function useColorExtractor() {
  const setColors = useDesignStore(state => state.setColors);
  const setIsExtracting = useDesignStore(state => state.setIsExtracting);
  const setError = useDesignStore(state => state.setError);
  const workerRef = useRef<Worker | null>(null);

  const extractColors = useCallback(async (imageData: string): Promise<ExtractionResult | null> => {
    setIsExtracting(true);
    setError(null);

    try {
      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('../workers/colorWorker.ts', import.meta.url),
          { type: 'module' }
        );
      }

      const worker = workerRef.current;

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          const fallback: ExtractionResult = {
            primary: ['#4A90D9', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
            accent: ['#FFEAA7', '#DDA0DD', '#98D8C8']
          };
          setColors(fallback.primary, fallback.accent);
          resolve(fallback);
        }, 1000);

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeoutId);
          if (e.data.type === 'success') {
            const result: ExtractionResult = {
              primary: e.data.primaryColors,
              accent: e.data.accentColors
            };
            setColors(result.primary, result.accent);
            resolve(result);
          } else {
            setError(e.data.error || '颜色提取失败');
            const fallback: ExtractionResult = {
              primary: ['#4A90D9', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
              accent: ['#FFEAA7', '#DDA0DD', '#98D8C8']
            };
            setColors(fallback.primary, fallback.accent);
            resolve(fallback);
          }
          worker.removeEventListener('message', handleMessage);
        };

        worker.addEventListener('message', handleMessage);

        worker.postMessage({
          type: 'extract',
          imageData,
          primaryCount: 5,
          accentCount: 3
        });
      });
    } catch (err) {
      setIsExtracting(false);
      setError(err instanceof Error ? err.message : '颜色提取失败');
      return null;
    }
  }, [setColors, setIsExtracting, setError]);

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    extractColors,
    terminate
  };
}
