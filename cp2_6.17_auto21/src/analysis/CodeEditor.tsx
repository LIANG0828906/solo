import { useState, useEffect, useRef, useCallback } from 'react';
import { useAnalysisStore } from './store';
import { getSampleCode } from './analyzer';
import type { Issue, IssueType } from '../utils/db';

const TYPE_COLORS: Record<IssueType, string> = {
  'duplication': '#FFE0E0',
  'complexity': '#FFF0D0',
  'long-function': '#E0F0FF',
};

const TYPE_BORDER_COLORS: Record<IssueType, string> = {
  'duplication': '#FFB0B0',
  'complexity': '#FFE080',
  'long-function': '#B0D0FF',
};

const TYPE_UNDERLINE_COLORS: Record<IssueType, string> = {
  'duplication': '#FF6B6B',
  'complexity': '#F0A030',
  'long-function': '#4A90D9',
};

const LINE_HEIGHT = 22;
const FONT_SIZE = 14;
const LINE_NUMBER_WIDTH = 52;

interface CodeEditorProps {
  onHistoryClick: () => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function simpleJsHighlight(line: string): string {
  let result = escapeHtml(line);

  result = result.replace(
    /\b(function|const|let|var|return|if|else|for|while|switch|case|break|continue|new|typeof|instanceof|try|catch|finally|throw|class|extends|import|export|default|async|await|yield|from|of|in|do|delete|void|this|super|static|get|set)\b/g,
    '<span style="color:#C586C0">$1</span>'
  );

  result = result.replace(
    /\b(true|false|null|undefined|NaN|Infinity)\b/g,
    '<span style="color:#569CD6">$1</span>'
  );

  result = result.replace(
    /\b(console)\b/g,
    '<span style="color:#4EC9B0">$1</span>'
  );

  result = result.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
    '<span style="color:#CE9178">$1</span>'
  );

  result = result.replace(
    /\/\/.*$/g,
    '<span style="color:#6A9955">$&</span>'
  );

  result = result.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span style="color:#B5CEA8">$1</span>'
  );

  return result;
}

export default function CodeEditor({ onHistoryClick }: CodeEditorProps) {
  const {
    code,
    filename,
    result,
    isAnalyzing,
    highlightLineStart,
    highlightLineEnd,
    setCode,
    setFilename,
    analyzeCode,
    selectIssue,
    setHighlight,
  } = useAnalysisStore();

  const [loadedSample, setLoadedSample] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!code && !loadedSample) {
      const sample = getSampleCode();
      setCode(sample, 'example.js');
      setLoadedSample(true);
    }
  }, [code, loadedSample, setCode]);

  useEffect(() => {
    if (highlightLineStart !== null && highlightLineEnd !== null) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 600);
      return () => clearTimeout(timer);
    }
  }, [highlightLineStart, highlightLineEnd]);

  useEffect(() => {
    if (highlightLineStart !== null && scrollContainerRef.current) {
      const targetScrollTop = Math.max(0, (highlightLineStart - 5) * LINE_HEIGHT);
      scrollContainerRef.current.scrollTop = targetScrollTop;
    }
  }, [highlightLineStart]);

  const syncScroll = useCallback(() => {
    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
    const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
    if (overlayRef.current) {
      overlayRef.current.scrollTop = scrollTop;
      overlayRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  }, []);

  const lines = code.split('\n');
  const lineCount = lines.length;

  const getIssueForLine = (lineNum: number): Issue | null => {
    if (!result) return null;
    for (const issue of result.issues) {
      if (lineNum >= issue.lineStart && lineNum <= issue.lineEnd) {
        return issue;
      }
    }
    return null;
  };

  const getPrimaryIssueForLine = (lineNum: number): Issue | null => {
    if (!result) return null;
    for (const issue of result.issues) {
      if (lineNum === issue.lineStart) return issue;
    }
    return null;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!result) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const y = e.clientY - rect.top + scrollTop;
    const lineNum = Math.floor(y / LINE_HEIGHT) + 1;

    const issue = getIssueForLine(lineNum);
    if (issue) {
      setActiveIssueId(issue.id);
      selectIssue(issue.id);
    } else {
      setActiveIssueId(null);
      selectIssue(null);
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!result) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const y = e.clientY - rect.top + scrollTop;
    const lineNum = Math.floor(y / LINE_HEIGHT) + 1;

    const issue = getIssueForLine(lineNum);
    if (issue) {
      setHighlight(issue.lineStart, issue.lineEnd);
    }
  };

  const handleOverlayMouseLeave = () => {
    if (activeIssueId) {
      const issue = result?.issues.find(i => i.id === activeIssueId);
      if (issue) {
        setHighlight(issue.lineStart, issue.lineEnd);
      }
    } else {
      setHighlight(null, null);
    }
  };

  const renderLineNumbers = () => {
    return (
      <div
        ref={lineNumbersRef}
        style={{
          width: `${LINE_NUMBER_WIDTH}px`,
          flexShrink: 0,
          backgroundColor: '#1E1E1E',
          color: '#858585',
          textAlign: 'right',
          paddingRight: '12px',
          paddingLeft: '12px',
          borderRight: '1px solid #333',
          overflow: 'hidden',
          userSelect: 'none',
          fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
          fontSize: `${FONT_SIZE}px`,
          lineHeight: `${LINE_HEIGHT}px`,
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => {
          const lineNum = i + 1;
          const issue = getIssueForLine(lineNum);
          return (
            <div
              key={i}
              style={{
                height: `${LINE_HEIGHT}px`,
                backgroundColor: issue ? TYPE_BORDER_COLORS[issue.type] + '30' : undefined,
              }}
            >
              {lineNum}
            </div>
          );
        })}
      </div>
    );
  };

  const renderHighlightedCode = () => {
    return lines.map((line, index) => {
      const lineNum = index + 1;
      const issue = getIssueForLine(lineNum);
      const primaryIssue = getPrimaryIssueForLine(lineNum);
      const isHighlightedRange = highlightLineStart !== null
        && highlightLineEnd !== null
        && lineNum >= highlightLineStart
        && lineNum <= highlightLineEnd;

      const lineStyle: React.CSSProperties = {
        height: `${LINE_HEIGHT}px`,
        whiteSpace: 'pre',
        position: 'relative',
        paddingLeft: '8px',
        paddingRight: '8px',
        transition: 'all 0.5s ease-in-out',
      };

      if (issue) {
        lineStyle.backgroundColor = TYPE_COLORS[issue.type];
      }

      if (primaryIssue) {
        lineStyle.borderLeft = `3px solid ${TYPE_BORDER_COLORS[primaryIssue.type]}`;
        lineStyle.paddingLeft = '5px';
      }

      if (isHighlightedRange && showAnimation) {
        lineStyle.textDecoration = `underline wavy ${TYPE_UNDERLINE_COLORS[issue?.type ?? 'duplication']}`;
        lineStyle.textUnderlineOffset = '3px';
      }

      const highlighted = simpleJsHighlight(line || ' ');

      return (
        <div key={index} style={lineStyle}>
          <span
            style={{ color: issue ? '#1A1A2E' : '#D4D4D4' }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      );
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1E1E1E' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '8px',
        paddingBottom: '8px',
        backgroundColor: '#252526',
        borderBottom: '1px solid #333',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              color: '#CCCCCC',
              fontSize: '14px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid transparent',
              fontFamily: "'Cascadia Code', Consolas, monospace",
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#0078D4'; }}
            onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
            onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.borderColor = '#555'; }}
            onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.borderColor = 'transparent'; }}
          />
          <span style={{ color: '#888', fontSize: '12px' }}>
            {lineCount} 行
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onHistoryClick}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              color: '#CCCCCC',
              backgroundColor: '#333',
              borderRadius: '6px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#333'; }}
          >
            📚 历史记录
          </button>
          <button
            onClick={analyzeCode}
            disabled={isAnalyzing || !code.trim()}
            style={{
              padding: '6px 16px',
              fontSize: '14px',
              color: 'white',
              backgroundColor: isAnalyzing || !code.trim() ? '#555' : '#0078D4',
              borderRadius: '6px',
              transition: 'background-color 0.15s ease',
              cursor: isAnalyzing || !code.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => { if (!isAnalyzing && code.trim()) e.currentTarget.style.backgroundColor = '#1086E0'; }}
            onMouseLeave={(e) => { if (!isAnalyzing && code.trim()) e.currentTarget.style.backgroundColor = '#0078D4'; }}
          >
            {isAnalyzing ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
                分析中...
              </>
            ) : (
              <>🔍 分析代码</>
            )}
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={syncScroll}
        onClick={handleOverlayClick}
        onMouseMove={handleOverlayMouseMove}
        onMouseLeave={handleOverlayMouseLeave}
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {renderLineNumbers()}

        <div style={{ flex: 1, position: 'relative' }}>
          <div
            ref={overlayRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 1,
              fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
              fontSize: `${FONT_SIZE}px`,
              lineHeight: `${LINE_HEIGHT}px`,
              padding: 0,
              margin: 0,
            }}
          >
            {renderHighlightedCode()}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={syncScroll}
            spellCheck={false}
            placeholder="在此输入 JavaScript 代码..."
            style={{
              width: '100%',
              minHeight: 'calc(100vh - 120px)',
              padding: 0,
              margin: 0,
              backgroundColor: 'transparent',
              color: 'transparent',
              caretColor: '#D4D4D4',
              resize: 'none',
              outline: 'none',
              border: 'none',
              fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
              fontSize: `${FONT_SIZE}px`,
              lineHeight: `${LINE_HEIGHT}px`,
              position: 'relative',
              zIndex: 2,
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              overflow: 'hidden',
            }}
          />
        </div>
      </div>

      <div style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '4px',
        paddingBottom: '4px',
        backgroundColor: '#0078D4',
        color: 'white',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>JavaScript</span>
        <span>UTF-8</span>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
