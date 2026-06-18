import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, AtSign } from 'lucide-react';
import { usePrototypeStore } from '../../stores/prototypeStore';
import { formatDate } from '../../utils/helpers';

interface CommentBubbleProps {
  componentId: string;
}

export const CommentBubble: React.FC<CommentBubbleProps> = ({ componentId }) => {
  const { comments, addComment, deleteComment, members, currentProjectId } =
    usePrototypeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMention, setShowMention] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const componentComments = comments.filter(
    (c) => c.componentId === componentId
  );

  const projectMembers = members.filter((m) => m.projectId === currentProjectId);

  const currentUserId = localStorage.getItem('userId') || 'guest';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(componentId, 'user-' + currentUserId, newComment.trim());
    setNewComment('');
  };

  const handleMention = (email: string) => {
    setNewComment((prev) => prev + `@${email.split('@')[0]} `);
    setShowMention(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowMention(true);
    } else if (e.key === 'Escape') {
      setShowMention(false);
    }
  };

  if (componentComments.length === 0 && !isOpen) {
    return null;
  }

  return (
    <div ref={bubbleRef} className="absolute -top-2 -right-2 z-20">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-6 h-6 bg-yellow-400 hover:bg-yellow-500 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
      >
        {componentComments.length > 0 ? (
          <span className="text-[10px] font-bold text-yellow-900">
            {componentComments.length}
          </span>
        ) : (
          <MessageCircle size={12} className="text-yellow-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-8 right-0 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn z-50">
          <div className="p-3 bg-yellow-50 border-b border-yellow-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-yellow-600" />
              <span className="font-medium text-sm text-yellow-800">
                评论 ({componentComments.length})
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-1 hover:bg-yellow-100 rounded"
            >
              <X size={14} className="text-yellow-600" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto p-3 space-y-3">
            {componentComments.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-sm">
                暂无评论
              </div>
            ) : (
              componentComments.map((comment) => (
                <div key={comment.id} className="group">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {comment.userId.slice(-1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700">
                          {comment.userId.slice(0, 8)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5 break-words">
                        {comment.text}
                      </p>
                    </div>
                    {comment.userId === 'user-' + currentUserId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteComment(comment.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="添加评论..."
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 pr-20 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMention(!showMention);
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 rounded transition-colors"
                >
                  <AtSign size={14} />
                </button>
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="p-1.5 text-yellow-600 hover:bg-yellow-100 rounded transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            {showMention && projectMembers.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-full bg-white rounded-lg shadow-xl border border-slate-200 py-1 max-h-32 overflow-y-auto z-50">
                {projectMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMention(member.email);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                  >
                    <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[10px]">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    {member.email}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
