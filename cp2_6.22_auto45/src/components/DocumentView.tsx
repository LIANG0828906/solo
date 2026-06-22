import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { CursorPosition, DiffLine } from '../types';

interface DocumentViewProps {
  content: string;
  mode: 'edit' | 'readonly';
  remoteCursors: CursorPosition[];
  diffLines?: DiffLine[];
  showDiff?: boolean;
  onContentChange?: (content: string) => void;
  onCursorChange?: (cursor: { line: number; column: number }, selection?: { start: number; end: number }) => void;
  disabled?: boolean;
  addedLines?: Set<number>;
  currentLine?: number;
}

const DocumentView: React.FC<DocumentViewProps> = ({
  content,
  mode,
  remoteCursors,
  diffLines,
  showDiff = false,
  onContentChange,
  onCursorChange,
  disabled = false,
  addedLines = new Set(),
  currentLine,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(0);

  const lines = useMemo(() => {
    if (showDiff && diffLines) {
      return diffLines.map((d) => d.content);
    }
    return content.split('\n');
  }, [content, diffLines, showDiff]);

  useEffect(() => {
    const updateHeight = () => {
      if (textareaRef.current) {
        const scrollHeight = textareaRef.current.scrollHeight;
        setTextareaHeight(Math.max(scrollHeight, 600));
      }
    };
    updateHeight();
  }, [content]);

  const getCaretCoordinates = (textarea: HTMLTextAreaElement) => {
    const pos = textarea.selectionStart;
    const textBefore = content.substring(0, pos);
    const linesBefore = textBefore.split('\n');
    const line = linesBefore.length - 1;
    const column = linesBefore[linesBefore.length - 1].length;
    return { line, column, pos };
  };

  const handleSelect = () => {
    if (!textareaRef.current || !onCursorChange || mode !== 'edit') return;
    const { line, column, pos } = getCaretCoordinates(textareaRef.current);
    const end = textareaRef.current.selectionEnd;
    onCursorChange({ line, column }, pos !== end ? { start: pos, end } : undefined);
  };

  const handleScroll = () => {
    if (textareaRef.current && contentRef.current) {
      contentRef.current.scrollTop = textareaRef.current.scrollTop;
      contentRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const posToLineCol = (pos: number) => {
    const textBefore = content.substring(0, pos);
    const linesBefore = textBefore.split('\n');
    return {
      line: linesBefore.length - 1,
      column: linesBefore[linesBefore.length - 1].length,
    };
  };

  const remoteSelections = useMemo(() => {
    const elements: React.ReactNode[] = [];
    const lineHeight = 22;
    const charWidth = 8.4;
    const paddingTop = 20;
    const paddingLeft = 24;

    remoteCursors.forEach((remote) => {
      if (!remote.selection || remote.selection.start === remote.selection.end) return;

      const start = Math.min(remote.selection.start, remote.selection.end);
      const end = Math.max(remote.selection.start, remote.selection.end);
      const startLC = posToLineCol(start);
      const endLC = posToLineCol(end);

      if (startLC.line === endLC.line) {
        const top = paddingTop + startLC.line * lineHeight;
        const left = paddingLeft + startLC.column * charWidth;
        const width = (endLC.column - startLC.column) * charWidth;
        elements.push(
          <div
            key={`sel-${remote.userId}`}
            style={{
              position: 'absolute',
              top: `${top + 2}px`,
              left: `${left}px`,
              width: `${Math.max(width, charWidth)}px`,
              height: `${lineHeight - 6}px`,
              backgroundColor: `${remote.color}40`,
              borderRadius: 2,
              pointerEvents: 'none',
              zIndex: 9,
            }}
          />
        );
      } else {
        for (let line = startLC.line; line <= endLC.line; line++) {
          const top = paddingTop + line * lineHeight;
          let left = paddingLeft;
          let width = 9999;
          if (line === startLC.line) {
            left = paddingLeft + startLC.column * charWidth;
          }
          if (line === endLC.line) {
            width = endLC.column * charWidth;
          }
          elements.push(
            <div
              key={`sel-${remote.userId}-${line}`}
              style={{
                position: 'absolute',
                top: `${top + 2}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${lineHeight - 6}px`,
                backgroundColor: `${remote.color}35`,
                borderRadius: 2,
                pointerEvents: 'none',
                zIndex: 9,
              }}
            />
          );
        }
      }
    });

    return elements;
  }, [remoteCursors, content]);

  const remoteCursorElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    const lineHeight = 22;
    const charWidth = 8.4;
    const paddingTop = 20;
    const paddingLeft = 24;

    remoteCursors.forEach((remote) => {
      if (!remote.cursor) return;
      const { line, column } = remote.cursor;
      const top = paddingTop + line * lineHeight;
      const left = paddingLeft + column * charWidth;

      elements.push(
        <div
          key={`cursor-${remote.userId}`}
          className="remote-cursor"
          style={{
            top: `${top}px`,
            left: `${left}px`,
            height: `${lineHeight - 4}px`,
            backgroundColor: remote.color,
          }}
        >
          <div
            className="remote-cursor-label"
            style={{ backgroundColor: remote.color }}
          >
            {remote.name}
          </div>
        </div>
      );
    });

    return elements;
  }, [remoteCursors]);

  return (
    <div className="editor-area">
      <div className="editor-wrapper">
        <div className="line-numbers">
          {showDiff && diffLines
            ? diffLines.map((diff, idx) => (
                <div
                  key={idx}
                  className={`line-number ${currentLine === idx ? 'highlight' : ''}`}
                  style={{
                    color: diff.type === 'added' ? 'var(--success)' : diff.type === 'removed' ? 'var(--danger)' : undefined,
                    backgroundColor: diff.type === 'added'
                      ? 'rgba(72, 187, 120, 0.08)'
                      : diff.type === 'removed'
                      ? 'rgba(245, 101, 101, 0.08)'
                      : undefined,
                  }}
                >
                  {diff.type === 'removed' && diff.oldLineNumber !== undefined
                    ? diff.oldLineNumber + 1
                    : diff.lineNumber + 1}
                </div>
              ))
            : lines.map((_, idx) => (
                <div
                  key={idx}
                  className={`line-number ${currentLine === idx ? 'highlight' : ''}`}
                >
                  {idx + 1}
                </div>
              ))}
        </div>
        <div className="document-content" style={{ minHeight: textareaHeight }}>
          {mode === 'edit' ? (
            <>
              <textarea
                ref={textareaRef}
                className="textarea-editor"
                value={content}
                onChange={(e) => {
                  onContentChange?.(e.target.value);
                  handleSelect();
                }}
                onSelect={handleSelect}
                onClick={handleSelect}
                onKeyUp={handleSelect}
                onKeyDown={handleSelect}
                onMouseUp={handleSelect}
                onMouseMove={(e) => {
                  if (e.buttons === 1) handleSelect();
                }}
                onInput={handleSelect}
                onScroll={handleScroll}
                disabled={disabled}
                style={{ height: textareaHeight }}
                spellCheck={false}
              />
              <div
                ref={contentRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '20px 24px', position: 'relative' }}>
                  {remoteSelections}
                  {remoteCursorElements}
                </div>
              </div>
            </>
          ) : (
            <div className="lines-display">
              {showDiff && diffLines
                ? diffLines.map((diff, idx) => (
                    <div
                      key={idx}
                      className={`line-content ${diff.type === 'added' ? 'added' : diff.type === 'removed' ? 'removed' : ''} ${currentLine === idx ? 'current-line' : ''}`}
                      style={{ position: 'relative' }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 12,
                          color: diff.type === 'added' ? 'var(--success)' : diff.type === 'removed' ? 'var(--danger)' : 'var(--text-secondary)',
                          userSelect: 'none',
                        }}
                      >
                        {diff.type === 'added' ? '+' : diff.type === 'removed' ? '−' : ' '}
                      </span>
                      <span style={{ paddingLeft: 22, display: 'inline-block' }}>
                        {diff.content || '\u00A0'}
                      </span>
                    </div>
                  ))
                : lines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`line-content ${addedLines.has(idx) ? 'added' : ''} ${currentLine === idx ? 'current-line' : ''}`}
                    >
                      {line || '\u00A0'}
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentView;
