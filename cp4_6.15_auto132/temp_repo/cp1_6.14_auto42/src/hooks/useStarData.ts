import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Star } from '../types';

export function useStarData() {
  const [stars, setStars] = useState<Star[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/stars');
        setStars(response.data);
        setError(null);
      } catch (err) {
        console.error('加载星系数据失败:', err);
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { stars, loading, error };
}
