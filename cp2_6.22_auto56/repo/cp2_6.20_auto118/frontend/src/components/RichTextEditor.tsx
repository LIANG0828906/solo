import { useRef, useEffect, useCallback, useState } from 'react';
import { sanitizeHtml } from '../utils/sanitize';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  onBlur?: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({
  value = '',
  onChange,
  onBlur,
  placeholder = '请输入步骤...',
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateUndoRedoState = useCallback(() => {
    setCanUndo(document.queryCommandEnabled('undo'));
    setCanRedo(document.queryCommandEnabled('redo'));
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const sanitizedValue = sanitizeHtml(value);
    if (editor.innerHTML !== sanitizedValue) {
      isInternalChangeRef.current = true;
      editor.innerHTML = sanitizedValue;
      isInternalChangeRef.current = false;
    }
  }, [value]);

  const getSanitizedContent = useCallback((): string => {
    const editor = editorRef.current;
    if (!editor) return '';
    return sanitizeHtml(editor.innerHTML);
  }, []);

  const execCommand = useCallback(
    (command: string, commandValue?: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      document.execCommand(command, false, commandValue);

      const sanitized = getSanitizedContent();
      isInternalChangeRef.current = true;
      editor.innerHTML = sanitized;
      isInternalChangeRef.current = false;

      onChange?.(sanitized);
      onBlur?.(sanitized);
      updateUndoRedoState();
    },
    [onChange, onBlur, getSanitizedContent, updateUndoRedoState]
  );

  const handleInput = useCallback(() => {
    if (isInternalChangeRef.current) return;
    const editor = editorRef.current;
    if (!editor) return;

    const sanitized = sanitizeHtml(editor.innerHTML);
    if (sanitized !== editor.innerHTML) {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const offset = range?.startOffset ?? 0;
      const startContainer = range?.startContainer;

      isInternalChangeRef.current = true;
      editor.innerHTML = sanitized;
      isInternalChangeRef.current = false;

      if (range && startContainer && editor.contains(startContainer)) {
        try {
          const newRange = document.createRange();
          newRange.setStart(startContainer, Math.min(offset, startContainer.textContent?.length ?? 0));
          newRange.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        } catch {
        }
      }
    }

    onChange?.(sanitized);
    updateUndoRedoState();
  }, [onChange, updateUndoRedoState]);

  const handleBlur = useCallback(() => {
    const sanitized = getSanitizedContent();
    onBlur?.(sanitized);
  }, [onBlur, getSanitizedContent]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      const sanitized = sanitizeHtml(html);
      if (sanitized && sanitized.trim()) {
        document.execCommand('insertHTML', false, sanitized);
        return;
      }
    }

    document.execCommand('insertText', false, text);
  }, []);

  const handleFormatChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value;
    if (format) {
      execCommand('formatBlock', format);
    }
  }, [execCommand]);

  return (
    <div className="rich-text-editor">
      <div className="rte-toolbar">
        <button
          type="button"
          className="rte-btn"
          onClick={() => execCommand('undo')}
          title="撤销"
          disabled={!canUndo}
        >
          ↶
        </button>
        <button
          type="button"
          className="rte-btn"
          onClick={() => execCommand('redo')}
          title="重做"
          disabled={!canRedo}
        >
          ↷
        </button>
        <span className="rte-divider" />
        <select
          className="rte-select"
          onChange={handleFormatChange}
          defaultValue=""
          title="段落格式"
        >
          <option value="" disabled>段落格式</option>
          <option value="p">正文</option>
          <option value="div">普通</option>
        </select>
        <span className="rte-divider" />
        <button
          type="button"
          className="rte-btn"
          onClick={() => execCommand('bold')}
          title="加粗"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="rte-btn"
          onClick={() => execCommand('italic')}
          title="斜体"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="rte-btn"
          onClick={() => execCommand('underline')}
          title="下划线"
        >
          <u>U</u>
        </button>
        <span className="rte-divider" />
        <button
          type="button"
          className="rte-btn"
          onClick={() => execCommand('insertUnorderedList')}
          title="无序列表"
        >
          • 列表
        </button>
        <button
          type="button"
          className="rte-btn"
          onClick={() => execCommand('insertOrderedList')}
          title="有序列表"
        >
          1. 列表
        </button>
      </div>
      <div
        ref={editorRef}
        className="rte-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onPaste={handlePaste}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
