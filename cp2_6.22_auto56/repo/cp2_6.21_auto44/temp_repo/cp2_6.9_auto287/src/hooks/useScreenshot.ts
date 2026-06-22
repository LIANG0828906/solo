import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import { useNavigationStore } from '../store/useNavigationStore';
import { formatTimestamp } from '../utils/mathUtils';

interface ScreenshotState {
  isLoading: boolean;
  error: string | null;
}

export function useScreenshot() {
  const { addLogEntry } = useNavigationStore();
  const [state, setState] = useState<ScreenshotState>({
    isLoading: false,
    error: null,
  });

  const captureScreenshot = useCallback(
    async (elementId: string, description: string): Promise<string | null> => {
      setState({ isLoading: true, error: null });

      try {
        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error(`元素 #${elementId} 未找到`);
        }

        const canvas = await html2canvas(element, {
          backgroundColor: '#0b1628',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });

        const dataUrl = canvas.toDataURL('image/png');
        const timestamp = Date.now();
        const timestampStr = formatTimestamp(timestamp);
        const fullDescription = `${description} - ${timestampStr}`;

        addLogEntry(dataUrl, fullDescription);

        setState({ isLoading: false, error: null });
        return dataUrl;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '截图失败';
        setState({ isLoading: false, error: errorMessage });
        console.error('截图失败:', error);
        return null;
      }
    },
    [addLogEntry]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    captureScreenshot,
    isLoading: state.isLoading,
    error: state.error,
    clearError,
  };
}
