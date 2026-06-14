import React from 'react';
import { Highlighter, MessageSquare, X } from 'lucide-react';
import { useDocStore } from '@/store/docStore';

/**
 * 标注工具栏
 * 数据流向：
 *   - 从 store 读取 showAnnotationToolbar、selectedRange
 *   - 调用 store.addHighlight() 添加高亮
 *   - 调用 store.toggleCommentModal(true) 打开批注弹窗
 *   - 调用 store.setSelectedRange(null) 取消选择
 *
 * 样式：
 *   - 选中文本后从底部弹出（smooth-up 动画，300ms）
 *   - 背景色 #ffffff，圆角顶部 16px
 *   - 宽度 70% 居中，移动端 100%
 *   - 包含高亮、批注、取消三个按钮
 */
const AnnotationToolbar: React.FC = () => {
  const {
    showAnnotationToolbar,
    selectedRange,
    addHighlight,
    toggleCommentModal,
    setSelectedRange,
  } = useDocStore();

  if (!showAnnotationToolbar || !selectedRange) return null;

  const handleCancel = () => {
    setSelectedRange(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleComment = () => {
    toggleCommentModal(true);
  };

  return (
    <div
      className="anim-smooth-up"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '70%',
        maxWidth: 520,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        padding: '14px 20px',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            color: '#64748b',
            marginBottom: 4,
          }}
        >
          已选文本：
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#334155',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            backgroundColor: '#fef9c3',
            padding: '4px 8px',
            borderRadius: 4,
          }}
        >
          {selectedRange.text}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={addHighlight}
          className="annotation-toolbar-btn primary"
          aria-label="高亮"
        >
          <Highlighter size={14} />
          <span>高亮</span>
        </button>

        <button
          onClick={handleComment}
          className="annotation-toolbar-btn primary"
          aria-label="批注"
        >
          <MessageSquare size={14} />
          <span>批注</span>
        </button>

        <button
          onClick={handleCancel}
          className="annotation-toolbar-btn secondary"
          aria-label="取消"
        >
          <X size={14} />
          <span>取消</span>
        </button>
      </div>
    </div>
  );
};

export default AnnotationToolbar;
