import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { highlightCode, HighlightToken } from '@/utils/highlightWorker';
import AnnotationBubble from './AnnotationBubble';

const LINE_HEIGHT = 22;
const GUTTER_WIDTH = 56;
const FONT_SIZE = 14;

interface ActiveAnnotation {
  lineNumber: number;
  x: number;
  y: number;
}

const CodeEditor = () => {
  const {
    code,
    language,
    setCode,
    currentDraftId,
    annotations,
    addAnnotation,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [tokens, setTokens] = useState<HighlightToken[]>([]);
  const [lineCount, setLineCount] = useState(0);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [activeAnnotation, setActiveAnnotation] = useState<ActiveAnnotation | null>(null);
  const [previewAnnotation, setPreviewAnnotation] = useState<{
    lineNumber: number;
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const [currentLine, setCurrentLine] = useState(0);
  const highlightDebounceRef = useRef<number>();

  const lines = useMemo(() => code.split('\n'), [code]);

  const updateCurrentLine = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const textBefore = code.substring(0, pos);
    setCurrentLine(textBefore.split('\n').length - 1);
  }, [code]);

  const triggerHighlight = useCallback(() => {
    if (highlightDebounceRef.current) {
      window.clearTimeout(highlightDebounceRef.current);
    }
    highlightDebounceRef.current = window.setTimeout(() => {
      const start = performance.now();
      highlightCode(code, language).then((result) => {
        const elapsed = performance.now() - start;
        if (elapsed > 30) {
          console.warn(`高亮耗时 ${elapsed.toFixed(1)}ms (超过30ms阈值)`);
        }
        setTokens(result.tokens);
        setLineCount(result.lineCount);
      });
    }, 16);
  }, [code, language]);

  useEffect(() => {
    triggerHighlight();
  }, [triggerHighlight]);

  const renderHighlightedCode = useCallback(() => {
    if (!tokens || tokens.length === 0) {
      return <span style={{ color: '#D4D4D4' }}>{code}</span>;
    }

    const elements: React.ReactNode[] = [];
    let globalPos = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.start > globalPos) {
        elements.push(
          <span key={`text-${i}`} style={{ color: '#D4D4D4' }}>
            {code.slice(globalPos, token.start)}
          </span>,
        );
      }
      elements.push(
        <span key={`token-${i}`} style={{ color: token.color }}>
          {code.slice(token.start, token.end)}
        </span>,
      );
      globalPos = token.end;
    }

    if (globalPos < code.length) {
      elements.push(
        <span key="text-end" style={{ color: '#D4D4D4' }}>
          {code.slice(globalPos)}
        </span>,
      );
    }

    if (!code.endsWith('\n')) {
      elements.push(<span key="trailing-nl">{'\n'}</span>);
    }

    return elements;
  }, [code, tokens]);

  const handleScroll = useCallback(() => {
    const ta = textareaRef.current;
    const pre = preRef.current;
    const gutter = gutterRef.current;
    if (!ta || !pre || !gutter) return;

    pre.scrollTop = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
    gutter.scrollTop = ta.scrollTop;
  }, []);

  useEffect(() => {
    updateCurrentLine();
  }, [code, updateCurrentLine]);

  useEffect(() => {
    const gutter = gutterRef.current;
    if (!gutter) return;

    const rowEls = gutter.querySelectorAll('.gutter-row');
    rowEls.forEach((el) => {
      el.remove();
    });

    for (let i = 0; i < lines.length; i++) {
      const row = document.createElement('div');
      row.className = 'gutter-row';
      row.dataset.line = String(i + 1);
      row.style.cssText = `
        display: flex;
        align-items: center;
        height: ${LINE_HEIGHT}px;
        padding: 0 8px;
        position: relative;
        cursor: pointer;
        background: ${i === currentLine ? 'rgba(0,122,204,0.08)' : 'transparent'};
      `;

      const dotWrap = document.createElement('div');
      dotWrap.style.cssText = 'width:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';

      const hasAnnotation =
        currentDraftId &&
        annotations.some(
          (a) => a.draftId === currentDraftId && a.lineNumber === i + 1,
        );

      if (hoveredLine === i) {
        const plus = document.createElement('div');
        plus.style.cssText = `
          width:14px;height:14px;border-radius:50%;
          background:#FFFFFF;border:1px solid #007ACC;
          display:flex;align-items:center;justify-content:center;
          color:#007ACC;font-size:10px;font-weight:bold;line-height:1;
        `;
        plus.textContent = '+';
        dotWrap.appendChild(plus);
      } else if (hasAnnotation) {
        const dot = document.createElement('div');
        dot.style.cssText = `
          width:6px;height:6px;border-radius:50%;background:#007ACC;
        `;
        dotWrap.appendChild(dot);
      }
      row.appendChild(dotWrap);

      const num = document.createElement('span');
      num.style.cssText = `
        flex:1;text-align:right;
        color:${i === currentLine ? '#FFFFFF' : '#6A6A6A'};
        font-family:"Fira Code",monospace;
        font-size:${FONT_SIZE - 2}px;
        user-select:none;
      `;
      num.textContent = String(i + 1);
      row.appendChild(num);

      row.addEventListener('mouseenter', () => setHoveredLine(i));
      row.addEventListener('mouseleave', () => setHoveredLine(null));
      row.addEventListener('click', (e: MouseEvent) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setActiveAnnotation({
            lineNumber: i + 1,
            x: GUTTER_WIDTH + 16,
            y: rect.top - containerRect.top + 10,
          });
        }
      });
      row.addEventListener('mousemove', (e: MouseEvent) => {
        if (currentDraftId) {
          const lineAnns = annotations.filter(
            (a) => a.draftId === currentDraftId && a.lineNumber === i + 1,
          );
          if (lineAnns.length > 0) {
            const content = lineAnns
              .map((a) => a.content)
              .join('\n')
              .slice(0, 60);
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
              setPreviewAnnotation({
                lineNumber: i + 1,
                x: e.clientX - containerRect.left + 16,
                y: e.clientY - containerRect.top - 30,
                content: content + (content.length >= 60 ? '...' : ''),
              });
            }
          } else {
            setPreviewAnnotation(null);
          }
        }
      });

      gutter.appendChild(row);
    }
  }, [lines, currentLine, hoveredLine, currentDraftId, annotations]);

  const handleSaveAnnotation = (lineNumber: number, content: string) => {
    addAnnotation(lineNumber, content);
    setActiveAnnotation(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        background: '#1E1E2E',
        borderRadius: 6,
        margin: 12,
        marginLeft: 0,
        marginRight: 0,
      }}
    >
      <div
        ref={gutterRef}
        style={{
          width: GUTTER_WIDTH,
          flexShrink: 0,
          overflow: 'hidden',
          background: '#1E1E2E',
          borderRight: '1px solid #2D2D3F',
          paddingTop: 6,
          paddingBottom: 6,
        }}
        onMouseLeave={() => {
          setPreviewAnnotation(null);
        }}
      />

      <div
        style={{
          position: 'relative',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 6 + currentLine * LINE_HEIGHT,
            left: 0,
            right: 0,
            height: LINE_HEIGHT,
            background: '#2D2D3F',
            pointerEvents: 'none',
            zIndex: 0,
            transition: 'top 0.05s linear',
          }}
        />

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
            padding: '6px 12px',
            overflow: 'hidden',
            pointerEvents: 'none',
            whiteSpace: 'pre',
            lineHeight: `${LINE_HEIGHT}px`,
            fontSize: `${FONT_SIZE}px`,
            fontFamily: '"Fira Code", "Source Code Pro", Consolas, monospace',
            zIndex: 1,
          }}
        >
          <code style={{ display: 'block' }}>{renderHighlightedCode()}</code>
        </pre>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={handleScroll}
          onKeyUp={updateCurrentLine}
          onClick={updateCurrentLine}
          onSelect={updateCurrentLine}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            padding: '6px 12px',
            lineHeight: `${LINE_HEIGHT}px`,
            fontSize: `${FONT_SIZE}px`,
            fontFamily: '"Fira Code", "Source Code Pro", Consolas, monospace',
            color: 'rgba(0,0,0,0)',
            caretColor: '#FFFFFF',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            tabSize: 2,
            overflow: 'auto',
            zIndex: 2,
            whiteSpace: 'pre',
            wordWrap: 'normal',
            wordBreak: 'normal',
          }}
        />

        {previewAnnotation && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(previewAnnotation.x, (containerRef.current?.clientWidth || 600) - 340),
              top: previewAnnotation.y,
              background: '#252526',
              color: '#C0C0C0',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              maxWidth: 320,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 10,
              pointerEvents: 'none',
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          >
            {previewAnnotation.content}
          </div>
        )}

        {activeAnnotation && (
          <AnnotationBubble
            lineNumber={activeAnnotation.lineNumber}
            x={Math.min(activeAnnotation.x, (containerRef.current?.clientWidth || 600) - 380)}
            y={activeAnnotation.y}
            onSave={handleSaveAnnotation}
            onCancel={() => setActiveAnnotation(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
