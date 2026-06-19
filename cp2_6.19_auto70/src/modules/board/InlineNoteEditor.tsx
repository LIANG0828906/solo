import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface InlineNoteEditorProps {
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function InlineNoteEditor({ onSave, onCancel }: InlineNoteEditorProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave(content);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="inline-note-editor" onClick={(e) => e.stopPropagation()}>
      <textarea
        ref={textareaRef}
        className="inline-note-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="写下你的灵感... (Ctrl+Enter 保存)"
        rows={3}
      />
      <div className="inline-note-actions">
        <button
          className="inline-note-cancel"
          onClick={onCancel}
          title="取消"
        >
          <X size={14} />
        </button>
        <button
          className="inline-note-save"
          onClick={() => onSave(content)}
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
