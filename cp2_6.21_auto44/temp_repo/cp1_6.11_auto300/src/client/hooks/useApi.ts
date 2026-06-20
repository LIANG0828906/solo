import { useState, useCallback, useEffect } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  fetchFn: () => Promise<T>,
  autoFetch = true,
  deps: unknown[] = []
): ApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: autoFetch,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchFn();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : '请求失败',
      });
    }
  }, [fetchFn]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [...deps, refetch, autoFetch]);

  return { ...state, refetch };
}

export function useMutation<Args extends unknown[], Result>(
  mutationFn: (...args: Args) => Promise<Result>
): {
  mutate: (...args: Args) => Promise<Result>;
  loading: boolean;
  error: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (...args: Args): Promise<Result> => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFn(...args);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [mutationFn]);

  return { mutate, loading, error };
}
