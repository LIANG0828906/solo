import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { renderAbc, transposeAbc, exportMidi, exportPdf, getErrorLines, type RenderResult } from '../utils/abcRenderer';

interface EditorPanelProps {
  projectId: string;
  projectName: string;
}

interface CollabUser {
  id: string;
  name: string;
  color: string;
  cursor: { line: number; col: number } | null;
  selection: { start: number; end: number } | null;
}

interface ErrorToast {
  id: number;
  message: string;
}

const LINE_HEIGHT = 20.8;
const CHAR_WIDTH = 8.4;

export default function EditorPanel({ projectId, projectName }: EditorPanelProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [users, setUsers] = useState<CollabUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; color: string } | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [paneWidths, setPaneWidths] = useState({ editor: 30, preview: 50, toolbar: 20 });
  const [errorToasts, setErrorToasts] = useState<ErrorToast[]>([]);
  const [hasRenderError, setHasRenderError] = useState(false);
  const [sliderBounce, setSliderBounce] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const renderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderResultRef = useRef<RenderResult | null>(null);
  const lastSentContentRef = useRef<string>('');
  const dragRef = useRef<{ type: 'editor-preview' | 'preview-toolbar'; startX: number; widths: typeof paneWidths } | null>(null);

  const displayedContent = useMemo(() => {
    if (transpose === 0) return content;
    return transposeAbc(originalContent || content, transpose);
  }, [content, originalContent, transpose]);

  const showError = useCallback((message: string) => {
    const id = Date.now();
    setErrorToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setErrorToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  }, []);

  const currentUserRef = useRef<typeof currentUser>(null);
  const showErrorRef = useRef<typeof showError>(null);
  const usersRef = useRef<CollabUser[]>([]);

  currentUserRef.current = currentUser;
  showErrorRef.current = showError;
  usersRef.current = users;

  useEffect(() => {
    const wsUrl = window.location.protocol === 'https:' ? `wss://${window.location.host}/ws` : `ws://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { type, payload } = msg;

        if (type === 'init') {
          setCurrentUser(payload);
        }

        if (type === 'project-joined') {
          setContent(payload.project.content);
          setOriginalContent(payload.project.content);
          lastSentContentRef.current = payload.project.content;
          setUsers(payload.users.map((u: any) => ({
            id: u.id, name: u.name, color: u.color,
            cursor: u.cursor, selection: u.selection,
          })));
        }

        if (type === 'users-update') {
          setUsers(payload.map((u: any) => ({
            id: u.id, name: u.name, color: u.color,
            cursor: u.cursor, selection: u.selection,
          })));
        }

        if (type === 'user-joined') {
          setUsers(prev => {
            if (prev.some(u => u.id === payload.id)) return prev;
            return [...prev, { ...payload, cursor: null, selection: null }];
          });
        }

        if (type === 'user-left') {
          setUsers(prev => prev.filter(u => u.id !== payload.id));
        }

        if (type === 'text-change') {
          if (payload.userId !== currentUserRef.current?.id) {
            setContent(payload.content);
            setOriginalContent(payload.content);
            lastSentContentRef.current = payload.content;
          }
        }

        if (type === 'cursor-change') {
          if (payload.userId !== currentUserRef.current?.id) {
            setUsers(prev => prev.map(u =>
              u.id === payload.userId
                ? { ...u, cursor: payload.cursor, selection: payload.selection }
                : u
            ));
          }
        }

        if (type === 'error') {
          showErrorRef.current?.(payload.message);
        }
      } catch (e) {
        console.error('WS消息解析失败:', e);
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join-project', payload: { projectId } }));
    };

    const handleClose = () => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'leave-project' }));
        } catch (e) { /* ignore */ }
        ws.close();
      }
    };

    window.addEventListener('beforeunload', handleClose);

    return () => {
      window.removeEventListener('beforeunload', handleClose);
      handleClose();
    };
  }, [projectId]);

  const dismissError = (id: number) => {
    setErrorToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (transpose === 0) setOriginalContent(newContent);

    if (sendDebounceRef.current) clearTimeout(sendDebounceRef.current);
    sendDebounceRef.current = setTimeout(() => {
      const contentToSend = transpose === 0 ? newContent : originalContent;
      if (contentToSend !== lastSentContentRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'text-change',
          payload: { content: contentToSend },
        }));
        lastSentContentRef.current = contentToSend;
      }
    }, 50);
  };

  const handleCursorUpdate = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const textBefore = content.substring(0, start);
    const lines = textBefore.split('\n');
    const line = lines.length - 1;
    const col = lines[lines.length - 1].length;

    wsRef.current.send(JSON.stringify({
      type: 'cursor-change',
      payload: {
        cursor: { line, col },
        selection: start !== end ? { start, end } : null,
      },
    }));
  }, [content]);

  const prevContentRef = useRef('');
  const displayedContentRef = useRef('');
  displayedContentRef.current = displayedContent;

  useEffect(() => {
    if (!displayedContentRef.current) {
      prevContentRef.current = displayedContentRef.current;
      return;
    }

    const wasEmpty = !prevContentRef.current;
    prevContentRef.current = displayedContentRef.current;

    const doRender = () => {
      if (!scoreRef.current) return;
      const result = renderAbc(scoreRef.current!, displayedContentRef.current);
      renderResultRef.current = result;

      if (!result.success || (result.errors && result.errors.length > 0)) {
        setHasRenderError(true);
        const errMsg = result.errors?.[0]?.message || 'ABC语法错误';
        showError(errMsg);
        setTimeout(() => setHasRenderError(false), 400);
      }
      setRenderKey(k => k + 1);
    };

    if (wasEmpty) {
      requestAnimationFrame(() => requestAnimationFrame(doRender));
    } else {
      if (renderDebounceRef.current) clearTimeout(renderDebounceRef.current);
      renderDebounceRef.current = setTimeout(doRender, 300);
    }

    return () => {
      if (renderDebounceRef.current) clearTimeout(renderDebounceRef.current);
    };
  }, [displayedContent, showError]);

  const handleTransposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setTranspose(value);

    if (value === -5 || value === 5) {
      setSliderBounce(true);
      setTimeout(() => setSliderBounce(false), 250);
    }
  };

  const handleExportMidi = () => {
    try {
      exportMidi(displayedContent, `${projectName || 'score'}.mid`);
    } catch (e: any) {
      showError(e.message);
    }
  };

  const handleExportPdf = () => {
    exportPdf();
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const container = previewContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + container.scrollLeft;
    const mouseY = e.clientY - rect.top + container.scrollTop;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.8, Math.min(2, zoom + delta));
    const zoomRatio = newZoom / zoom;

    setZoom(newZoom);

    requestAnimationFrame(() => {
      container.scrollLeft = mouseX * zoomRatio - (e.clientX - rect.left);
      container.scrollTop = mouseY * zoomRatio - (e.clientY - rect.top);
    });
  };

  const startDrag = (type: 'editor-preview' | 'preview-toolbar', e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { type, startX: e.clientX, widths: { ...paneWidths } };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { type, startX, widths } = dragRef.current;
      const delta = (e.clientX - startX) / window.innerWidth * 100;

      if (type === 'editor-preview') {
        const newEditor = Math.max(15, Math.min(55, widths.editor + delta));
        const newPreview = widths.preview - delta;
        if (newPreview >= 30) {
          setPaneWidths(prev => ({ ...prev, editor: newEditor, preview: newPreview }));
        }
      } else {
        const newPreview = Math.max(30, Math.min(65, widths.preview + delta));
        const newToolbar = widths.toolbar - delta;
        if (newToolbar >= 10) {
          setPaneWidths(prev => ({ ...prev, preview: newPreview, toolbar: newToolbar }));
        }
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const errorLines = useMemo(() => {
    if (!renderResultRef.current) return [];
    return getErrorLines(renderResultRef.current);
  }, [renderKey]);

  const lineCount = Math.max(content.split('\n').length, 20);

  const displayUsers = currentUser ? [...users.filter(u => u.id !== currentUser.id)] : users;
  const allUsersForAvatars = currentUser ? [currentUser, ...users.filter(u => u.id !== currentUser.id)] : users;

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <div className="project-title">📝 {projectName}</div>
        <div className="online-users">
          <span style={{ fontSize: 12, color: 'var(--text-dim)', marginRight: 8 }}>
            {allUsersForAvatars.length}/8
          </span>
          <div className="avatar-stack">
            {allUsersForAvatars.slice(0, 6).map((u) => (
              <div
                key={u.id}
                className="avatar"
                style={{ background: u.color }}
                title={`${u.name}${u.id === currentUser?.id ? ' (我)' : ''}`}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {allUsersForAvatars.length > 6 && (
              <div className="avatar" style={{ background: 'var(--bg-lighter)' }}>
                +{allUsersForAvatars.length - 6}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-pane" style={{ width: `${paneWidths.editor}%` }}>
          <div className="editor-pane-header">
            <span>ABC 记谱</span>
            <span style={{ fontSize: 11 }}>{content.length} 字符</span>
          </div>
          <div className="abc-editor-container">
            <div className="abc-textarea-wrapper">
              <div className="line-numbers">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div
                    key={i}
                    className={`line-number ${errorLines.includes(i) ? 'error' : ''}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="abc-textarea"
                value={content}
                onChange={handleContentChange}
                onKeyUp={handleCursorUpdate}
                onMouseUp={handleCursorUpdate}
                onClick={handleCursorUpdate}
                spellCheck={false}
                placeholder="输入ABC记谱..."
              />
            </div>
            <div className="collab-overlay">
              {displayUsers.map(u => {
                if (!u.cursor) return null;
                const top = u.cursor.line * LINE_HEIGHT;
                const left = u.cursor.col * CHAR_WIDTH;
                return (
                  <div key={u.id}>
                    <div
                      className="remote-cursor"
                      style={{
                        top,
                        left,
                        height: LINE_HEIGHT,
                        background: u.color,
                        color: u.color,
                      }}
                    >
                      <div className="cursor-label" style={{ background: u.color }}>
                        {u.name}
                      </div>
                    </div>
                    {u.selection && u.selection.start !== u.selection.end && (
                      <SelectionHighlight
                        content={content}
                        selection={u.selection}
                        color={u.color}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className={`divider ${dragRef.current?.type === 'editor-preview' ? 'dragging' : ''}`}
          onMouseDown={(e) => startDrag('editor-preview', e)}
        />

        <div className="editor-pane" style={{ width: `${paneWidths.preview}%` }}>
          <div className="editor-pane-header">
            <span>五线谱预览</span>
            <span style={{ fontSize: 11 }}>
              {Math.round(zoom * 100)}% · Ctrl+滚轮缩放
            </span>
          </div>
          <div
            ref={previewContainerRef}
            className="score-preview-container"
            onWheel={handleWheelZoom}
          >
            <div className="score-preview-wrapper" style={{ transform: `scale(${zoom})` }}>
              <div
                key={renderKey}
                ref={scoreRef}
                className={`score-render-area ${hasRenderError ? 'score-error' : ''} score-transition`}
              />
            </div>
          </div>
        </div>

        <div
          className={`divider ${dragRef.current?.type === 'preview-toolbar' ? 'dragging' : ''}`}
          onMouseDown={(e) => startDrag('preview-toolbar', e)}
        />

        <div className="editor-pane" style={{ width: `${paneWidths.toolbar}%` }}>
          <div className="editor-pane-header">
            <span>工具栏</span>
          </div>
          <div className="toolbar">
            <div className="toolbar-section">
              <label className="toolbar-label">转调 (-5 ~ +5 半音)</label>
              <div className="transpose-slider-container">
                <input
                  type="range"
                  min={-5}
                  max={5}
                  step={1}
                  value={transpose}
                  onChange={handleTransposeChange}
                  className={`transpose-slider ${sliderBounce ? 'bounce' : ''}`}
                />
                <div className="transpose-ticks">
                  <span>-5</span>
                  <span>0</span>
                  <span>+5</span>
                </div>
                <div className="transpose-value">
                  {transpose > 0 ? `+${transpose}` : transpose}
                  <span className="semitones"> 半音</span>
                </div>
              </div>
            </div>

            <div className="toolbar-section">
              <label className="toolbar-label">导出格式</label>
              <button className="toolbar-btn btn-midi" onClick={handleExportMidi}>
                🎵 导出 MIDI
              </button>
              <button className="toolbar-btn btn-pdf" onClick={handleExportPdf}>
                📄 导出 PDF
              </button>
            </div>

            <div className="toolbar-info">
              💡 提示：<br />
              • 支持最多 8 人同时编辑<br />
              • 编辑会自动同步给协作者<br />
              • 拖动分隔条可调整区域大小<br />
              • Ctrl+滚轮可缩放谱面
            </div>
          </div>
        </div>
      </div>

      {errorToasts.map(toast => (
        <div key={toast.id} className="error-toast">
          ⚠️ {toast.message}
          <button
            className="error-toast-close"
            onClick={() => dismissError(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function SelectionHighlight({
  content,
  selection,
  color,
}: {
  content: string;
  selection: { start: number; end: number };
  color: string;
}) {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);

  const beforeStart = content.substring(0, start);
  const startLines = beforeStart.split('\n');
  const startLine = startLines.length - 1;
  const startCol = startLines[startLines.length - 1].length;

  const selectedText = content.substring(start, end);
  const selectedLines = selectedText.split('\n');

  const highlights: React.ReactNode[] = [];

  selectedLines.forEach((line, idx) => {
    const lineIdx = startLine + idx;
    const colStart = idx === 0 ? startCol : 0;
    const colEnd = colStart + line.length;

    if (line.length > 0 || selectedLines.length === 1) {
      highlights.push(
        <div
          key={idx}
          className="collab-highlight"
          style={{
            top: lineIdx * LINE_HEIGHT + 2,
            left: colStart * CHAR_WIDTH,
            width: (colEnd - colStart) * CHAR_WIDTH + 2,
            height: LINE_HEIGHT - 4,
            background: color,
          }}
        />
      );
    } else if (idx < selectedLines.length - 1) {
      highlights.push(
        <div
          key={`nl-${idx}`}
          className="collab-highlight"
          style={{
            top: lineIdx * LINE_HEIGHT + 2,
            left: colStart * CHAR_WIDTH,
            width: CHAR_WIDTH * 3,
            height: LINE_HEIGHT - 4,
            background: color,
            opacity: 0.15,
          }}
        />
      );
    }
  });

  return <>{highlights}</>;
}
