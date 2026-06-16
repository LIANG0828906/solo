import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { CommentBoard } from '@/modules/social/CommentBoard';
import { useAppStore } from '@/store/useAppStore';
import { formatRelativeTime } from '@/utils/helpers';
import Button from '@/components/Button/Button';
import type { Comment, Member } from '@/types';
import './CommentList.css';

interface CommentWithReplies extends Comment {
  replies: Comment[];
}

interface CommentListProps {
  chapterId: string;
  pageSize?: number;
}

const CommentList = ({ chapterId, pageSize = 30 }: CommentListProps) => {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const memberCache = useRef<Map<string, Member>>(new Map());

  const currentMember = useAppStore((state) => {
    const clubId = state.books.find(b => 
      state.chapters.find(c => c.id === chapterId)?.bookId === b.id
    )?.clubId;
    return clubId ? state.getCurrentMember(clubId) : undefined;
  });

  const getMember = useCallback((memberId: string): Member | undefined => {
    if (memberCache.current.has(memberId)) {
      return memberCache.current.get(memberId);
    }
    const member = CommentBoard.getMemberById(memberId);
    if (member) {
      memberCache.current.set(memberId, member);
    }
    return member;
  }, []);

  const loadComments = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = CommentBoard.getPaginatedComments(chapterId, pageNum, pageSize);
      const commentsWithReplies = result.comments.map(comment => ({
        ...comment,
        replies: CommentBoard.getRepliesByComment(comment.id),
      }));

      if (reset) {
        setComments(commentsWithReplies);
        setPage(pageNum);
      } else {
        setComments(prev => [...prev, ...commentsWithReplies]);
        setPage(pageNum);
      }
      setHasMore(result.hasMore);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [chapterId, pageSize]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    loadComments(page + 1, false);
  }, [loading, hasMore, page, loadComments]);

  useInfiniteScroll({
    root: scrollRef,
    target: sentinelRef,
    onLoadMore: loadMore,
    loading,
    hasMore,
    threshold: 50,
  });

  useEffect(() => {
    setComments([]);
    setPage(1);
    setHasMore(true);
    setTotal(0);
    memberCache.current.clear();
    loadComments(1, true);
  }, [chapterId, loadComments]);

  const handleReply = (commentId: string) => {
    if (!currentMember || !replyContent.trim()) return;

    const parentComment = comments.find(c => c.id === commentId);
    if (!parentComment) return;

    const newComment = CommentBoard.addComment(
      chapterId,
      currentMember.id,
      replyContent.trim(),
      null,
      commentId
    );

    const updatedParent = {
      ...parentComment,
      replies: [...parentComment.replies, newComment],
    };

    setComments(prev =>
      prev.map(c => (c.id === commentId ? updatedParent : c))
    );

    setNewCommentIds(prev => new Set(prev).add(newComment.id));
    setTimeout(() => {
      setNewCommentIds(prev => {
        const next = new Set(prev);
        next.delete(newComment.id);
        return next;
      });
    }, 300);

    setReplyContent('');
    setReplyingTo(null);
  };

  const renderCommentItem = (comment: Comment, isReply = false, replyCount = 0) => {
    const member = getMember(comment.memberId);
    const isNew = newCommentIds.has(comment.id);

    return (
      <div
        key={comment.id}
        className={isReply ? 'reply-item' : 'comment-item'}
        style={isNew ? { animation: 'fadeInDown 0.3s ease-out' } : undefined}
      >
        <div className={isReply ? 'reply-avatar' : 'comment-avatar'}>
          {member?.name?.charAt(0) || '?'}
        </div>
        <div className={isReply ? 'reply-content-wrapper' : 'comment-content-wrapper'}>
          <div className="comment-header">
            <span className="comment-username">{member?.name || '未知用户'}</span>
            <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <div className="comment-content">{comment.content}</div>
          {!isReply && (
            <div className="comment-actions">
              <button
                className="comment-action-btn"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <MessageSquare size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                回复 {replyCount > 0 ? `(${replyCount})` : ''}
              </button>
            </div>
          )}
          {!isReply && replyingTo === comment.id && (
            <div className="reply-input-wrapper">
              <textarea
                className="reply-input"
                placeholder="写下你的回复..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleReply(comment.id);
                  }
                }}
                rows={2}
              />
              <Button
                size="sm"
                onClick={() => handleReply(comment.id)}
                disabled={!replyContent.trim()}
              >
                <Send size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (total === 0 && !loading) {
    return (
      <div className="comment-list-container">
        <div className="comment-list-scroll">
          <div className="comment-empty">
            <div className="comment-empty-icon">💬</div>
            <div className="comment-empty-text">暂无评论，来发表第一条吧</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-list-container">
      <div className="comment-list-scroll" ref={scrollRef}>
        <div className="comment-list">
          {comments.map(comment => (
            <div key={comment.id}>
              {renderCommentItem(comment, false, comment.replies.length)}
              {comment.replies && comment.replies.length > 0 && (
                <div className="reply-list">
                  {comment.replies.slice(0, 10).map(reply =>
                    renderCommentItem(reply, true, 0)
                  )}
                  {comment.replies.length > 10 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', paddingLeft: '36px' }}>
                      还有 {comment.replies.length - 10} 条回复
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div ref={sentinelRef} />
        {loading && (
          <div className="comment-list-loading">
            <div className="comment-list-loading-spinner" />
            加载中...
          </div>
        )}
        {!hasMore && !loading && comments.length > 0 && (
          <div className="comment-list-end">—— 已加载全部评论 ——</div>
        )}
      </div>
    </div>
  );
};

export default CommentList;
