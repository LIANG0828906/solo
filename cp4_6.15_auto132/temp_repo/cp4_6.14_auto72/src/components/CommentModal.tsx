import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { useDocStore } from '@/store/docStore';

/**
 * 批注输入弹窗
 * 数据流向：
 *   - 从 store 读取 showCommentModal、selectedRange
 *   - 调用 store.addComment(comment) 提交批注
 *   - 调用 store.toggleCommentModal(false) 关闭弹窗
 *
 * 样式：
 *   - 尺寸 300 x 150px，圆角 8px
 *   - 文本输入框 + 提交按钮
 */
const CommentModal: React.FC = () => {
  const { showCommentModal, selectedRange, addComment, toggleCommentModal } =
    useDocStore();
  const [commentText, setCommentText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showCommentModal) {
      setCommentText('');
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [showCommentModal]);

  if (!showCommentModal) return null;

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    addComment(commentText.trim());
    setCommentText('');
  };

  const handleCancel = () => {
    toggleCommentModal(false);
    setCommentText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <>
      <div
        className="anim-fade-in"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 95,
        }}
        onClick={handleCancel}
      />

      <div
        className="anim-fade-in"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300,
          minHeight: 150,
          backgroundColor: '#ffffff',
          borderRadius: 8,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          zIndex: 100,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#1e293b',
              flex: 1,
            }}
          >
            添加批注
          </div>
          <button
            onClick={handleCancel}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              color: '#94a3b8',
            }}
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        {selectedRange && (
          <div
            style={{
              fontSize: 12,
              color: '#64748b',
              backgroundColor: '#fef9c3',
              padding: '6px 8px',
              borderRadius: 4,
              marginBottom: 10,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            选中：{selectedRange.text}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入批注内容..."
          style={{
            flex: 1,
            minHeight: 60,
            padding: '8px 10px',
            fontSize: 13,
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            color: '#334155',
            resize: 'none',
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            style={{
              height: 32,
              padding: '0 14px',
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: '#f1f5f9',
              color: '#475569',
              borderRadius: 6,
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!commentText.trim()}
            style={{
              height: 32,
              padding: '0 14px',
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Send size={14} />
            <span>提交</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default CommentModal;
