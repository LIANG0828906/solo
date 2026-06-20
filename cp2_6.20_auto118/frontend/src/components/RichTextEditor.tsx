import { useRef, useEffect, useCallback } from 'react';

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

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      isInternalChangeRef.current = true;
      editor.innerHTML = value;
      isInternalChangeRef.current = false;
    }
  }, [value]);

  const execCommand = useCallback(
    (command: string, commandValue?: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      document.execCommand(command, false, commandValue);

      const html = editor.innerHTML;
      onChange?.(html);
      onBlur?.(html);
    },
    [onChange, onBlur]
  );

  const handleInput = useCallback(() => {
    if (isInternalChangeRef.current) return;
    const editor = editorRef.current;
    if (!editor) return;
    onChange?.(editor.innerHTML);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    onBlur?.(editor.innerHTML);
  }, [onBlur]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <div className="rich-text-editor">
      <div className="rte-toolbar">
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
