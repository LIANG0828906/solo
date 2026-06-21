import { useState, useEffect, useCallback } from 'react';
import { Molecule, ReactionResult } from '@/types';

const API_BASE = '/api';

export function useMoleculeData() {
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMolecules = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/molecules`);
        if (!response.ok) throw new Error('获取分子数据失败');
        const data = await response.json();
        setMolecules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };
    fetchMolecules();
  }, []);

  const react = useCallback(
    async (molecule1Id: string, molecule2Id: string): Promise<ReactionResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/react`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ molecule1Id, molecule2Id }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '反应请求失败');
        }
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : '反应失败');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getMoleculeById = useCallback(
    (id: string): Molecule | undefined => {
      return molecules.find(m => m.id === id);
    },
    [molecules]
  );

  return {
    molecules,
    loading,
    error,
    react,
    getMoleculeById,
  };
}
