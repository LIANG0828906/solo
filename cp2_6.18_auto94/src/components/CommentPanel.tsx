import { useState } from 'react';
import { MessageCircle, X, Send, Reply, Check, Trash2 } from 'lucide-react';
import type { Comment } from '@/types';
import { useInkFlowStore } from '@/store/useInkFlowStore';
import { formatRelativeTime } from '@/utils/formatTime';

interface CommentPanelProps {
  chapterId: string;
  isOpen: boolean;
  onClose: () => void;
  pendingSelection?: { startOffset: number; endOffset: number; text: string } | null;
  onConsumePending?: () => void;
}

export default function CommentPanel({
  chapterId,
  isOpen,
  onClose,
  pendingSelection,
  onConsumePending,
}: CommentPanelProps) {
  const allComments = useInkFlowStore((s) => s.comments);
  const addComment = useInkFlowStore((s) => s.addComment);
  const deleteComment = useInkFlowStore((s) => s.deleteComment);
  const resolveComment = useInkFlowStore((s) => s.resolveComment);

  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const chapterComments = allComments.filter((c) => c.chapterId === chapterId);
  const rootComments = chapterComments.filter((c) => !c.parentCommentId);
  const repliesByParent = chapterComments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentCommentId) {
      (acc[c.parentCommentId] ||= []).push(c);
    }
    return acc;
  }, {});

  const handleSubmitNew = () => {
    const text = newCommentText.trim();
    if (!text) return;
    const selection = pendingSelection;
    addComment(
      chapterId,
      text,
      selection?.startOffset ?? 0,
      selection?.endOffset ?? 0
    );
    setNewCommentText('');
    onConsumePending?.();
  };

  const handleReply = (parentId: string) => {
    const text = replyText.trim();
    if (!text) return;
    addComment(chapterId, text, 0, 0, parentId);
    setReplyText('');
    setReplyingTo(null);
  };

  if (!isOpen) return null;

  const avatarColors: Record<string, string> = {
    ME: '#6366F1',
    LQ: '#EC4899',
    SM: '#10B981',
    YZ: '#F59E0B',
  };

  const renderComment = (c: Comment, isReply = false) => (
    <div
      key={c.id}
      className={`flex gap-3 ${isReply ? 'ml-9 mt-3' : ''}`}
      style={!isReply ? { animation: 'commentIn 0.25s ease-out' } : {}}
    >
      <div
        className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
        style={{ background: avatarColors[c.authorAvatar] || '#6366F1' }}
      >
        {c.authorAvatar}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="p-3 rounded-lg"
          style={{
            background: isReply ? '#F8FAFC' : '#FFFFFF',
            border: isReply ? '1px solid #E2E8F0' : '1px solid #E2E8F0',
            boxShadow: isReply ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-gray-800 truncate">
                {c.authorName}
              </span>
              <span className="text-[10px] text-gray-400 shrink-0">
                {formatRelativeTime(c.createdAt)}
              </span>
              {c.resolved && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: '#10B981' }}>
                  已解决
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {!c.resolved && (
                <button
                  onClick={() => resolveComment(c.id, true)}
                  className="p-1 rounded hover:bg-green-50 text-gray-400 hover:text-green-500 transition-all active:scale-[0.96]"
                  title="标记已解决"
                >
                  <Check size={12} />
                </button>
              )}
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all active:scale-[0.96]"
                  title="回复"
                >
                  <Reply size={12} />
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('确定删除这条评论？')) deleteComment(c.id);
                }}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all active:scale-[0.96]"
                title="删除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
            {c.text}
          </p>
        </div>

        {replyingTo === c.id && (
          <div className="flex gap-2 mt-2 ml-1">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply(c.id);
                }
                if (e.key === 'Escape') {
                  setReplyingTo(null);
                  setReplyText('');
                }
              }}
              placeholder="回复评论..."
              className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/20"
              autoFocus
            />
            <button
              onClick={() => handleReply(c.id)}
              disabled={!replyText.trim()}
              className="p-1.5 rounded-lg transition-all active:scale-[0.96] disabled:opacity-40"
              style={{ background: '#6366F1', color: 'white' }}
            >
              <Send size={13} />
            </button>
          </div>
        )}

        {repliesByParent[c.id]?.map((r) => renderComment(r, true))}
      </div>
    </div>
  );

  return (
    <div
      className="h-full flex flex-col bg-white overflow-hidden"
      style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} style={{ color: '#F59E0B' }} />
          <h3 className="text-sm font-semibold text-gray-800">评论协作</h3>
          <span className="text-xs text-gray-400">({chapterComments.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-gray-50 space-y-2">
        {pendingSelection ? (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(245,158,11,0.08)' }}>
            <span className="text-[10px] px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: '#F59E0B' }}>
              选中文本
            </span>
            <span className="text-gray-600 truncate flex-1 italic">
              「{pendingSelection.text.slice(0, 40)}{pendingSelection.text.length > 40 ? '...' : ''}」
            </span>
          </div>
        ) : null}
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSubmitNew();
            }
          }}
          placeholder={pendingSelection ? '对选中内容添加评论...' : '添加评论...'}
          rows={3}
          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none resize-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/20"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            Ctrl + Enter 发送
          </span>
          <button
            onClick={handleSubmitNew}
            disabled={!newCommentText.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all active:scale-[0.96] disabled:opacity-40"
            style={{ background: '#6366F1' }}
          >
            <Send size={12} />
            发送
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {rootComments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-xs text-gray-400">
              暂无评论<br />选中段落文字可添加评论
            </p>
          </div>
        ) : (
          rootComments.map((c) => renderComment(c))
        )}
      </div>

      <style>{`
        @keyframes commentIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
