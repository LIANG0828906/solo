import { useState, useEffect, useRef, useCallback } from 'react';
import { useAnalysisStore } from './store';
import { getSampleCode } from './analyzer';
import type { Issue } from '../utils/db';

const TYPE_COLORS: Record<string, string> = {
  'duplication': '#FFE0E0',
  'complexity': '#FFF0D0',
  'long-function': '#E0F0FF',
};

const TYPE_BORDER_COLORS: Record<string, string> = {
  'duplication': '#FFB0B0',
  'complexity': '#FFE080',
  'long-function': '#B0D0FF',
};

interface CodeEditorProps {
  onHistoryClick: () => void;
}

export default function CodeEditor({ onHistoryClick }: CodeEditorProps) {
  const {
    code,
    filename,
    result,
    isAnalyzing,
    selectedIssueId,
    highlightLineStart,
    highlightLineEnd,
    setCode,
    setFilename,
    analyzeCode,
    selectIssue,
    setHighlight,
  } = useAnalysisStore();

  const [showAnimation, setShowAnimation] = useState(false);
  const [loadedSample, setLoadedSample] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!code && !loadedSample) {
      const sample = getSampleCode();
      setCode(sample, 'example.js');
      setLoadedSample(true);
    }
  }, [code, loadedSample, setCode]);

  useEffect(() => {
    if (highlightLineStart !== null && highlightLineEnd !== null && result) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 600);
      return () => clearTimeout(timer);
    }
  }, [highlightLineStart, highlightLineEnd, result]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current && highlightRef.current && textareaRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const scrollLeft = scrollRef.current.scrollLeft;
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
      textareaRef.current.scrollTop = scrollTop;
      textareaRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  const getLineBackground = (lineNum: number, issues: Issue[]): string | null => {
    for (const issue of issues) {
      if (lineNum >= issue.lineStart && lineNum <= issue.lineEnd) {
        return TYPE_COLORS[issue.type];
      }
    }
    return null;
  };

  const getIssueForLine = (lineNum: number, issues: Issue[]): Issue | null => {
    for (const issue of issues) {
      if (lineNum >= issue.lineStart && lineNum <= issue.lineEnd) {
        return issue;
      }
    }
    return null;
  };

  const isHighlighted = (lineNum: number): boolean => {
    return highlightLineStart !== null 
      && highlightLineEnd !== null 
      && lineNum >= highlightLineStart 
      && lineNum <= highlightLineEnd;
  };

  const lines = code.split('\n');
  const lineCount = lines.length;

  const renderHighlightedLines = () => {
    if (!result) return code;
    
    return lines.map((line, index) => {
      const lineNum = index + 1;
      const bgColor = getLineBackground(lineNum, result.issues);
      const issue = getIssueForLine(lineNum, result.issues);
      const highlighted = isHighlighted(lineNum);
      
      let style = '';
      if (bgColor) {
        style += `background-color: ${bgColor};`;
      }
      if (highlighted && showAnimation) {
        style += 'text-decoration: underline; text-decoration-thickness: 2px;';
      }
      if (issue && lineNum === issue.lineStart) {
        style += `border-left: 3px solid ${TYPE_BORDER_COLORS[issue.type]};`;
      }
      
      if (style) {
        return `<span style="${style}">${line || ' '}</span>`;
      }
      return line || ' ';
    }).join('\n');
  };

  const handleLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!result) return;
    
    const rect = scrollRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const lineHeight = 22.4;
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const y = e.clientY - rect.top + scrollTop;
    const lineNum = Math.floor(y / lineHeight) + 1;
    
    const issue = getIssueForLine(lineNum, result.issues);
    if (issue) {
      selectIssue(issue.id);
    } else {
      selectIssue(null);
    }
  };

  const scrollToLine = (lineNum: number) => {
    if (scrollRef.current) {
      const lineHeight = 22.4;
      scrollRef.current.scrollTop = (lineNum - 5) * lineHeight;
    }
  };

  useEffect(() => {
    if (highlightLineStart !== null) {
      scrollToLine(highlightLineStart);
    }
  }, [highlightLineStart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!result) return;
    
    const rect = scrollRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const lineHeight = 22.4;
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const y = e.clientY - rect.top + scrollTop;
    const lineNum = Math.floor(y / lineHeight) + 1;
    
    const issue = getIssueForLine(lineNum, result.issues);
    if (issue && issue.id !== selectedIssueId) {
      setHighlight(issue.lineStart, issue.lineEnd);
    }
  };

  const handleMouseLeave = () => {
    if (selectedIssueId) {
      const issue = result?.issues.find(i => i.id === selectedIssueId);
      if (issue) {
        setHighlight(issue.lineStart, issue.lineEnd);
      }
    } else {
      setHighlight(null, null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="bg-transparent text-[#CCCCCC] text-sm px-2 py-1 rounded border border-transparent hover:border-[#555] focus:border-[#0078D4] focus:outline-none transition-colors"
            style={{ fontFamily: "'Cascadia Code', Consolas, monospace" }}
          />
          <span className="text-[#888] text-xs">
            {lineCount} 行
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onHistoryClick}
            className="px-3 py-1.5 text-sm text-[#CCCCCC] bg-[#333] hover:bg-[#444] rounded transition-colors"
          >
            历史记录
          </button>
          <button
            onClick={analyzeCode}
            disabled={isAnalyzing || !code.trim()}
            className="px-4 py-1.5 text-sm text-white bg-[#0078D4] hover:bg-[#1086E0] disabled:bg-[#555] disabled:cursor-not-allowed rounded transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin">⚙️</span>
                分析中...
              </>
            ) : (
              <>🔍 分析代码</>
            )}
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
        onClick={handleLineClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex min-h-full">
          <div 
            className="select-none bg-[#1E1E1E] text-[#858585] text-right pr-4 pl-4 py-2 border-r border-[#333]"
            style={{ 
              fontFamily: "'Cascadia Code', Consolas, monospace",
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} style={{ height: '22.4px' }}>
                {i + 1}
              </div>
            ))}
          </div>

          <div className="relative flex-1">
            <pre
              ref={highlightRef}
              className="absolute inset-0 p-2 m-0 overflow-hidden pointer-events-none"
              style={{
                fontFamily: "'Cascadia Code', Consolas, monospace",
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'transparent',
                whiteSpace: 'pre',
                wordWrap: 'normal',
                transition: 'all 0.5s ease-in-out',
              }}
              dangerouslySetInnerHTML={{ __html: renderHighlightedLines() }}
            />
            
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              className="w-full h-full p-2 bg-transparent text-[#D4D4D4] resize-none outline-none"
              style={{
                fontFamily: "'Cascadia Code', Consolas, monospace",
                fontSize: '14px',
                lineHeight: '1.6',
                minHeight: 'calc(100vh - 120px)',
                caretColor: '#D4D4D4',
              }}
              spellCheck={false}
              placeholder="在此输入 JavaScript 代码..."
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-1 bg-[#0078D4] text-white text-xs flex items-center justify-between">
        <span>JavaScript</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
