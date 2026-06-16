import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/helpers';
import type { Comment, Member } from '@/types';

export const CommentBoard = {
  getCommentsByChapter(chapterId: string): Comment[] {
    return useAppStore.getState().comments
      .filter(c => c.chapterId === chapterId && c.parentId === null)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getRepliesByComment(commentId: string): Comment[] {
    return useAppStore.getState().comments
      .filter(c => c.parentId === commentId)
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  getCommentsByHighlight(highlightId: string): Comment[] {
    return useAppStore.getState().comments
      .filter(c => c.highlightId === highlightId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getMemberById(memberId: string): Member | undefined {
    return useAppStore.getState().members.find(m => m.id === memberId);
  },

  addComment(
    chapterId: string,
    memberId: string,
    content: string,
    highlightId: string | null = null,
    parentId: string | null = null
  ): Comment {
    const state = useAppStore.getState();

    const comment: Comment = {
      id: generateId(),
      chapterId,
      memberId,
      highlightId,
      parentId,
      content,
      createdAt: Date.now(),
    };

    state.addComment(comment);
    state.addToast('评论发布成功！', 'success');

    return comment;
  },

  getCommentCount(chapterId: string): number {
    return useAppStore.getState().comments.filter(c => c.chapterId === chapterId).length;
  },

  getPaginatedComments(
    chapterId: string,
    page: number = 1,
    pageSize: number = 30
  ): { comments: Comment[]; hasMore: boolean; total: number } {
    const allComments = this.getCommentsByChapter(chapterId);
    const total = allComments.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const comments = allComments.slice(start, end);
    const hasMore = end < total;

    return { comments, hasMore, total };
  },

  getCommentWithReplies(commentId: string): { comment: Comment | undefined; replies: Comment[] } {
    const state = useAppStore.getState();
    const comment = state.comments.find(c => c.id === commentId);
    const replies = state.comments.filter(c => c.parentId === commentId);
    return { comment, replies: replies.sort((a, b) => a.createdAt - b.createdAt) };
  },

  getMemberCommentCount(memberId: string): number {
    return useAppStore.getState().comments.filter(c => c.memberId === memberId).length;
  },
};
