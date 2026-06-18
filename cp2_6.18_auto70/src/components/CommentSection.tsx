import { useState, useMemo } from 'react';
import { Send, MessageSquarePlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import type { Version, Comment } from '@/types';
import { comments as allComments } from '@/data/mockData';
import CommentBubble from './CommentBubble';

interface CommentSectionProps {
  versionId: string;
  version: Version;
}

const EMOJIS = ['👍', '❤️', '🔧', '💡', '❓'];

const CURRENT_USER_ID = 'current-user';
const CURRENT_USER_NAME = '我';

export default function CommentSection({ versionId, version }: CommentSectionProps) {
  const [localComments, setLocalComments] = useState<Comment[]>(() => {
    return allComments.filter((c) => c.versionId === versionId);
  });
  const [content, setContent] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [timestampMode, setTimestampMode] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);

  const sortedComments = useMemo(() => {
    return [...localComments].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [localComments]);

  const handleSubmit = () => {
    if (!content.trim() || content.length > 200) return;

    const newComment: Comment = {
      id: uuidv4(),
      versionId,
      author: CURRENT_USER_NAME,
      authorId: CURRENT_USER_ID,
      content: content.trim(),
      emoji: selectedEmoji || undefined,
      timestamp: selectedTimestamp || 0,
      createdAt: new Date(),
    };

    setLocalComments((prev) => [newComment, ...prev]);
    setContent('');
    setSelectedEmoji(null);
    setShowEmojiPicker(false);
    setTimestampMode(false);
    setSelectedTimestamp(null);
  };

  const handleDelete = (id: string) => {
    setLocalComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleWaveformClick = (percent: number) => {
    if (!timestampMode) return;
    const time = Math.floor(percent * 180);
    setSelectedTimestamp(time);
    setTimestampMode(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-text-primary flex items-center gap-1">
            <MessageSquarePlus className="w-4 h-4 text-accent" />
            添加评论
          </h4>
          <button
            onClick={() => {
              setTimestampMode(!timestampMode);
              setSelectedTimestamp(null);
            }}
            className={cn(
              'text-xs px-2 py-1 rounded transition-colors',
              timestampMode
                ? 'bg-accent text-bg-main'
                : 'bg-bg-card text-text-secondary hover:text-accent'
            )}
          >
            {timestampMode ? '点击波形选择时间点' : '🎵 添加时间点'}
          </button>
          {selectedTimestamp !== null && (
            <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded">
              🎵 {Math.floor(selectedTimestamp / 60)}:
              {(selectedTimestamp % 60).toString().padStart(2, '0')}
              <button
                onClick={() => setSelectedTimestamp(null)}
                className="ml-1 text-text-secondary hover:text-danger"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {timestampMode && version.waveformData && (
          <div
            className="h-12 bg-bg-card rounded-lg cursor-crosshair overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              handleWaveformClick(percent);
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 100 48`}
              preserveAspectRatio="none"
            >
              {version.waveformData.map((value, index) => {
                const barWidth = 100 / version.waveformData!.length;
                const barHeight = Math.max(2, value * 40);
                const y = (48 - barHeight) / 2;
                return (
                  <rect
                    key={index}
                    x={index * barWidth + barWidth * 0.15}
                    y={y}
                    width={Math.max(1, barWidth * 0.7)}
                    height={barHeight}
                    rx={1}
                    fill="#F59E0B"
                    opacity={0.6}
                  />
                );
              })}
            </svg>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 200))}
              placeholder="写下你的评论..."
              rows={2}
              className="w-full bg-bg-card border border-transparent rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:border-accent/50 transition-colors"
            />
            <div className="absolute bottom-1.5 right-2 text-[10px] text-text-secondary">
              {content.length}/200
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors',
                  selectedEmoji
                    ? 'bg-accent/20'
                    : 'bg-bg-card text-text-secondary hover:text-accent'
                )}
              >
                {selectedEmoji || '😊'}
              </button>
              {showEmojiPicker && (
                <div className="absolute right-0 bottom-11 bg-bg-card rounded-lg p-1.5 shadow-xl flex gap-1 z-20 border border-bg-main">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setSelectedEmoji(emoji === selectedEmoji ? null : emoji);
                        setShowEmojiPicker(false);
                      }}
                      className={cn(
                        'w-8 h-8 rounded flex items-center justify-center text-lg transition-colors',
                        emoji === selectedEmoji
                          ? 'bg-accent/20'
                          : 'hover:bg-bg-main'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                content.trim()
                  ? 'bg-accent text-bg-main hover:bg-accent/90'
                  : 'bg-bg-card text-text-secondary cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-text-primary">
            评论 ({sortedComments.length})
          </h4>
        </div>
        {sortedComments.length === 0 ? (
          <div className="text-center py-6 text-sm text-text-secondary">
            暂无评论，来说点什么吧
          </div>
        ) : (
          <div className="space-y-2">
            {sortedComments.map((comment) => (
              <CommentBubble
                key={comment.id}
                comment={comment}
                isAuthor={comment.authorId === CURRENT_USER_ID}
                onDelete={() => handleDelete(comment.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
