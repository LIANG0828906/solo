import { useState, useCallback } from 'react';

export interface OptimisticState<T> {
  data: T;
  isPending: boolean;
  error: Error | null;
}

export function useOptimisticUpdate<T, A extends unknown[]>(
  initialData: T,
  mutation: (...args: A) => Promise<T>,
  applyOptimistic: (current: T, ...args: A) => T,
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isPending: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: A): Promise<T> => {
      const previousData = state.data;
      const optimisticData = applyOptimistic(previousData, ...args);

      setState({ data: optimisticData, isPending: true, error: null });

      try {
        const result = await mutation(...args);
        setState({ data: result, isPending: false, error: null });
        return result;
      } catch (err) {
        setState({ data: previousData, isPending: false, error: err as Error });
        throw err;
      }
    },
    [state.data, mutation, applyOptimistic],
  );

  const setData = useCallback((data: T) => {
    setState((s) => ({ ...s, data }));
  }, []);

  return { ...state, execute, setData };
}
