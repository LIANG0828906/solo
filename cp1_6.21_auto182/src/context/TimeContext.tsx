import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { TimeContextValue, TimePreset } from '../types';
import { calculateLightParams } from '../utils/lightCalculator';
import { getTimePresets, saveTimePreset } from '../services/api';

export const TimeContext = createContext<TimeContextValue | null>(null);

interface TimeProviderProps {
  children: ReactNode;
}

export function TimeProvider({ children }: TimeProviderProps) {
  const [time, setTimeState] = useState(12);
  const [presets, setPresets] = useState<TimePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsLoading(false);
      }
      setLoadProgress(progress);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const lightParams = useMemo(() => calculateLightParams(time), [time]);

  const setTime = useCallback((t: number) => {
    const normalized = Math.max(0, Math.min(24, t));
    setTimeState(normalized);
  }, []);

  const savePreset = useCallback(async () => {
    try {
      const result = await saveTimePreset(time);
      setPresets((prev) => [result, ...prev]);
    } catch (error) {
      console.error('保存预设失败:', error);
    }
  }, [time]);

  const loadPresets = useCallback(async () => {
    try {
      const result = await getTimePresets();
      setPresets(result);
    } catch (error) {
      console.error('加载预设失败:', error);
    }
  }, []);

  const applyPreset = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id);
      if (preset) {
        setTime(preset.time);
      }
    },
    [presets, setTime]
  );

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  const value: TimeContextValue = {
    time,
    setTime,
    lightParams,
    savePreset,
    loadPresets,
    presets,
    applyPreset,
    isLoading,
    loadProgress
  };

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>;
}
