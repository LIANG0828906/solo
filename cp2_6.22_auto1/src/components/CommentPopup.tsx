import { useState, useRef, useEffect } from 'react';
import * as Y from 'yjs';
import { X, CornerDownRight, CheckCircle2 } from 'lucide-react';
import { useYjsStore } from '@/hooks/useYjsStore';
import { cn } from '@/lib/utils';
import type { IComment } from '@/shared/types';

interface CommentPopupProps {
  doc: Y.Doc;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function CommentPopup({ doc, position, onClose }: CommentPopupProps) {
  const { comments, addComment, resolveComment, userName, roomId } = useYjsStore();
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const selectedComments = comments.filter(
    (c) => c.roomId === roomId && !c.resolved
  );

  const rootComments = selectedComments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => selectedComments.filter((c) => c.parentId === parentId);

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    const comment: IComment = {
      id: crypto.randomUUID(),
      roomId,
      from: 0,
      to: 0,
      text: inputText.trim(),
      author: userName || '匿名',
      authorColor: '#7aa2f7',
      createdAt: Date.now(),
      parentId: null,
      resolved: false,
    };
    addComment(comment);
    setInputText('');
  };

  const handleReply = (parentId: string) => {
    if (!replyText.trim()) return;
    const comment: IComment = {
      id: crypto.randomUUID(),
      roomId,
      from: 0,
      to: 0,
      text: replyText.trim(),
      author: userName || '匿名',
      authorColor: '#9ece6a',
      createdAt: Date.now(),
      parentId,
      resolved: false,
    };
    addComment(comment);
    setReplyText('');
    setReplyTo(null);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      ref={popupRef}
      className={cn(
        'fixed z-50 w-80 max-h-96 overflow-y-auto rounded-xl',
        'bg-white/70 dark:bg-surface-dark/70',
        'backdrop-blur-xl border border-border-light dark:border-border-dark',
        'shadow-2xl animate-fade-in'
      )}
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="text-xs font-semibold text-text-light dark:text-text-dark">
          评论
        </span>
        <button
          onClick={onClose}
          className="text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-3 pb-2 space-y-2">
        {rootComments.length === 0 && (
          <p className="text-xs text-muted-light dark:text-muted-dark py-2">暂无评论</p>
        )}

        {rootComments.map((comment) => (
          <div key={comment.id}>
            <div
              className={cn(
                'rounded-lg p-2',
                'bg-white/40 dark:bg-surface-dark/40',
                'border border-border-light/50 dark:border-border-dark/50'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: comment.authorColor }}
                >
                  {comment.author[0]}
                </div>
                <span className="text-xs font-medium text-text-light dark:text-text-dark">
                  {comment.author}
                </span>
                <span className="text-[10px] text-muted-light dark:text-muted-dark">
                  {formatTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-xs text-text-light dark:text-text-dark pl-7">
                {comment.text}
              </p>
              <div className="flex items-center gap-2 mt-1.5 pl-7">
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
                >
                  <CornerDownRight size={10} />
                  回复
                </button>
                <button
                  onClick={() => resolveComment(comment.id)}
                  className="text-[10px] text-success hover:underline flex items-center gap-0.5"
                >
                  <CheckCircle2 size={10} />
                  解决
                </button>
              </div>

              {replyTo === comment.id && (
                <div className="flex items-center gap-1.5 mt-2 pl-7">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                    placeholder="输入回复..."
                    className={cn(
                      'flex-1 px-2 py-1 rounded text-xs border outline-none',
                      'bg-white/50 dark:bg-surface-dark/50',
                      'border-border-light dark:border-border-dark',
                      'text-text-light dark:text-text-dark',
                      'placeholder:text-muted-light dark:placeholder:text-muted-dark'
                    )}
                  />
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="px-2 py-1 rounded text-xs bg-accent text-white hover:bg-accent/80 transition-colors"
                  >
                    发送
                  </button>
                </div>
              )}
            </div>

            {getReplies(comment.id).map((reply) => (
              <div
                key={reply.id}
                className={cn(
                  'ml-7 mt-1 rounded-lg p-2',
                  'bg-white/30 dark:bg-surface-dark/30',
                  'border border-border-light/30 dark:border-border-dark/30'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                    style={{ backgroundColor: reply.authorColor }}
                  >
                    {reply.author[0]}
                  </div>
                  <span className="text-[10px] font-medium text-text-light dark:text-text-dark">
                    {reply.author}
                  </span>
                  <span className="text-[10px] text-muted-light dark:text-muted-dark">
                    {formatTime(reply.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-text-light dark:text-text-dark pl-6">
                  {reply.text}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div
        className={cn(
          'flex items-center gap-1.5 px-3 pb-3 pt-1',
          'border-t border-border-light/50 dark:border-border-dark/50'
        )}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="添加评论..."
          className={cn(
            'flex-1 px-2 py-1.5 rounded-md text-xs border outline-none',
            'bg-white/50 dark:bg-surface-dark/50',
            'border-border-light dark:border-border-dark',
            'text-text-light dark:text-text-dark',
            'placeholder:text-muted-light dark:placeholder:text-muted-dark'
          )}
        />
        <button
          onClick={handleSubmit}
          className="px-3 py-1.5 rounded-md text-xs bg-accent text-white hover:bg-accent/80 transition-colors"
        >
          发送
        </button>
      </div>
    </div>
  );
}
