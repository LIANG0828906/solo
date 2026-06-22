import React, { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  onConfirm: (x: number, y: number, content: string) => void;
  onCancel: () => void;
}

export const TextStickyInput: React.FC<Props> = ({ x, y, onConfirm, onCancel }) => {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleConfirm = () => {
    if (content.trim()) {
      onConfirm(x, y, content.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="sticky-input-wrapper"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="sticky-input-close"
        onClick={onCancel}
        aria-label="取消"
      >
        <X size={14} />
      </button>

      <textarea
        ref={inputRef}
        className="sticky-input-area"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入文字内容..."
        rows={3}
      />

      <div className="sticky-input-footer">
        <span className="sticky-hint">Enter确认 · Shift+Enter换行 · Esc取消</span>
        <button
          className={`sticky-confirm-btn ${content.trim() ? '' : 'disabled'}`}
          onClick={handleConfirm}
          disabled={!content.trim()}
        >
          <Send size={14} />
          添加
        </button>
      </div>
    </div>
  );
};
