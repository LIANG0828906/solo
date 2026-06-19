import { useRef, useEffect, useState, useCallback } from 'react';
import { highlightCode } from '../utils/parserHelper';
import './Editor.css';

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  isRunning: boolean;
  hasRun: boolean;
  highlightLine: number;
  errorLine: number;
}

const DEFAULT_CODE = `function max(a, b) {
  if (a > b) return a;
  return b;
}

let result = max(5, 3);
`;

export default function Editor({
  code,
  onChange,
  onRun,
  isRunning,
  hasRun,
  highlightLine,
  errorLine,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!code) {
      onChange(DEFAULT_CODE);
    }
  }, []);

  useEffect(() => {
    const { lineCount: count } = highlightCode(code || '');
    setLineCount(count);
  }, [code]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current && gutterRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      const scrollLeft = textareaRef.current.scrollLeft;
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
      gutterRef.current.scrollTop = scrollTop;
    }
  }, []);

  const handleRun = () => {
    setShowLoading(true);
    setTimeout(() => {
      setShowLoading(false);
      onRun();
    }, 300);
  };

  useEffect(() => {
    if (highlightLine > 0 && textareaRef.current) {
      const lineHeight = 20;
      const targetScroll = (highlightLine - 5) * lineHeight;
      textareaRef.current.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [highlightLine]);

  const { html } = highlightCode(code || '');
  const lines = code.split('\n');

  return (
    <div className="editor-container">
      <div className="editor-status-bar">
        <span className="editor-filename">script.js</span>
        <button
          className={`run-button ${hasRun && !isRunning ? 'rerun' : ''}`}
          onClick={handleRun}
          disabled={isRunning}
          title={hasRun ? '重新运行代码' : '运行代码'}
        >
          {isRunning ? '运行中...' : hasRun ? '重新运行' : '运行'}
        </button>
      </div>

      {showLoading && (
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
      )}

      <div className="editor-wrapper">
        <div className="line-numbers scrollbar" ref={gutterRef}>
          {Array.from({ length: lineCount }, (_, i) => {
            const lineNum = i + 1;
            const isHighlighted = lineNum === highlightLine;
            const isError = lineNum === errorLine;
            return (
              <div
                key={lineNum}
                className={`line-number ${isHighlighted ? 'highlighted-gutter' : ''} ${isError ? 'error-gutter' : ''}`}
              >
                {isHighlighted && <span className="line-arrow">▶</span>}
                <span className="line-number-text">{lineNum}</span>
              </div>
            );
          })}
        </div>

        <div className="code-area">
          <pre
            ref={preRef}
            className="code-highlight scrollbar"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <textarea
            ref={textareaRef}
            className="code-input scrollbar"
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            wrap="off"
          />
          <div className="highlight-overlays">
            {lines.map((_, i) => {
              const lineNum = i + 1;
              const isHighlighted = lineNum === highlightLine;
              const isError = lineNum === errorLine;
              return (
                <div
                  key={lineNum}
                  className={`highlight-overlay ${isHighlighted ? 'active-line' : ''} ${isError ? 'error-line' : ''}`}
                  style={{ top: `${i * 20}px` }}
                >
                  {isError && <div className="error-wavy" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
