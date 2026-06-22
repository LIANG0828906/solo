import { useState, useEffect } from 'react';
import axios from 'axios';

export interface RecommendedItem {
  id: number;
  name: string;
}

export function useRecommendation(currentId: number) {
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/exhibitions/${currentId}/recommend`);
        if (!cancelled) {
          setRecommendations(res.data);
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  return { recommendations, loading };
}
