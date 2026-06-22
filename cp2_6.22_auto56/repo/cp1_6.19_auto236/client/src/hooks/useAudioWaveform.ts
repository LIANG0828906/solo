import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface UseAudioWaveformResult {
  waveformData: number[];
  duration: number;
  startTime: number;
  endTime: number;
  loading: boolean;
  error: string | null;
  setSelection: (start: number, end: number) => void;
  fetchWaveform: (fileId: string, points?: number) => Promise<void>;
}

export function useAudioWaveform(audioUrl?: string, fileId?: string): UseAudioWaveformResult {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWaveform = useCallback(async (fId: string, points: number = 1000) => {
    if (!fId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/waveform', {
        params: { fileId: fId, points },
      });
      const data = res.data;
      setWaveformData(data.amplitude || []);
      setDuration(data.duration || 0);
      setStartTime(0);
      setEndTime(data.duration || 0);
    } catch (e: any) {
      setError(e?.message || '获取波形数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fileId) {
      fetchWaveform(fileId);
    }
  }, [fileId, fetchWaveform]);

  const setSelection = useCallback((start: number, end: number) => {
    const s = Math.max(0, Math.min(start, end));
    const e = Math.max(0, Math.max(start, end));
    setStartTime(s);
    setEndTime(e);
  }, []);

  return {
    waveformData,
    duration,
    startTime,
    endTime,
    loading,
    error,
    setSelection,
    fetchWaveform,
  };
}
