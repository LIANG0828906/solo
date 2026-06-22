import { useRef, useEffect, useCallback, useState } from 'react';
import showdown from 'showdown';
import { User, CursorPosition, Version } from './types';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onCursorChange: (top: number, left: number) => void;
  onSelection: (text: string) => void;
  remoteCursors: CursorPosition[];
  onlineUsers: User[];
  currentUserId: string;
  previewVersion: Version | null;
  onClosePreview: () => void;
  onRollback: (version: Version) => void;
}

function Editor({
  content,
  onChange,
  onCursorChange,
  onSelection,
  remoteCursors,
  onlineUsers,
  currentUserId,
  previewVersion,
  onClosePreview,
  onRollback,
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const lastContentRef = useRef(content);

  const converter = new showdown.Converter({
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
  });

  useEffect(() => {
    if (editorRef.current && !isComposing) {
      const html = converter.makeHtml(content);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
    lastContentRef.current = content;
  }, [content, converter]);

  const getCaretCoordinates = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return { top: 0, left: 0 };

    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);

    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current?.getBoundingClientRect();

    if (!editorRect) return { top: 0, left: 0 };

    return {
      top: rect.top - editorRect.top + (editorRef.current?.scrollTop || 0),
      left: rect.left - editorRect.left + (editorRef.current?.scrollLeft || 0),
    };
  };

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText;
    onChange(text);

    const coords = getCaretCoordinates();
    onCursorChange(coords.top, coords.left);
  }, [onChange, onCursorChange]);

  const handleKeyUp = useCallback(() => {
    const coords = getCaretCoordinates();
    onCursorChange(coords.top, coords.left);
  }, [onCursorChange]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      onSelection(selection.toString().trim());
    }
  }, [onSelection]);

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => {
    setIsComposing(false);
    handleInput();
  };

  const insertText = (before: string, after: string = '') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    const textNode = document.createTextNode(before + selectedText + after);
    range.deleteContents();
    range.insertNode(textNode);

    range.setStart(textNode, before.length);
    range.setEnd(textNode, before.length + selectedText.length);
    selection.removeAllRanges();
    selection.addRange(range);

    handleInput();
  };

  const handleBold = () => {
    insertText('**', '**');
    setActiveTool('bold');
    setTimeout(() => setActiveTool(null), 200);
  };

  const handleItalic = () => {
    insertText('*', '*');
    setActiveTool('italic');
    setTimeout(() => setActiveTool(null), 200);
  };

  const handleLink = () => {
    const url = prompt('请输入链接地址:', 'https://');
    if (url) {
      insertText('[', `](${url})`);
    }
  };

  const handleCodeBlock = () => {
    insertText('\n```\n', '\n```\n');
    setActiveTool('code');
    setTimeout(() => setActiveTool(null), 200);
  };

  const getUserById = (userId: string) => {
    return onlineUsers.find(u => u.id === userId);
  };

  const renderPreviewContent = (text: string) => {
    return { __html: converter.makeHtml(text) };
  };

  return (
    <div className="editor-card">
      <div className="editor-toolbar">
        <button
          className={`toolbar-btn ${activeTool === 'bold' ? 'active' : ''}`}
          onClick={handleBold}
          title="粗体 (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          className={`toolbar-btn ${activeTool === 'italic' ? 'active' : ''}`}
          onClick={handleItalic}
          title="斜体 (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          className={`toolbar-btn ${activeTool === 'link' ? 'active' : ''}`}
          onClick={handleLink}
          title="插入链接"
        >
          🔗
        </button>
        <div className="toolbar-divider"></div>
        <button
          className={`toolbar-btn ${activeTool === 'code' ? 'active' : ''}`}
          onClick={handleCodeBlock}
          title="代码块"
        >
          {'</>'}
        </button>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <div
          ref={editorRef}
          className="editor-content"
          contentEditable
          onInput={handleInput}
          onKeyUp={handleKeyUp}
          onMouseUp={handleMouseUp}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          suppressContentEditableWarning
        />

        {remoteCursors.map(cursor => {
          const user = getUserById(cursor.userId);
          if (!user) return null;

          return (
            <div
              key={cursor.userId}
              className="remote-cursor"
              style={{
                top: `${cursor.top}px`,
                left: `${cursor.left}px`,
              }}
            >
              <div
                className="remote-cursor-line"
                style={{ background: user.color }}
              />
              <div
                className="remote-cursor-avatar"
                style={{ background: user.color }}
              >
                {user.avatar || user.name[0]}
              </div>
              <div
                className="remote-cursor-label"
                style={{ background: user.color }}
              >
                {user.name}
              </div>
            </div>
          );
        })}

        <div className={`version-preview-overlay ${previewVersion ? 'active' : ''}`}>
          <div className="version-preview-header">
            <div className="version-preview-title">
              版本预览: {previewVersion?.title}
            </div>
            <div className="version-preview-actions">
              <button className="btn btn-secondary" onClick={onClosePreview}>
                关闭预览
              </button>
              <button
                className="btn btn-primary"
                onClick={() => previewVersion && onRollback(previewVersion)}
              >
                回滚到此版本
              </button>
            </div>
          </div>
          <div
            className="version-preview-content"
            dangerouslySetInnerHTML={
              previewVersion
                ? renderPreviewContent(previewVersion.content)
                : { __html: '' }
            }
          />
        </div>
      </div>
    </div>
  );
}

export default Editor;
