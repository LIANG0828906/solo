import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import CommentItem from './CommentItem';
import { useUiController as useStore } from '../module3/uiController';
import * as db from '../utils/db';
import type { Comment } from '../types';

interface CommentListProps {
  recipeId: string;
  currentUserId: string;
  onCommentAdded?: (comment: Comment) => void;
}

export default function CommentList({
  recipeId,
  currentUserId,
  onCommentAdded,
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addComment, deleteComment, currentUser, showToast } = useStore();

  const loadComments = async () => {
    try {
      const allComments = await db.getAll<Comment>('comments');
      const recipeComments = allComments
        .filter((c) => c.recipeId === recipeId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(recipeComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  useEffect(() => {
    loadComments();
  }, [recipeId, loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await addComment(recipeId, newComment.trim());
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      onCommentAdded?.(comment);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const success = await deleteComment(commentId);
      if (success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showToast('删除评论失败', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg">评论 ({comments.length})</h4>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={currentUser ? '写下你的评论...' : '请先登录'}
          className={cn('input flex-1', !currentUser && 'bg-gray-100')}
          disabled={!currentUser || isSubmitting}
        />
        <button
          type="submit"
          className={cn(
            'btn btn-primary',
            (!newComment.trim() || !currentUser) && 'opacity-50 cursor-not-allowed'
          )}
          disabled={!newComment.trim() || !currentUser || isSubmitting}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y-1">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无评论，来发表第一条评论吧！
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwner={comment.userId === currentUserId}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
