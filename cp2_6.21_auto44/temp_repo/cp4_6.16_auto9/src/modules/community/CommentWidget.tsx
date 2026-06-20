import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Smile, Trash2, Reply, X, MessageCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { usePostStore, type ConnectionStatus } from './PostStore';
import type { Comment } from '@/types';

interface Props {
  recipeId: string;
}

const EMOJIS = ['😀', '😂', '😍', '🤤', '😋', '🤔', '👍', '❤️', '🔥', '✨', '🎉', '💯', '🍳', '🥘', '🍲', '🥗'];

const MAX_REPLY_DEPTH = 2;

const statusInfo: Record<ConnectionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  connecting: { label: '连接中...', color: 'text-yellow-500', icon: <Wifi size={13} /> },
  connected: { label: '实时连接正常', color: 'text-green-500', icon: <Wifi size={13} /> },
  disconnected: { label: '连接已断开', color: 'text-cocoa-200', icon: <WifiOff size={13} /> },
  error: { label: '连接出错', color: 'text-red-500', icon: <WifiOff size={13} /> },
  'degraded-fallback': { label: '本机多标签页同步模式', color: 'text-yellow-600', icon: <AlertTriangle size={13} /> },
};

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onPick, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-30 bottom-full left-0 mb-2 p-3 bg-white rounded-xl shadow-card-hover border border-cream-200 grid grid-cols-8 gap-1.5"
      style={{ animation: 'fadeInUp 200ms ease' }}
    >
      <button
        onClick={onClose}
        className="col-span-8 flex justify-end mb-1 text-cocoa-200 hover:text-warm-500 transition"
      >
        <X size={16} />
      </button>
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onPick(e)}
          className="w-8 h-8 rounded-lg hover:bg-warm-50 text-xl transition-transform hover:scale-125"
        >
          {e}
        </button>
      ))}
    </div>
  );
};

interface CommentFormProps {
  recipeId: string;
  parentId?: string | null;
  replyToUser?: string;
  replyToUserId?: string;
  onCancel?: () => void;
  compact?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  recipeId,
  parentId = null,
  replyToUser,
  replyToUserId,
  onCancel,
  compact,
}) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const addComment = usePostStore((s) => s.addComment);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (compact) inputRef.current?.focus();
  }, [compact]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment({
        recipeId,
        content: text.trim(),
        parentId,
        replyToUser,
        replyToUserId,
      });
      setText('');
      onCancel?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className={`relative ${compact ? 'mt-2' : ''}`}>
      {replyToUser && (
        <div className="text-xs text-warm-500 mb-1.5 pl-1">
          回复 <span className="font-medium">@{replyToUser}</span>
          {onCancel && (
            <button type="button" onClick={onCancel} className="ml-2 text-cocoa-200 hover:text-warm-500">
              取消
            </button>
          )}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyToUser ? '写下你的回复...' : '分享你的烹饪心得...'}
            className="input-base pr-12 py-2.5 text-sm"
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <div className="absolute right-2 bottom-1/2 translate-y-1/2">
            {showEmoji ? (
              <EmojiPicker
                onPick={(em) => {
                  setText((t) => t + em);
                  setShowEmoji(false);
                }}
                onClose={() => setShowEmoji(false)}
              />
            ) : null}
            <button
              type="button"
              onClick={() => setShowEmoji((s) => !s)}
              disabled={submitting}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                showEmoji ? 'bg-warm-50 text-warm-500' : 'text-cocoa-200 hover:text-warm-400'
              }`}
            >
              <Smile size={18} />
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="btn-primary !px-4 !py-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Send size={16} />
          {!compact && <span className="hidden sm:inline">{submitting ? '发送中' : '发送'}</span>}
        </button>
      </div>
    </form>
  );
};

interface CommentItemProps {
  comment: Comment;
  recipeId: string;
  depth?: number;
  allComments: Comment[];
  staggerDelay: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  recipeId,
  depth = 0,
  allComments,
  staggerDelay,
}) => {
  const [showReply, setShowReply] = useState(false);
  const deleteComment = usePostStore((s) => s.deleteComment);
  const isMine = comment.userId === usePostStore.getState().comments[0]?.userId ||
    comment.userId === 'user_local_001';

  const children = allComments.filter((c) => c.parentId === comment.id);
  const time = new Date(comment.createdAt);
  const timeStr = `${time.getMonth() + 1}/${time.getDate()} ${time
    .getHours()
    .toString()
    .padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

  const reachMaxDepth = depth >= MAX_REPLY_DEPTH;

  return (
    <div
      className="group"
      style={{
        animation: 'fadeInUp 300ms ease forwards',
        animationDelay: `${staggerDelay}ms`,
        opacity: 0,
      }}
    >
      <div className="flex gap-3">
        <img
          src={comment.userAvatar}
          alt={comment.userName}
          className="w-9 h-9 rounded-full bg-cream-200 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="comment-bubble">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-cocoa-400">{comment.userName}</span>
                <span className="text-xs text-cocoa-200">{timeStr}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isMine && (
                  <button
                    onClick={() => {
                      if (confirm('删除这条评论？')) deleteComment(comment.id);
                    }}
                    className="p-1 rounded hover:bg-red-50 text-cocoa-200 hover:text-red-500 transition"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-cocoa-300 leading-relaxed break-words">
              {comment.replyToUser && (
                <span className="text-warm-500 mr-1">@{comment.replyToUser} </span>
              )}
              {comment.content}
            </p>
          </div>
          {reachMaxDepth ? (
            <div className="flex items-center gap-1.5 mt-1.5 pl-1 text-[11px] text-cocoa-200 cursor-not-allowed"
              title={`为保持界面整洁，回复最多嵌套${MAX_REPLY_DEPTH}层`}>
              <Reply size={12} className="opacity-50" />
              <span className="opacity-70">
                回复层数已达上限，请直接回复原评论
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowReply((s) => !s)}
              className="btn-ghost mt-1.5 !py-1 text-xs group/btn"
              title={`${depth === 0 ? '第1层' : depth === 1 ? '第2层（最深）' : ''}，共支持${MAX_REPLY_DEPTH}层嵌套`}
            >
              <Reply size={13} />
              回复
              {depth === MAX_REPLY_DEPTH - 1 && (
                <span className="text-[10px] ml-1 text-cocoa-100 group-hover/btn:text-warm-300 transition-colors">
                  （最后一层）
                </span>
              )}
            </button>
          )}
          {showReply && (
            <CommentForm
              recipeId={recipeId}
              parentId={comment.id}
              replyToUser={comment.userName}
              replyToUserId={comment.userId}
              onCancel={() => setShowReply(false)}
              compact
            />
          )}

          {children.length > 0 && (
            <div className="mt-3 ml-2 pl-3 border-l-2 border-warm-100 space-y-3">
              {children.map((child, i) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  recipeId={recipeId}
                  depth={depth + 1}
                  allComments={allComments}
                  staggerDelay={staggerDelay + (i + 1) * 40}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CommentWidget: React.FC<Props> = ({ recipeId }) => {
  const init = usePostStore((s) => s.init);
  const disconnect = usePostStore((s) => s.disconnect);
  const connectionStatus = usePostStore((s) => s.connectionStatus);
  const connectionError = usePostStore((s) => s.connectionError);
  const allComments = usePostStore((s) => s.comments);
  const comments = useMemo(
    () => allComments.filter((c) => c.recipeId === recipeId).sort((a, b) => a.createdAt - b.createdAt),
    [allComments, recipeId],
  );
  const roots = useMemo(() => comments.filter((c) => !c.parentId), [comments]);
  const status = statusInfo[connectionStatus];

  useEffect(() => {
    init();
    return () => disconnect();
  }, [init, disconnect]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-xl text-cocoa-400 flex items-center gap-2">
          <MessageCircle className="text-warm-400" size={22} />
          大家的讨论
          <span className="text-sm font-sans text-cocoa-200">({comments.length})</span>
        </h3>
        <div
          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-cream-50 border border-cream-200 ${status.color}`}
          title={connectionError || status.label}
        >
          {status.icon}
          <span>{status.label}</span>
        </div>
      </div>

      {connectionError && connectionStatus === 'degraded-fallback' && (
        <div
          className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2"
          style={{ animation: 'fadeInUp 300ms ease' }}
        >
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium mb-0.5">实时服务暂不可用</div>
            <div className="opacity-90">{connectionError}</div>
            <div className="opacity-80 mt-1">
              💡 提示：在同浏览器的多个标签页之间，评论依然可以实时同步。后端上线后设置 <code className="px-1 bg-white rounded">VITE_SOCKET_URL</code> 环境变量即可启用跨设备推送。
            </div>
          </div>
        </div>
      )}

      <div className="text-[11px] text-cocoa-200 flex items-center gap-1.5 -mt-1">
        <span>💬 回复支持最多 {MAX_REPLY_DEPTH} 层嵌套 + emoji表情</span>
      </div>

      <CommentForm recipeId={recipeId} />

      <div className="space-y-5 pt-2">
        {roots.length === 0 ? (
          <div className="py-10 text-center text-cocoa-200">
            <div className="text-4xl mb-2 opacity-50">🍽️</div>
            <p className="text-sm">还没有评论，来分享第一句吧！</p>
          </div>
        ) : (
          roots.map((c, i) => (
            <CommentItem
              key={c.id}
              comment={c}
              recipeId={recipeId}
              allComments={comments}
              staggerDelay={i * 60}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentWidget;
