import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Lens, LensStatus } from '../types';

interface UseLensDataReturn {
  lenses: Lens[];
  loading: boolean;
  error: string | null;
  fetchLenses: () => Promise<void>;
  createLens: (data: Partial<Lens>) => Promise<Lens | null>;
  updateLensStatus: (id: string, status: LensStatus, reviewNotes?: string) => Promise<Lens | null>;
  deleteLens: (id: string) => Promise<boolean>;
}

export function useLensData(): UseLensDataReturn {
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<Lens[]>('/api/lenses');
      setLenses(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLens = useCallback(async (data: Partial<Lens>): Promise<Lens | null> => {
    setError(null);
    try {
      const res = await axios.post<Lens>('/api/lenses', data);
      setLenses((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
      return null;
    }
  }, []);

  const updateLensStatus = useCallback(
    async (id: string, status: LensStatus, reviewNotes?: string): Promise<Lens | null> => {
      setError(null);
      try {
        const payload: { status: LensStatus; reviewNotes?: string } = { status };
        if (reviewNotes !== undefined) payload.reviewNotes = reviewNotes;
        const res = await axios.put<Lens>(`/api/lenses/${id}`, payload);
        setLenses((prev) => prev.map((l) => (l.id === id ? res.data : l)));
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新失败');
        return null;
      }
    },
    []
  );

  const deleteLens = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await axios.delete(`/api/lenses/${id}`);
      setLenses((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      return false;
    }
  }, []);

  return { lenses, loading, error, fetchLenses, createLens, updateLensStatus, deleteLens };
}
