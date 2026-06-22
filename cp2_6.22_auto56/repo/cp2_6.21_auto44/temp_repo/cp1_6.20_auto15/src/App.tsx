import React, { useState, useCallback, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import AnnotationList from './AnnotationList';
import type { Annotation, Selection, Reply } from './types';
import { generateId, downloadJson } from './utils';
import './App.css';

const DEFAULT_AUTHOR = '当前用户';

const App: React.FC = () => {
  const [code, setCode] = useState('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selection, setSelection] = useState<Selection>({
    startLine: 0,
    endLine: 0,
    isActive: false,
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [leftWidth, setLeftWidth] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    if (newCode.length <= 100000) {
      setCode(newCode);
    }
  }, []);

  const handleAddAnnotation = useCallback(
    (startLine: number, endLine: number, content: string) => {
      const newAnnotation: Annotation = {
        id: generateId(),
        startLine,
        endLine,
        author: DEFAULT_AUTHOR,
        content,
        createdAt: new Date(),
        replies: [],
        isExpanded: false,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
    },
    []
  );

  const handleToggleExpand = useCallback((id: string) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, isExpanded: !a.isExpanded } : a
      )
    );
  }, []);

  const handleAddReply = useCallback((annotationId: string, content: string) => {
    const newReply: Reply = {
      id: generateId(),
      author: DEFAULT_AUTHOR,
      content,
      createdAt: new Date(),
    };
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === annotationId
          ? { ...a, replies: [...a.replies, newReply] }
          : a
      )
    );
  }, []);

  const handleClearAll = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const confirmClearAll = useCallback(() => {
    setAnnotations([]);
    setSelection({ startLine: 0, endLine: 0, isActive: false });
    setShowConfirmDialog(false);
    showToastMessage('已清除所有批注');
  }, []);

  const cancelClearAll = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 500);
  }, []);

  const handleExportReport = useCallback(() => {
    const report = {
      code,
      exportedAt: new Date().toISOString(),
      annotations: annotations.map((a) => ({
        id: a.id,
        lineRange: `第 ${a.startLine}-${a.endLine} 行`,
        author: a.author,
        content: a.content,
        createdAt: a.createdAt.toISOString(),
        replies: a.replies.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      })),
    };
    const filename = `code-review-report-${Date.now()}.json`;
    downloadJson(report, filename);
    showToastMessage('审查报告已导出');
  }, [code, annotations, showToastMessage]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const mouseX = e.clientX - rect.left;
      const newWidth = (mouseX / containerWidth) * 100;
      setLeftWidth(Math.max(30, Math.min(80, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">代码审查工具</h1>
        <div className="code-input-section">
          <textarea
            className="code-input"
            value={code}
            onChange={handleCodeChange}
            placeholder="在此粘贴代码片段..."
            spellCheck={false}
          />
          <div className="char-count">
            {code.length} / 100000 字符
          </div>
        </div>
      </header>

      <div className="app-container" ref={containerRef}>
        <div
          className="pane code-pane"
          style={{ width: `${leftWidth}%` }}
        >
          <CodePanel
            code={code}
            annotations={annotations}
            selection={selection}
            onSelectionChange={setSelection}
            onAddAnnotation={handleAddAnnotation}
          />
        </div>

        <div
          className={`resizer ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
        />

        <div
          className="pane annotations-pane"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <AnnotationList
            annotations={annotations}
            onToggleExpand={handleToggleExpand}
            onAddReply={handleAddReply}
          />
        </div>
      </div>

      <footer className="app-footer">
        <div className="footer-actions">
          <button className="footer-btn btn-danger" onClick={handleClearAll}>
            清除所有批注
          </button>
          <button className="footer-btn btn-primary" onClick={handleExportReport}>
            导出审查报告
          </button>
        </div>
      </footer>

      {showConfirmDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">确认操作</div>
            <div className="modal-content">
              确定要清除所有批注吗？此操作不可撤销。
            </div>
            <div className="modal-actions">
              <button className="modal-btn btn-cancel" onClick={cancelClearAll}>
                取消
              </button>
              <button className="modal-btn btn-confirm" onClick={confirmClearAll}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className={`toast ${showToast ? 'show' : ''}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
