import { useState, useCallback, useRef } from 'react';
import type { DataPoint, LoadingState, DataSourceType } from './types';
import { generateMockData, parseCSV } from './dataParser';

export function useDataProvider() {
  const [timeSeriesData, setTimeSeriesData] = useState<DataPoint[][]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: 'idle',
    progress: 0,
  });
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>('mock');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadMockData = useCallback(() => {
    setLoadingState({ status: 'loading', progress: 0, message: '生成模拟数据中...' });
    setDataSourceType('mock');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 12;
      setLoadingState({ status: 'loading', progress: Math.min(progress, 90), message: '生成模拟数据中...' });
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const data = generateMockData();
      setTimeSeriesData(data);
      setCurrentTimeIndex(0);
      setLoadingState({ status: 'loaded', progress: 100, message: '数据加载完成' });
    }, 700);
  }, []);

  const loadCSVData = useCallback((file: File) => {
    setLoadingState({ status: 'loading', progress: 0, message: '读取CSV文件中...' });
    setDataSourceType('csv');

    const reader = new FileReader();
    let progress = 0;

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        progress = Math.round((e.loaded / e.total) * 60);
        setLoadingState({ status: 'loading', progress, message: '读取CSV文件中...' });
      }
    };

    reader.onload = (e) => {
      try {
        setLoadingState({ status: 'loading', progress: 75, message: '解析数据中...' });
        const content = e.target?.result as string;
        setTimeout(() => {
          try {
            const data = parseCSV(content);
            setTimeSeriesData(data);
            setCurrentTimeIndex(0);
            setLoadingState({ status: 'loaded', progress: 100, message: '数据加载完成' });
          } catch (err) {
            setLoadingState({
              status: 'error',
              progress: 0,
              message: err instanceof Error ? err.message : '解析失败',
            });
          }
        }, 300);
      } catch (err) {
        setLoadingState({
          status: 'error',
          progress: 0,
          message: err instanceof Error ? err.message : '读取失败',
        });
      }
    };

    reader.onerror = () => {
      setLoadingState({ status: 'error', progress: 0, message: '文件读取失败' });
    };

    reader.readAsText(file);
  }, []);

  const triggerFileInput = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.style.display = 'none';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          loadCSVData(file);
        }
        document.body.removeChild(input);
      };
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    fileInputRef.current.click();
  }, [loadCSVData]);

  const setTimeProgress = useCallback((progress: number) => {
    if (timeSeriesData.length === 0) return;
    const maxIndex = timeSeriesData.length - 1;
    const index = Math.round(progress * maxIndex);
    setCurrentTimeIndex(Math.max(0, Math.min(index, maxIndex)));
  }, [timeSeriesData.length]);

  const currentDataSlice = timeSeriesData[currentTimeIndex] || [];
  const currentTimestamp = currentDataSlice[0]?.time || '';
  const totalTimeSteps = timeSeriesData.length;
  const timeProgress = totalTimeSteps > 1 ? currentTimeIndex / (totalTimeSteps - 1) : 0;

  return {
    timeSeriesData,
    currentDataSlice,
    currentTimestamp,
    currentTimeIndex,
    totalTimeSteps,
    timeProgress,
    loadingState,
    dataSourceType,
    loadMockData,
    triggerFileInput,
    setTimeProgress,
    setCurrentTimeIndex,
  };
}
