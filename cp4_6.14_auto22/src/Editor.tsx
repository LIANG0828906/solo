import { useEffect, useRef, useState, useCallback } from 'react';
import type { User } from './types';

interface EditorProps {
  content: string;
  chapterTitle: string;
  onChange: (content: string) => void;
  remoteUsers: User[];
}

function Editor({ content, chapterTitle, onChange, remoteUsers }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [headingLevel, setHeadingLevel] = useState<string>('p');
  const [remoteCursors, setRemoteCursors] = useState<Map<string, { top: number; left: number; height: number }>>(new Map());
  const [isFading, setIsFading] = useState(false);

  const rafIdRef = useRef<number | null>(null);
  const lastContentRef = useRef(content);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
      lastContentRef.current = content;
    }
  }, []);

  useEffect(() => {
    setIsFading(true);
    const timer = setTimeout(() => setIsFading(false), 400);
    return () => clearTimeout(timer);
  }, [chapterTitle]);

  useEffect(() => {
    const updateCursors = () => {
      const newCursors = new Map<string, { top: number; left: number; height: number }>();
      const editor = editorRef.current;
      if (!editor) return;

      remoteUsers.forEach((user) => {
        const textLength = editor.innerText.length;
        if (textLength === 0) return;

        const seed = parseInt(user.id.replace(/\D/g, '').slice(0, 5) || '1', 10);
        const timeOffset = (Date.now() / 1000 + seed) % textLength;
        const offset = Math.floor(timeOffset);

        try {
          const range = document.createRange();
          const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
          let currentPos = 0;
          let targetNode: Node | null = null;
          let targetOffset = 0;

          while (walker.nextNode()) {
            const node = walker.currentNode;
            const nodeLength = node.textContent?.length || 0;
            if (currentPos + nodeLength >= offset) {
              targetNode = node;
              targetOffset = offset - currentPos;
              break;
            }
            currentPos += nodeLength;
          }

          if (targetNode) {
            range.setStart(targetNode, targetOffset);
            range.setEnd(targetNode, targetOffset);
            const rect = range.getBoundingClientRect();
            const editorRect = editor.getBoundingClientRect();

            newCursors.set(user.id, {
              top: rect.top - editorRect.top + editor.scrollTop,
              left: rect.left - editorRect.left,
              height: rect.height || 20,
            });
          }
        } catch (e) {
          // ignore
        }
      });

      setRemoteCursors(newCursors);
    };

    updateCursors();
    const interval = setInterval(updateCursors, 1500);
    return () => clearInterval(interval);
  }, [remoteUsers]);

  const handleInput = useCallback(() => {
    if (isComposing) return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (editorRef.current) {
        const newContent = editorRef.current.innerHTML;
        if (newContent !== lastContentRef.current) {
          lastContentRef.current = newContent;
          onChange(newContent);
        }
        updateActiveFormats();
      }
      rafIdRef.current = null;
    });
  }, [isComposing, onChange]);

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();

    try {
      if (document.queryCommandState('bold')) formats.add('bold');
      if (document.queryCommandState('italic')) formats.add('italic');
      if (document.queryCommandState('underline')) formats.add('underline');
      if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
      if (document.queryCommandState('insertOrderedList')) formats.add('ol');
    } catch (e) {
      // ignore
    }

    setActiveFormats(formats);

    try {
      const block = document.queryCommandValue('formatBlock');
      if (block) {
        setHeadingLevel(block.toLowerCase().replace(/[<>]/g, ''));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const handleFormatBlock = useCallback((tag: string) => {
    execCommand('formatBlock', `<${tag}>`);
  }, [execCommand]);

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    handleInput();
  };

  const handleKeyUp = () => {
    updateActiveFormats();
  };

  const handleMouseUp = () => {
    updateActiveFormats();
  };

  return (
    <>
      <div className="editor-toolbar">
        <select
          className="toolbar-select"
          value={headingLevel}
          onChange={(e) => handleFormatBlock(e.target.value)}
        >
          <option value="p">正文</option>
          <option value="h1">标题 1</option>
          <option value="h2">标题 2</option>
          <option value="h3">标题 3</option>
        </select>

        <button
          className={`toolbar-btn ${activeFormats.has('bold') ? 'active' : ''}`}
          onClick={() => execCommand('bold')}
          title="加粗 (Ctrl+B)"
        >
          <b>B</b>
        </button>
        <button
          className={`toolbar-btn ${activeFormats.has('italic') ? 'active' : ''}`}
          onClick={() => execCommand('italic')}
          title="斜体 (Ctrl+I)"
        >
          <i>I</i>
        </button>
        <button
          className={`toolbar-btn ${activeFormats.has('underline') ? 'active' : ''}`}
          onClick={() => execCommand('underline')}
          title="下划线 (Ctrl+U)"
        >
          <u>U</u>
        </button>

        <span style={{ width: 1, height: 20, background: '#ddd', margin: '0 4px' }} />

        <button
          className={`toolbar-btn ${activeFormats.has('ul') ? 'active' : ''}`}
          onClick={() => execCommand('insertUnorderedList')}
          title="无序列表"
        >
          • 列表
        </button>
        <button
          className={`toolbar-btn ${activeFormats.has('ol') ? 'active' : ''}`}
          onClick={() => execCommand('insertOrderedList')}
          title="有序列表"
        >
          1. 列表
        </button>
      </div>

      <div className="editor-container">
        <div className={`editor-wrapper ${isFading ? 'fade-transition' : ''}`}>
          <div className="script-title">{chapterTitle}</div>
          <div style={{ position: 'relative' }}>
            <div
              ref={editorRef}
              className="editor"
              contentEditable
              onInput={handleInput}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onKeyUp={handleKeyUp}
              onMouseUp={handleMouseUp}
              suppressContentEditableWarning
            />
            <div className="remote-cursors">
              {Array.from(remoteCursors.entries()).map(([userId, position]) => {
                const user = remoteUsers.find((u) => u.id === userId);
                if (!user) return null;
                return (
                  <div
                    key={userId}
                    className="remote-cursor-rect"
                    style={{
                      '--cursor-color': user.color,
                      top: position.top,
                      left: position.left,
                      width: '4px',
                      height: position.height,
                      backgroundColor: user.color,
                      opacity: 0.4,
                    } as React.CSSProperties}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '-18px',
                        left: '-2px',
                        backgroundColor: user.color,
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        opacity: 0.9,
                      }}
                    >
                      {user.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Editor;
