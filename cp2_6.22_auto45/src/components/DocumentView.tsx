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
          {lines.map((_, idx) => (
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
                <div style={{ padding: '20px 24px' }}>
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
                    >
                      {diff.content || '\u00A0'}
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
