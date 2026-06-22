import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useStore } from '@/stores/useStore';

const KEYWORDS = [
  'true', 'false', 'null', 'undefined', 'type', 'props', 'children',
];

function highlightJson(json: string): string {
  let html = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(
    /("(?:[^"\\]|\\.)*")\s*:/g,
    '<span style="color:#569CD6">$1</span>:'
  );

  html = html.replace(
    /:\s*("(?:[^"\\]|\\.)*")/g,
    ': <span style="color:#CE9178">$1</span>'
  );

  html = html.replace(
    /:\s*(\d+(?:\.\d+)?)/g,
    ': <span style="color:#B5CEA8">$1</span>'
  );

  html = html.replace(
    new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'g'),
    '<span style="color:#569CD6">$1</span>'
  );

  return html;
}

export const JsonEditor: React.FC = () => {
  const { jsonConfig, setJsonConfig, jsonError } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    const lines = jsonConfig.split('\n').length;
    setLineCount(lines);
  }, [jsonConfig]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setJsonConfig(e.target.value);
    },
    [setJsonConfig]
  );

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#F0F2F5',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '10px 12px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#1A1A2E',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1890FF" strokeWidth="2">
          <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
        </svg>
        Component Config
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: '280px' }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '32px',
          backgroundColor: '#E8EAED',
          padding: '8px 4px',
          fontSize: '11px',
          color: '#999',
          fontFamily: 'monospace',
          lineHeight: '1.5',
          textAlign: 'right',
          userSelect: 'none',
          overflow: 'hidden',
        }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <pre
          ref={preRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '32px',
            top: 0,
            right: 0,
            bottom: 0,
            margin: 0,
            padding: '8px 10px',
            fontSize: '13px',
            fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'auto',
            color: 'transparent',
            pointerEvents: 'none',
            backgroundColor: 'transparent',
          }}
          dangerouslySetInnerHTML={{ __html: highlightJson(jsonConfig) }}
        />

        <textarea
          ref={textareaRef}
          value={jsonConfig}
          onChange={handleChange}
          onScroll={handleScroll}
          spellCheck={false}
          style={{
            position: 'absolute',
            left: '32px',
            top: 0,
            right: 0,
            bottom: 0,
            width: 'calc(100% - 32px)',
            height: '100%',
            margin: 0,
            padding: '8px 10px',
            fontSize: '13px',
            fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'auto',
            color: 'transparent',
            caretColor: '#1A1A2E',
            backgroundColor: '#1E1E2E',
            border: 'none',
            outline: 'none',
            resize: 'none',
            zIndex: 1,
          }}
        />
      </div>

      {jsonError && (
        <div style={{
          margin: '0 8px 8px 8px',
          padding: '8px',
          backgroundColor: '#FFDCDC',
          color: '#F44747',
          borderRadius: '4px',
          fontSize: '12px',
          lineHeight: '1.4',
          wordBreak: 'break-all',
        }}>
          JSON syntax error: {jsonError}
        </div>
      )}
    </div>
  );
};
