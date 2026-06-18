import { useState, useCallback, useEffect } from 'react';
import type { Excerpt } from '../types';

interface PendingAnnotation {
  excerptId: string;
  annotation: string;
}

export function useAnnotations(
  excerpts: Excerpt[],
  updateExcerpt: (id: string, updates: Partial<Omit<Excerpt, 'id' | 'createdAt'>>) => void
) {
  const [pendingAnnotations, setPendingAnnotations] = useState<Map<string, string>>(new Map());
  const [debounceTimers, setDebounceTimers] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      debounceTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [debounceTimers]);

  const getAnnotation = useCallback(
    (excerptId: string): string => {
      if (pendingAnnotations.has(excerptId)) {
        return pendingAnnotations.get(excerptId) || '';
      }
      const excerpt = excerpts.find((e) => e.id === excerptId);
      return excerpt?.annotation || '';
    },
    [excerpts, pendingAnnotations]
  );

  const setAnnotation = useCallback(
    (excerptId: string, annotation: string) => {
      setPendingAnnotations((prev) => {
        const next = new Map(prev);
        next.set(excerptId, annotation);
        return next;
      });
      setDebounceTimers((prevTimers) => {
        const existingTimer = prevTimers.get(excerptId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        const nextTimers = new Map(prevTimers);
        const timer = setTimeout(() => {
          updateExcerpt(excerptId, { annotation });
          setPendingAnnotations((prev) => {
            const next = new Map(prev);
            next.delete(excerptId);
            return next;
          });
        }, 500);
        nextTimers.set(excerptId, timer);
        return nextTimers;
      });
    },
    [updateExcerpt]
  );

  const saveAnnotationImmediately = useCallback(
    (excerptId: string, annotation: string) => {
      const timer = debounceTimers.get(excerptId);
      if (timer) clearTimeout(timer);
      updateExcerpt(excerptId, { annotation });
      setPendingAnnotations((prev) => {
        const next = new Map(prev);
        next.delete(excerptId);
        return next;
      });
    },
    [debounceTimers, updateExcerpt]
  );

  const flushAll = useCallback(() => {
    pendingAnnotations.forEach((annotation, id) => {
      updateExcerpt(id, { annotation });
    });
    setPendingAnnotations(new Map());
  }, [pendingAnnotations, updateExcerpt]);

  return {
    getAnnotation,
    setAnnotation,
    saveAnnotationImmediately,
    flushAll,
  };
}
