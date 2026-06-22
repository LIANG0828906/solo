import { useState, useCallback } from 'react';
import type { Comment, CreateCommentRequest } from '@/types';
import { commentApi } from '@/api/commentApi';

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async (activityId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await commentApi.getComments(activityId);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const createComment = useCallback(async (activityId: string, data: CreateCommentRequest): Promise<Comment | null> => {
    setLoading(true);
    setError(null);
    try {
      const newComment = await commentApi.createComment(activityId, data);
      setComments(prev => [newComment, ...prev]);
      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleLike = useCallback(async (commentId: string, userName: string): Promise<{ likes: number; liked: boolean } | null> => {
    try {
      const result = await commentApi.toggleLike(commentId, userName);
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likes: result.likes } : c
      ));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
      return null;
    }
  }, []);

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    toggleLike,
  };
};
