import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, MessageCircle, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ParticleBackground from './ParticleBackground';
import type { Poem, Comment } from '@/types';

interface PoemDetailModalProps {
  poem: Poem | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (poemId: string) => void;
  onAddComment?: (poemId: string, content: string) => void;
}

export default function PoemDetailModal({
  poem,
  isOpen,
  onClose,
  onLike,
  onAddComment,
}: PoemDetailModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showHeartBeat, setShowHeartBeat] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentId, setNewCommentId] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (poem) {
      setIsLiked(poem.liked || false);
      setLikeCount(poem.likes);
      if (Array.isArray(poem.comments)) {
        setComments(poem.comments);
      } else {
        setComments([]);
      }
    }
  }, [poem]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleLike = () => {
    if (!poem) return;

    setShowHeartBeat(true);
    setTimeout(() => setShowHeartBeat(false), 300);

    if (isLiked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setIsLiked(!isLiked);
    onLike?.(poem.id);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !poem) return;

    const newComment: Comment = {
      id: `temp-${Date.now()}`,
      userId: 'current-user',
      userName: '我',
      content: commentText.trim(),
      createdAt: Date.now(),
    };

    setNewCommentId(newComment.id);
    setComments((prev) => [...prev, newComment]);
    setCommentText('');
    onAddComment?.(poem.id, commentText.trim());

    setTimeout(() => setNewCommentId(null), 500);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isOpen || !poem) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6',
        isClosing ? 'overlay-fade-exit' : 'overlay-fade-enter'
      )}
      onClick={handleOverlayClick}
    >
      <div className="absolute inset-0 bg-brown-500/50 backdrop-blur-sm" />

      <div
        className={cn(
          'relative w-full max-w-5xl max-h-[90vh] bg-cream-50 rounded-2xl shadow-medium overflow-hidden',
          isClosing ? 'modal-exit' : 'modal-enter'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <ParticleBackground particleCount={30} />

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-cream-100/80 backdrop-blur-sm text-brown-400 hover:text-foreground hover:bg-cream-200 transition-all duration-200"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col lg:flex-row h-full max-h-[90vh]">
          <div className="lg:w-1/2 p-6 sm:p-8 overflow-y-auto">
            <div className="paper-bg rounded-xl p-6 sm:p-8 min-h-[400px] shadow-soft">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-4 text-center">
                {poem.title}
              </h2>

              <p className="text-center text-brown-300 mb-6 font-medium">
                —— {poem.authorName}
              </p>

              <div className="poem-content text-brown-400 whitespace-pre-wrap leading-relaxed">
                {poem.content}
              </div>

              <div className="mt-8 pt-4 border-t border-cream-300">
                <div className="flex flex-wrap gap-2 justify-center">
                  {poem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-cream-200 text-brown-400 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-center text-brown-300 text-sm mt-4">
                  {formatDate(poem.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 flex flex-col border-t lg:border-t-0 lg:border-l border-cream-200 bg-cream-50/50">
            <div className="p-6 border-b border-cream-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white text-lg font-medium shadow-soft">
                  {poem.authorName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{poem.authorName}</h3>
                  <p className="text-sm text-brown-300">诗人</p>
                </div>
                <button
                  onClick={handleLike}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200',
                    isLiked
                      ? 'bg-red-50 text-red-500'
                      : 'bg-cream-200 text-brown-400 hover:bg-cream-300'
                  )}
                >
                  <Heart
                    className={cn(
                      'w-5 h-5 transition-transform',
                      showHeartBeat && 'animate-heart-beat',
                      isLiked ? 'fill-red-500 text-red-500' : ''
                    )}
                  />
                  <span className="font-medium">{likeCount}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center space-x-2 px-6 py-3 border-b border-cream-200">
                <MessageCircle className="w-5 h-5 text-brown-300" />
                <span className="font-medium text-foreground">
                  评论 ({comments.length})
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-brown-300 py-8">
                    <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                    <p>暂无评论，来写第一条吧</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        'bg-white rounded-xl p-4 shadow-soft',
                        newCommentId === comment.id && 'comment-slide-in'
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cream-300 to-brown-200 flex items-center justify-center text-brown-500 text-sm font-medium flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground text-sm">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-brown-300">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-brown-400 mt-1 text-sm leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
            </div>

            <form onSubmit={handleSubmitComment} className="p-4 border-t border-cream-200">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="写下你的评论..."
                    rows={2}
                    className="w-full px-4 py-3 bg-white border border-cream-200 rounded-xl text-foreground placeholder-brown-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className={cn(
                    'p-3 rounded-xl transition-all duration-200 flex-shrink-0',
                    commentText.trim()
                      ? 'bg-primary text-white hover:bg-primary-hover shadow-soft'
                      : 'bg-cream-200 text-brown-200 cursor-not-allowed'
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
