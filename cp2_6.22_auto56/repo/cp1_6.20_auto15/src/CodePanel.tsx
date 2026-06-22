import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { Annotation, Selection } from './types';
import { getLines, highlightCode, detectLanguage } from './utils';
import './CodePanel.css';

interface CodePanelProps {
  code: string;
  annotations: Annotation[];
  selection: Selection;
  onSelectionChange: (selection: Selection) => void;
  onAddAnnotation: (startLine: number, endLine: number, content: string) => void;
}

const CodePanel: React.FC<CodePanelProps> = ({
  code,
  annotations,
  selection,
  onSelectionChange,
  onAddAnnotation,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [inputPosition, setInputPosition] = useState({ top: 0, right: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelecting = useRef(false);
  const startLineRef = useRef(0);

  const lines = useMemo(() => getLines(code), [code]);
  const language = useMemo(() => detectLanguage(code), [code]);
  const highlightedLines = useMemo(() => {
    return lines.map((line) => highlightCode(line || ' ', language));
  }, [lines, language]);

  const getLineFromEvent = useCallback((e: React.MouseEvent): number => {
    const target = e.target as HTMLElement;
    const lineElement = target.closest('[data-line]');
    if (lineElement) {
      return parseInt(lineElement.getAttribute('data-line') || '0', 10);
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const lineHeight = 24;
      const paddingTop = 16;
      const relativeY = e.clientY - rect.top - paddingTop;
      const lineNum = Math.floor(relativeY / lineHeight) + 1;
      return Math.max(1, Math.min(lineNum, lines.length));
    }
    return 1;
  }, [lines.length]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const line = getLineFromEvent(e);
    if (line > 0) {
      isSelecting.current = true;
      startLineRef.current = line;
      onSelectionChange({
        startLine: line,
        endLine: line,
        isActive: true,
      });
      setShowInput(false);
    }
  }, [getLineFromEvent, onSelectionChange]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting.current) return;
    const currentLine = getLineFromEvent(e);
    const start = Math.min(startLineRef.current, currentLine);
    const end = Math.max(startLineRef.current, currentLine);
    onSelectionChange({
      startLine: start,
      endLine: end,
      isActive: true,
    });
  }, [getLineFromEvent, onSelectionChange]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isSelecting.current) return;
    isSelecting.current = false;
    const currentLine = getLineFromEvent(e);
    const start = Math.min(startLineRef.current, currentLine);
    const end = Math.max(startLineRef.current, currentLine);
    if (start > 0 && end > 0) {
      onSelectionChange({
        startLine: start,
        endLine: end,
        isActive: false,
      });
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setInputPosition({
          top: e.clientY - rect.top + 10,
          right: 10,
        });
      }
      setShowInput(true);
      setInputValue('');
    }
  }, [getLineFromEvent, onSelectionChange]);

  const handleGlobalMouseUp = useCallback(() => {
    if (isSelecting.current) {
      isSelecting.current = false;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseUp]);

  const handleSubmit = useCallback(() => {
    if (inputValue.trim() && selection.startLine > 0) {
      onAddAnnotation(selection.startLine, selection.endLine, inputValue.trim());
      setShowInput(false);
      setInputValue('');
      onSelectionChange({
        startLine: 0,
        endLine: 0,
        isActive: false,
      });
    }
  }, [inputValue, selection, onAddAnnotation, onSelectionChange]);

  const handleCancel = useCallback(() => {
    setShowInput(false);
    setInputValue('');
    onSelectionChange({
      startLine: 0,
      endLine: 0,
      isActive: false,
    });
  }, [onSelectionChange]);

  const isLineSelected = useCallback((lineNum: number): boolean => {
    if (!selection.isActive && !showInput) return false;
    return lineNum >= selection.startLine && lineNum <= selection.endLine;
  }, [selection, showInput]);

  const hasAnnotation = useCallback((lineNum: number): boolean => {
    return annotations.some(
      (a) => lineNum >= a.startLine && lineNum <= a.endLine
    );
  }, [annotations]);

  if (!code) {
    return (
      <div className="code-panel code-panel-empty">
        <div className="code-panel-placeholder">
          请在上方粘贴代码片段开始审查
        </div>
      </div>
    );
  }

  return (
    <div className="code-panel-wrapper">
      <div
        ref={containerRef}
        className="code-panel"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="code-panel-content">
          {lines.map((_line, index) => {
            const lineNum = index + 1;
            const selected = isLineSelected(lineNum);
            const annotated = hasAnnotation(lineNum);
            return (
              <div
                key={lineNum}
                data-line={lineNum}
                className={`code-line ${selected ? 'selected' : ''} ${annotated ? 'annotated' : ''}`}
              >
                <div className="line-number" data-line-num={lineNum}>
                  {lineNum}
                </div>
                <div
                  className="line-content"
                  dangerouslySetInnerHTML={{ __html: highlightedLines[index] }}
                />
              </div>
            );
          })}
        </div>

        {showInput && (
          <div
            className="annotation-input-panel"
            style={{ top: inputPosition.top, right: inputPosition.right }}
          >
            <div className="annotation-input-header">
              第 {selection.startLine}-{selection.endLine} 行
            </div>
            <textarea
              className="annotation-input-textarea"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入批注内容..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmit();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />
            <div className="annotation-input-actions">
              <button className="btn btn-cancel" onClick={handleCancel}>
                取消
              </button>
              <button
                className="btn btn-submit"
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
              >
                提交批注
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CodePanel);
