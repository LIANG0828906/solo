import { useState, useEffect, useCallback } from 'react';
import { ChartSummary, ChartData, Comment } from '../types';

export function useCharts() {
  const [charts, setCharts] = useState<ChartSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCharts = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = search 
        ? `/api/charts?search=${encodeURIComponent(search)}`
        : '/api/charts';
      const response = await fetch(url);
      const data = await response.json();
      setCharts(data);
    } catch (err) {
      setError('获取星盘列表失败');
      console.error('Failed to fetch charts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  return { charts, loading, error, refetch: fetchCharts };
}

export function useChartDetail(chartId: string | undefined) {
  const [chart, setChart] = useState<ChartData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChartDetail = useCallback(async () => {
    if (!chartId) return;
    
    setLoading(true);
    setError(null);
    try {
      const [chartRes, commentsRes] = await Promise.all([
        fetch(`/api/charts/${chartId}`),
        fetch(`/api/comments?chartId=${chartId}`),
      ]);
      
      const chartData = await chartRes.json();
      const commentsData = await commentsRes.json();
      
      setChart(chartData);
      setComments(commentsData);
    } catch (err) {
      setError('获取星盘详情失败');
      console.error('Failed to fetch chart detail:', err);
    } finally {
      setLoading(false);
    }
  }, [chartId]);

  useEffect(() => {
    fetchChartDetail();
  }, [fetchChartDetail]);

  const addComment = useCallback(async (userId: string, content: string) => {
    if (!chartId || !content.trim()) return null;
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId, userId, content }),
      });
      const newComment = await response.json();
      setComments(prev => [...prev, newComment]);
      return newComment;
    } catch (err) {
      console.error('Failed to add comment:', err);
      return null;
    }
  }, [chartId]);

  const likeChart = useCallback(async () => {
    if (!chartId) return null;
    
    try {
      const response = await fetch(`/api/charts/${chartId}/like`, {
        method: 'PUT',
      });
      const data = await response.json();
      if (data.success) {
        setChart(prev => prev ? { ...prev, likes: data.likes } : null);
      }
      return data;
    } catch (err) {
      console.error('Failed to like chart:', err);
      return null;
    }
  }, [chartId]);

  return { chart, comments, loading, error, refetch: fetchChartDetail, addComment, likeChart };
}

export function useFavorites(userId: string | undefined) {
  const [favorites, setFavorites] = useState<ChartSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/favorites?userId=${userId}`);
      const data = await response.json();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (chartId: string) => {
    if (!userId) return false;
    
    try {
      const checkRes = await fetch(`/api/favorites/check?userId=${userId}&chartId=${chartId}`);
      const { isFavorited } = await checkRes.json();
      
      if (isFavorited) {
        await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, chartId }),
        });
        setFavorites(prev => prev.filter(f => f.id !== chartId));
        return false;
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, chartId }),
        });
        fetchFavorites();
        return true;
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      return false;
    }
  }, [userId, fetchFavorites]);

  const checkFavorite = useCallback(async (chartId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const response = await fetch(`/api/favorites/check?userId=${userId}&chartId=${chartId}`);
      const data = await response.json();
      return data.isFavorited;
    } catch (err) {
      console.error('Failed to check favorite:', err);
      return false;
    }
  }, [userId]);

  return { favorites, loading, toggleFavorite, checkFavorite, refetch: fetchFavorites };
}
