import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseRequestOptions<T> {
  autoRun?: boolean;
  initialData?: T;
  silentError?: boolean;
}

export interface UseRequestResult<T, F extends (...args: any[]) => Promise<T>> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  run: (...args: Parameters<F>) => Promise<T>;
  reset: () => void;
  mutate: (newData: T | ((prev: T | undefined) => T)) => void;
}

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    if (err.response?.data?.detail) {
      return err.response.data.detail;
    }
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.message) {
      return err.message;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  return '请求失败，请稍后重试';
};

const dispatchToast = (message: string, type: 'error' | 'success' | 'warning' = 'error'): void => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('toast', { detail: { message, type } });
    window.dispatchEvent(event);
  }
};

export function useRequest<T, F extends (...args: any[]) => Promise<T>>(
  factory: F,
  options: UseRequestOptions<T> = {}
): UseRequestResult<T, F> {
  const { autoRun = true, initialData, silentError = false } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pendingPromiseRef = useRef<Promise<T> | null>(null);
  const factoryRef = useRef<F>(factory);
  const silentErrorRef = useRef<boolean>(silentError);

  useEffect(() => {
    factoryRef.current = factory;
  }, [factory]);

  useEffect(() => {
    silentErrorRef.current = silentError;
  }, [silentError]);

  const run = useCallback(
    (...args: Parameters<F>): Promise<T> => {
      if (pendingPromiseRef.current) {
        return pendingPromiseRef.current;
      }

      setLoading(true);
      setError(null);

      const promise = factoryRef
        .current(...args)
        .then((result: T) => {
          setData(result);
          return result;
        })
        .catch((err: unknown) => {
          const message = extractErrorMessage(err);
          setError(message);
          if (!silentErrorRef.current) {
            dispatchToast(message, 'error');
          }
          throw err;
        })
        .finally(() => {
          setLoading(false);
          pendingPromiseRef.current = null;
        });

      pendingPromiseRef.current = promise;
      return promise;
    },
    []
  );

  const reset = useCallback((): void => {
    setData(initialData);
    setLoading(false);
    setError(null);
    pendingPromiseRef.current = null;
  }, [initialData]);

  const mutate = useCallback(
    (newData: T | ((prev: T | undefined) => T)): void => {
      if (typeof newData === 'function') {
        const updater = newData as (prev: T | undefined) => T;
        setData((prev) => updater(prev));
      } else {
        setData(newData);
      }
    },
    []
  );

  useEffect(() => {
    if (autoRun) {
      run(...([] as unknown as Parameters<F>));
    }
  }, [autoRun, run]);

  return { data, loading, error, run, reset, mutate };
}

export type UseMutationResult<T, F extends (...args: any[]) => Promise<T>> = UseRequestResult<T, F>;

export function useMutation<T, F extends (...args: any[]) => Promise<T>>(
  factory: F,
  options: Omit<UseRequestOptions<T>, 'autoRun'> = {}
): UseMutationResult<T, F> {
  return useRequest<T, F>(factory, { ...options, autoRun: false });
}
