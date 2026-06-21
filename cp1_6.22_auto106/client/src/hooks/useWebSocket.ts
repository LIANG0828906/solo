import { useState, useEffect, useCallback, useRef } from 'react';

interface PollState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useWebSocket<T>(
  url: string,
  interval: number = 3000,
  enabled: boolean = true
) {
  const [state, setState] = useState<PollState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const previousDataRef = useRef<T | null>(null);
  const timerRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as T;
      setState({ data, loading: false, error: null });
      previousDataRef.current = data;
    } catch (err) {
      setState({
        data: previousDataRef.current,
        loading: false,
        error: err instanceof Error ? err.message : '未知错误',
      });
    }
  }, [url, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    fetchData();
    timerRef.current = window.setInterval(fetchData, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fetchData, interval, enabled]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch,
  };
}
