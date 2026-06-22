import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, User } from 'lucide-react';
import { Comment } from '@/types';
import { api } from '@/utils/api';
import { useAuthStore } from '@/store/useAuthStore';

const EMOJIS = ['😀', '😍', '🤤', '👍', '👏', '🔥', '💯', '✨', '😊', '😂', '🙌', '❤️', '🌟', '💪', '🎉'];

interface CommentSectionProps {
  recipeId: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ recipeId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadComments();
  }, [recipeId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadComments = async () => {
    try {
      const res = await api.comments.getByRecipeId(recipeId);
      setComments(res.comments);
    } catch (err) {
      console.error('加载评论失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      const newComment = await api.comments.create(recipeId, content.trim());
      setComments([newComment, ...comments]);
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('发表评论失败:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojis(false);
    textareaRef.current?.focus();
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-bold text-stone-800 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
        评论区 ({comments.length})
      </h3>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={autoResize}
                  onKeyDown={handleKeyDown}
                  placeholder="分享你的烹饪心得..."
                  rows={1}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="relative" ref={emojiRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojis(!showEmojis)}
                    className="p-2 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  {showEmojis && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-xl shadow-xl border border-stone-100 grid grid-cols-5 gap-1 animate-fadeIn">
                      {EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="w-8 h-8 flex items-center justify-center text-xl hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
                >
                  <Send className="w-4 h-4" />
                  发表
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-orange-50 rounded-xl text-center">
          <p className="text-stone-600">请登录后发表评论</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-stone-200" />
              <div className="flex-1">
                <div className="h-4 bg-stone-200 rounded w-24 mb-2" />
                <div className="h-16 bg-stone-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-stone-400">暂无评论，快来抢沙发吧~</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {comment.avatar ? (
                <img
                  src={comment.avatar}
                  alt={comment.username}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-amber-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {comment.username.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-stone-800">{comment.username}</span>
                  <span className="text-xs text-stone-400">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-stone-600 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
