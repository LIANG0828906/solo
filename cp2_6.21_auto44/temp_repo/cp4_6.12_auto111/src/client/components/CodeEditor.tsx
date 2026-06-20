import React, { useRef, useEffect, useState } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  minLines?: number;
}

const KEYWORDS = [
  'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'new', 'class', 'extends',
  'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch',
  'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'true', 'false',
  'null', 'undefined', 'this', 'super', 'void', 'delete',
];

function highlightSyntax(code: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      let matched = false;

      const commentMatch = remaining.match(/^\/\/.*$/);
      if (commentMatch) {
        tokens.push(<span key={`${lineIdx}-${key++}`} style={{ color: '#9e9e9e', fontStyle: 'italic' }}>{commentMatch[0]}</span>);
        remaining = remaining.slice(commentMatch[0].length);
        matched = true;
        continue;
      }

      const strMatch = remaining.match(/^(['"`])(?:\\.|[^\\])*?\1/);
      if (strMatch) {
        tokens.push(<span key={`${lineIdx}-${key++}`} style={{ color: '#4caf50' }}>{strMatch[0]}</span>);
        remaining = remaining.slice(strMatch[0].length);
        matched = true;
        continue;
      }

      const numMatch = remaining.match(/^\b\d+(\.\d+)?\b/);
      if (numMatch) {
        tokens.push(<span key={`${lineIdx}-${key++}`} style={{ color: '#ff9800' }}>{numMatch[0]}</span>);
        remaining = remaining.slice(numMatch[0].length);
        matched = true;
        continue;
      }

      const wordMatch = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
      if (wordMatch) {
        const word = wordMatch[0];
        if (KEYWORDS.includes(word)) {
          tokens.push(<span key={`${lineIdx}-${key++}`} style={{ color: '#2196f3', fontWeight: 600 }}>{word}</span>);
        } else {
          tokens.push(<span key={`${lineIdx}-${key++}`} style={{ color: '#37474f' }}>{word}</span>);
        }
        remaining = remaining.slice(word.length);
        matched = true;
        continue;
      }

      const punctMatch = remaining.match(/^[{}()\[\];,.+\-*/%=<>!&|^~?:]/);
      if (punctMatch) {
        tokens.push(<span key={`${lineIdx}-${key++}`} style={{ color: '#607d8b' }}>{punctMatch[0]}</span>);
        remaining = remaining.slice(1);
        matched = true;
        continue;
      }

      if (!matched) {
        tokens.push(<span key={`${lineIdx}-${key++}`}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
    }

    return (
      <div key={lineIdx} style={{ minHeight: '20px' }}>
        {tokens.length === 0 ? '\u00A0' : tokens}
      </div>
    );
  });
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  readOnly = false,
  minLines = 15,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  const lineHeight = 20;
  const padding = 12;

  useEffect(() => {
    const lines = code.split('\n').length;
    const visibleLines = Math.max(lines, minLines);
    setHeight(visibleLines * lineHeight + padding * 2);
  }, [code, minLines]);

  useEffect(() => {
    const syncScroll = () => {
      if (textareaRef.current && preRef.current && lineNumbersRef.current) {
        preRef.current.scrollTop = textareaRef.current.scrollTop;
        preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };
    const ta = textareaRef.current;
    if (ta) {
      ta.addEventListener('scroll', syncScroll);
    }
    return () => {
      if (ta) ta.removeEventListener('scroll', syncScroll);
    };
  }, []);

  const lines = code.split('\n');
  const lineNumbers = Array.from({ length: lines.length }, (_, i) => i + 1);

  return (
    <div style={{ position: 'relative', display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0', background: '#fafafa' }}>
      <div
        ref={lineNumbersRef}
        style={{
          padding: `${padding}px 8px`,
          background: '#f5f5f5',
          color: '#9e9e9e',
          fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
          fontSize: '13px',
          lineHeight: `${lineHeight}px`,
          textAlign: 'right',
          userSelect: 'none',
          borderRight: '1px solid #e0e0e0',
          overflow: 'hidden',
          minHeight: `${height}px`,
        }}
      >
        {lineNumbers.map((n) => (
          <div key={n} style={{ height: `${lineHeight}px` }}>
            {n}
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <pre
          ref={preRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
            padding: `${padding}px`,
            fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
            fontSize: '13px',
            lineHeight: `${lineHeight}px`,
            whiteSpace: 'pre',
            overflow: 'auto',
            color: '#37474f',
            pointerEvents: 'none',
            background: 'transparent',
          }}
        >
          {highlightSyntax(code + (code.endsWith('\n') ? ' ' : ''))}
        </pre>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          style={{
            position: 'relative',
            width: '100%',
            height: `${height}px`,
            padding: `${padding}px`,
            fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
            fontSize: '13px',
            lineHeight: `${lineHeight}px`,
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            color: readOnly ? 'transparent' : 'transparent',
            caretColor: '#37474f',
            overflow: 'auto',
            whiteSpace: 'pre',
            wordWrap: 'normal',
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
