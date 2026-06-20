import { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { X, Send, Edit2, Trash2, MessageCircle, Reply } from 'lucide-react';
import type { Annotation } from '@/types';

export function AnnotationPanel() {
  const {
    annotations,
    currentUser,
    updateAnnotation,
    removeAnnotation,
    addReply,
    concepts,
  } = useStore();

  const { sendMessage } = useWebSocket();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const prevAnnotationsRef = useRef<Annotation[]>([]);

  useEffect(() => {
    const prevIds = new Set(prevAnnotationsRef.current.map((a) => a.id));
    const newIds = annotations.filter((a) => !prevIds.has(a.id)).map((a) => a.id);

    if (newIds.length > 0) {
      newIds.forEach((id, index) => {
        setTimeout(() => {
          setVisibleIds((prev) => new Set(prev).add(id));
        }, index * 50);
      });
    }

    setVisibleIds((prev) => {
      const next = new Set(prev);
      annotations.forEach((a) => {
        if (prevIds.has(a.id)) {
          next.add(a.id);
        }
      });
      return next;
    });

    prevAnnotationsRef.current = annotations;
  }, [annotations]);

  const handleEdit = useCallback(
    (annotation: Annotation) => {
      setEditingId(annotation.id);
      setEditText(annotation.text);
    },
    []
  );

  const handleSaveEdit = useCallback(
    (id: string) => {
      if (editText.trim()) {
        updateAnnotation(id, editText);
      }
      setEditingId(null);
      setEditText('');
    },
    [editText, updateAnnotation]
  );

  const handleDelete = useCallback(
    (annotation: Annotation) => {
      setVisibleIds((prev) => {
        const next = new Set(prev);
        next.delete(annotation.id);
        return next;
      });
      setTimeout(() => {
        removeAnnotation(annotation.id);
        sendMessage({
          type: 'annotation',
          payload: { annotation, action: 'delete' },
          userId: currentUser.id,
        });
      }, 200);
    },
    [removeAnnotation, sendMessage, currentUser.id]
  );

  const handleReply = useCallback(
    (annotationId: string) => {
      if (replyText.trim()) {
        addReply(annotationId, replyText, currentUser.name, currentUser.color);
      }
      setReplyingTo(null);
      setReplyText('');
    },
    [replyText, addReply, currentUser]
  );

  const getRelatedConceptName = useCallback(
    (conceptId?: string) => {
      if (!conceptId) return null;
      return concepts.find((c) => c.id === conceptId)?.name;
    },
    [concepts]
  );

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (annotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle size={48} className="text-[#E0E0E0]/30 mb-4" />
        <p className="text-[#E0E0E0]/50 text-sm">
          选中笔记中的文本片段，
          <br />
          点击"添加批注"按钮开始讨论
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#0F3460] bg-[#0F3460]/30">
        <h3 className="text-[#E0E0E0] font-medium">
          批注列表 <span className="text-[#E0E0E0]/50">({annotations.length})</span>
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {annotations.map((annotation) => {
          const conceptName = getRelatedConceptName(annotation.relatedConceptId);
          const isVisible = visibleIds.has(annotation.id);

          return (
            <div
              key={annotation.id}
              className="bg-[#2C3E50] rounded-xl p-4 shadow-lg annotation-bubble"
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transformOrigin: 'top left',
                transform: isVisible ? 'scale(1)' : 'scale(0.95)',
                opacity: isVisible ? 1 : 0,
                transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: annotation.authorColor }}
                  >
                    {annotation.author.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[#ECF0F1] font-medium text-sm">
                      {annotation.author}
                    </span>
                    <span className="text-[#ECF0F1]/50 text-xs ml-2">
                      {formatTime(annotation.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(annotation)}
                    className="p-1 text-[#ECF0F1]/50 hover:text-[#ECF0F1] transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(annotation)}
                    className="p-1 text-[#ECF0F1]/50 hover:text-[#E74C3C] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-[#1A1A2E]/50 rounded-lg p-2 mb-3">
                <p className="text-[#ECF0F1]/70 text-xs italic">
                  "{annotation.selectedText}"
                </p>
              </div>

              {editingId === annotation.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-[#1A1A2E] text-[#ECF0F1] rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E94560]"
                    rows={3}
                    placeholder="输入批注内容..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-sm text-[#ECF0F1]/70 hover:text-[#ECF0F1] transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSaveEdit(annotation.id)}
                      className="px-3 py-1 bg-[#E94560] text-white rounded-md text-sm hover:bg-[#E94560]/80 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[#ECF0F1] text-sm mb-3">{annotation.text}</p>
              )}

              {conceptName && (
                <div className="mb-3">
                  <span className="inline-block px-2 py-0.5 bg-[#3498DB]/20 text-[#3498DB] text-xs rounded-full">
                    关联概念: {conceptName}
                  </span>
                </div>
              )}

              {annotation.replies.length > 0 && (
                <div className="space-y-2 mb-3 pl-4 border-l-2 border-[#0F3460]">
                  {annotation.replies.map((reply) => (
                    <div key={reply.id} className="bg-[#1A1A2E]/50 rounded-lg p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-medium"
                          style={{ color: reply.authorColor }}
                        >
                          {reply.author}
                        </span>
                        <span className="text-[#ECF0F1]/30 text-xs">
                          {formatTime(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-[#ECF0F1]/80 text-xs">{reply.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === annotation.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="回复批注..."
                    className="flex-1 bg-[#1A1A2E] text-[#ECF0F1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E94560]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleReply(annotation.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleReply(annotation.id)}
                    className="p-2 bg-[#E94560] text-white rounded-lg hover:bg-[#E94560]/80 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    className="p-2 text-[#ECF0F1]/50 hover:text-[#ECF0F1] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(annotation.id)}
                  className="flex items-center gap-1 text-[#ECF0F1]/50 hover:text-[#3498DB] text-xs transition-colors"
                >
                  <Reply size={12} />
                  回复
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
