import { useRef, useEffect, useState, useCallback } from 'react';
import type { Frame } from '../../types';

interface TextEditorProps {
  frame: Frame | null;
  onUpdateDescription: (frameId: string, html: string) => void;
}

export default function TextEditor({ frame, onUpdateDescription }: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      editorRef.current.innerHTML = frame?.description || '';
      updateFormatState();
    }
    isInternalUpdate.current = false;
  }, [frame?.id]);

  const updateFormatState = useCallback(() => {
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
    } catch {
      /* ignore */
    }
  }, []);

  const execCommand = (command: string) => {
    editorRef.current?.focus();
    try {
      document.execCommand(command, false);
      updateFormatState();
      const html = editorRef.current?.innerHTML || '';
      if (frame) {
        isInternalUpdate.current = true;
        onUpdateDescription(frame.id, html);
      }
    } catch {
      /* ignore */
    }
  };

  const handleInput = () => {
    if (frame && editorRef.current) {
      const html = editorRef.current.innerHTML;
      isInternalUpdate.current = true;
      onUpdateDescription(frame.id, html);
    }
    updateFormatState();
  };

  const handleKeyUp = () => {
    updateFormatState();
  };

  const handleMouseUp = () => {
    updateFormatState();
  };

  return (
    <>
      <div className="editor-toolbar">
        <button
          className={`toolbar-btn bold ${isBold ? 'active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('bold');
          }}
          title="加粗 (Ctrl+B)"
        >
          B
        </button>
        <button
          className={`toolbar-btn italic ${isItalic ? 'active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('italic');
          }}
          title="斜体 (Ctrl+I)"
        >
          I
        </button>
        <div className="toolbar-divider" />
        <div className="editor-label">
          帧描述 — 支持加粗、斜体、换行
        </div>
      </div>
      <div
        ref={editorRef}
        className="text-editor"
        contentEditable
        data-placeholder="在此输入当前帧的文字描述..."
        onInput={handleInput}
        onKeyUp={handleKeyUp}
        onMouseUp={handleMouseUp}
        style={{ userSelect: 'text' }}
      />
    </>
  );
}
