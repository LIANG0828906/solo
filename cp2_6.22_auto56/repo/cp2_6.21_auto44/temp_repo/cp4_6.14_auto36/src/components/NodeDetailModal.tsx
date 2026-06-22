import { useState, useCallback, useRef, useMemo, memo } from 'react';
import { useAppStore, getOutgoingEdges } from '@/store/useAppStore';
import { X, Send, ArrowRight, MessageSquare } from 'lucide-react';
import type { Comment, WireframeEdge } from '@/data/sampleData';

interface CommentItemProps {
  comment: Comment;
  isNew: boolean;
  index: number;
}

const CommentItem = memo(function CommentItem({ comment, isNew, index }: CommentItemProps) {
  return (
    <div
      className={`bg-gray-50 rounded-lg p-3 ${isNew ? 'comment-fade-in' : ''}`}
      style={{ animationDelay: isNew ? '0ms' : `${index * 30}ms` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">{comment.username}</span>
        <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{comment.content}</p>
    </div>
  );
});

export default function NodeDetailModal() {
  const modalNodeId = useAppStore((s) => s.modalNodeId);
  const nodes = useAppStore((s) => s.nodes);
  const edges = useAppStore((s) => s.edges);
  const closeModal = useAppStore((s) => s.closeModal);
  const addComment = useAppStore((s) => s.addComment);
  const navigateToNode = useAppStore((s) => s.navigateToNode);

  const [commentText, setCommentText] = useState('');
  const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set());
  const btnRef = useRef<HTMLButtonElement>(null);

  const node = useMemo(
    () => nodes.find((n) => n.id === modalNodeId) || null,
    [nodes, modalNodeId]
  );

  const outgoingEdges: WireframeEdge[] = useMemo(
    () => (node ? getOutgoingEdges(node.id, edges) : []),
    [node, edges]
  );

  const targetNodes = useMemo(() => {
    return outgoingEdges.map((edge) => {
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target;
      return nodes.find((n) => n.id === targetId) || null;
    }).filter(Boolean);
  }, [outgoingEdges, nodes]);

  const handleSubmitComment = useCallback(() => {
    if (!commentText.trim() || !node) return;
    const tempId = `temp-${Date.now()}`;
    setNewCommentIds((prev) => new Set(prev).add(tempId));
    addComment(node.id, commentText.trim());
    setCommentText('');
    setTimeout(() => {
      setNewCommentIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }, 500);
  }, [commentText, node, addComment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment]
  );

  const handleNavigateToNode = useCallback(
    (targetId: string) => {
      navigateToNode(targetId);
    },
    [navigateToNode]
  );

  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '10px';
    ripple.style.height = '10px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 400);
  }, []);

  if (!node) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={closeModal}
    >
      <div
        className="modal-enter bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[85vh] mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${node.color}15, ${node.color}05)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: node.color }}
            >
              {node.title[0]}
            </div>
            <div>
              <h2
                className="text-lg font-semibold text-gray-800"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {node.title}
              </h2>
              <p className="text-xs text-gray-400">创建于 {node.createdAt}</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">线框图预览</h3>
            <div
              className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50"
              style={{ height: 200 }}
            >
              <svg width="100%" height="100%" viewBox="0 0 600 200">
                <rect x="20" y="15" width="560" height="30" rx="4" fill={node.color} opacity="0.15" />
                <rect x="20" y="55" width="180" height="130" rx="4" fill="#E5E7EB" opacity="0.5" />
                <rect x="215" y="55" width="365" height="30" rx="4" fill="#E5E7EB" opacity="0.5" />
                <rect x="215" y="95" width="365" height="25" rx="4" fill="#E5E7EB" opacity="0.3" />
                <rect x="215" y="130" width="175" height="55" rx="4" fill="#E5E7EB" opacity="0.3" />
                <rect x="405" y="130" width="175" height="55" rx="4" fill="#E5E7EB" opacity="0.3" />
                <rect x="30" y="65" width="160" height="12" rx="2" fill={node.color} opacity="0.3" />
                <rect x="30" y="85" width="120" height="8" rx="2" fill="#D1D5DB" opacity="0.5" />
                <rect x="30" y="100" width="140" height="8" rx="2" fill="#D1D5DB" opacity="0.5" />
                <rect x="30" y="130" width="80" height="35" rx="4" fill={node.color} opacity="0.2" />
                <rect x="120" y="130" width="80" height="35" rx="4" fill={node.color} opacity="0.2" />
                <text x="300" y="185" textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="'Noto Sans SC', sans-serif">
                  {node.title} - 线框图占位
                </text>
              </svg>
            </div>
          </div>

          {targetNodes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">关联跳转</h3>
              <div className="flex flex-wrap gap-2">
                {targetNodes.map((targetNode) =>
                  targetNode ? (
                    <button
                      key={targetNode.id}
                      onClick={() => handleNavigateToNode(targetNode.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
                      style={{
                        background: `${targetNode.color}10`,
                        color: targetNode.color,
                        border: `1px solid ${targetNode.color}30`,
                      }}
                    >
                      <ArrowRight size={12} />
                      {targetNode.title}
                    </button>
                  ) : null
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
              <MessageSquare size={14} />
              评论 ({node.comments.length})
            </h3>
            <div className="space-y-2.5">
              {node.comments.length === 0 && (
                <p className="text-xs text-gray-400 py-4 text-center">暂无评论，来说点什么吧</p>
              )}
              {node.comments.map((comment, idx) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isNew={newCommentIds.size > 0 && idx === node.comments.length - 1}
                  index={idx}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入评论..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none transition-all"
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <button
              ref={btnRef}
              onClick={(e) => {
                handleRipple(e);
                handleSubmitComment();
              }}
              disabled={!commentText.trim()}
              className="relative overflow-hidden px-4 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: commentText.trim() ? '#3B82F6' : '#94A3B8',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
