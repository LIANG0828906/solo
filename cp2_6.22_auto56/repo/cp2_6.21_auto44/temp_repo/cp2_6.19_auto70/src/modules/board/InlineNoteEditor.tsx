import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

interface InlineNoteEditorProps {
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function InlineNoteEditor({ onSave, onCancel }: InlineNoteEditorProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  const handleClickOutside = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (content.trim()) {
      onSave(content.trim());
    } else {
      onCancel();
    }
  }, [content, onSave, onCancel]);

  const containerRef = useClickOutside<HTMLDivElement>(handleClickOutside, true);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (content.trim()) {
      onSave(content.trim());
    } else {
      onCancel();
    }
  }, [content, onSave, onCancel]);

  const handleCancel = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    onCancel();
  }, [onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  };

  const handleBlur = useCallback((e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
      return;
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      if (content.trim()) {
        onSave(content.trim());
      } else {
        onCancel();
      }
    }, 100);
  }, [content, onSave, onCancel, containerRef]);

  return (
    <div
      ref={containerRef}
      className="inline-note-editor"
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        className="inline-note-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="写下你的灵感... (Ctrl+Enter 保存，Esc 取消)"
        rows={3}
        autoFocus
      />
      <div className="inline-note-actions">
        <button
          type="button"
          className="inline-note-cancel"
          onClick={handleCancel}
          onMouseDown={(e) => e.preventDefault()}
          title="取消"
        >
          <X size={14} />
        </button>
        <button
          type="button"
          className="inline-note-save"
          onClick={handleSave}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!content.trim()}
          title="保存便签"
        >
          <Check size={14} />
          保存
        </button>
      </div>
    </div>
  );
}
