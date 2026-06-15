import { useState, useCallback } from 'react';
import type { Exhibition } from '../types';

export function useExhibition() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveExhibition = useCallback(async (data: Exhibition): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/exhibition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save');
      const { id } = await res.json();
      return id;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExhibition = useCallback(async (id: string): Promise<Exhibition | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exhibition/${id}`);
      if (!res.ok) throw new Error('Exhibition not found');
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveExhibition, loadExhibition, loading, error };
}
