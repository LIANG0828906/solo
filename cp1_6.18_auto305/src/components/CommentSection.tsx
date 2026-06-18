import { useState } from 'react';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import type { Comment } from '@/types';
import { useFamily } from '@/context/FamilyContext';
import { addComment } from '@/utils/api';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  comments: Comment[];
  recordId: string;
  memberId: string;
  memberName: string;
}

const DEFAULT_DISPLAY_COUNT = 3;
const MAX_EXPANDED_COUNT = 5;

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

export default function CommentSection({
  comments,
  recordId,
}: CommentSectionProps) {
  const { memberInfo } = useFamily();
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayCount = expanded
    ? Math.min(comments.length, MAX_EXPANDED_COUNT)
    : Math.min(comments.length, DEFAULT_DISPLAY_COUNT);

  const displayedComments = comments.slice(0, displayCount);
  const remainingCount = comments.length - DEFAULT_DISPLAY_COUNT;

  const handleSubmit = async () => {
    if (!commentText.trim() || !memberInfo || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(recordId, {
        memberId: memberInfo.memberId,
        memberName: memberInfo.memberName,
        content: commentText.trim(),
      });
      setCommentText('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setCommentText(prev => prev + emojiObject.emoji);
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {displayedComments.length > 0 && (
        <div className="space-y-3">
          {displayedComments.map(comment => (
            <div key={comment.id} className="flex gap-2">
              <Avatar name={comment.memberName} size="sm" />
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {comment.memberName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!expanded && remainingCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm text-gray-500 mt-2 hover:text-gray-700"
        >
          展开 {remainingCount} 条评论
        </button>
      )}

      {!showInput ? (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="text-sm text-gray-400 mt-2 hover:text-gray-600"
        >
          写评论...
        </button>
      ) : (
        <div className="mt-3 relative">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="写下你的评论..."
                className={cn(
                  'w-full px-3 py-2 pr-10 rounded-full',
                  'bg-gray-50 border border-gray-200',
                  'text-sm focus:outline-none focus:border-gray-300'
                )}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Smile size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
              className={cn(
                'p-2 rounded-full bg-gray-800 text-white',
                'disabled:bg-gray-300 disabled:cursor-not-allowed',
                'transition-colors duration-200'
              )}
            >
              <Send size={16} />
            </button>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-10">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
