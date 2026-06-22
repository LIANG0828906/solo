import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { useStyleStore } from '../../store/useStyleStore';
import { parseCode, findKeywordAtPosition } from './KeywordParser';
import type { ParsedKeyword, KeywordStyle } from '../../types';

interface FloatingToolbarProps {
  position: { x: number; y: number };
  selectedStyle: KeywordStyle | undefined;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onColorClick: (e: React.MouseEvent) => void;
  currentColor: string;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  position,
  selectedStyle,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onColorClick,
  currentColor,
}) => {
  return (
    <div
      className="floating-toolbar fixed z-50 flex items-center gap-1 bg-panel-bg rounded-lg shadow-lg p-2"
      style={{
        left: position.x,
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onColorClick}
        className="w-8 h-8 rounded border border-border-primary flex items-center justify-center hover:border-accent transition-colors"
        style={{ backgroundColor: currentColor }}
        title="选择颜色"
      />
      <div className="w-px h-6 bg-border-primary mx-1" />
      <button
        onClick={onToggleBold}
        className={`toolbar-button w-8 h-8 rounded flex items-center justify-center text-text-primary font-bold text-sm ${
          selectedStyle?.bold ? 'active' : ''
        }`}
        title="加粗 (Ctrl+B)"
      >
        B
      </button>
      <button
        onClick={onToggleItalic}
        className={`toolbar-button w-8 h-8 rounded flex items-center justify-center text-text-primary italic text-sm ${
          selectedStyle?.italic ? 'active' : ''
        }`}
        title="斜体 (Ctrl+I)"
      >
        I
      </button>
      <button
        onClick={onToggleUnderline}
        className={`toolbar-button w-8 h-8 rounded flex items-center justify-center text-text-primary underline text-sm ${
          selectedStyle?.underline ? 'active' : ''
        }`}
        title="下划线 (Ctrl+U)"
      >
        U
      </button>
    </div>
  );
};

interface CodeEditorProps {
  forwardRef?: React.RefObject<HTMLDivElement | null>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ forwardRef }) => {
  const {
    code,
    styles,
    selectedRange,
    currentColor,
    setCode,
    setSelectedRange,
    updateCurrentSelectionStyle,
    getSelectedStyle,
    setCurrentColor,
  } = useStyleStore();

  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [showMiniPicker, setShowMiniPicker] = useState(false);
  const [miniPickerPos, setMiniPickerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const parsedTokens = useMemo(() => parseCode(code), [code]);

  const lines = useMemo(() => code.split('\n'), [code]);

  const sortedStyles = useMemo(() => {
    return [...styles].sort((a, b) => a.start - b.start);
  }, [styles]);

  const findStyleAtOffset = useCallback(
    (offset: number): KeywordStyle | undefined => {
      return sortedStyles.find((s) => offset >= s.start && offset < s.end);
    },
    [sortedStyles]
  );

  const getDefaultColorForType = (type: ParsedKeyword['type']): string => {
    switch (type) {
      case 'keyword':
        return '#3B82F6';
      case 'function':
        return '#F59E0B';
      case 'string':
        return '#10B981';
      case 'number':
        return '#8B5CF6';
      case 'comment':
        return '#64748B';
      case 'variable':
        return '#EC4899';
      default:
        return '#F8FAFC';
    }
  };

  const getEffectiveStyle = useCallback(
    (token: ParsedKeyword, offset: number): { color: string; bold: boolean; italic: boolean; underline: boolean } => {
      const customStyle = findStyleAtOffset(offset);
      if (customStyle) {
        return {
          color: customStyle.color,
          bold: customStyle.bold,
          italic: customStyle.italic,
          underline: customStyle.underline,
        };
      }
      return {
        color: getDefaultColorForType(token.type),
        bold: token.type === 'keyword',
        italic: token.type === 'comment',
        underline: false,
      };
    },
    [findStyleAtOffset]
  );

  const handleMouseUp = useCallback(() => {
    if (!textareaRef.current) return;

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;

      if (start !== end) {
        const selectedText = code.slice(start, end);
        if (selectedText.trim()) {
          let effectiveStart = start;
          let effectiveEnd = end;

          const tokenAtStart = findKeywordAtPosition(parsedTokens, start);
          const tokenAtEnd = findKeywordAtPosition(parsedTokens, end - 1);

          if (
            tokenAtStart &&
            tokenAtEnd &&
            tokenAtStart.start === tokenAtEnd.start &&
            tokenAtStart.end === tokenAtEnd.end
          ) {
            effectiveStart = tokenAtStart.start;
            effectiveEnd = tokenAtEnd.end;
          }

          setSelectedRange({ start: effectiveStart, end: effectiveEnd });

          try {
            const rect = (textareaRef.current as HTMLTextAreaElement).getBoundingClientRect();
            const computedStyle = window.getComputedStyle(textareaRef.current);
            const paddingLeft = parseFloat(computedStyle.paddingLeft || '0');
            const paddingTop = parseFloat(computedStyle.paddingTop || '0');
            const fontSize = parseFloat(computedStyle.fontSize || '16');
            const lineHeight = fontSize * 1.6;
            const charWidth = fontSize * 0.6;

            const textBefore = code.slice(0, effectiveStart);
            const linesBefore = textBefore.split('\n');
            const lineIndex = linesBefore.length - 1;
            const colIndex = linesBefore[lineIndex].length;

            let x = rect.left + paddingLeft + colIndex * charWidth;
            let y = rect.top + paddingTop + lineIndex * lineHeight - 48;

            x = Math.max(12, Math.min(x, window.innerWidth - 220));
            y = Math.max(68, y);

            setToolbarPos({ x, y });
          } catch {
            setToolbarPos(null);
          }
          setIsDragging(false);
          return;
        }
      }
      setSelectedRange(null);
      setToolbarPos(null);
      setIsDragging(false);
    });
  }, [code, parsedTokens, setSelectedRange]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setSelectedRange(null);
    setToolbarPos(null);
  };

  const selectedStyle = useMemo(() => getSelectedStyle(), [getSelectedStyle, selectedRange]);

  const handleToggleBold = () => {
    updateCurrentSelectionStyle({ bold: !(selectedStyle?.bold ?? false) });
  };

  const handleToggleItalic = () => {
    updateCurrentSelectionStyle({ italic: !(selectedStyle?.italic ?? false) });
  };

  const handleToggleUnderline = () => {
    updateCurrentSelectionStyle({ underline: !(selectedStyle?.underline ?? false) });
  };

  const handleColorClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMiniPickerPos({
      x: Math.max(12, Math.min(rect.left, window.innerWidth - 200)),
      y: Math.max(68, rect.bottom + 8),
    });
    setShowMiniPicker(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedRange) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleBold();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleToggleItalic();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleToggleUnderline();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRange, selectedStyle]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (!isDragging) {
        setShowMiniPicker(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [isDragging]);

  const miniPaletteColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E',
  ];

  const renderHighlightedCode = () => {
    const segments: React.ReactNode[] = [];
    let pos = 0;

    for (const token of parsedTokens) {
      if (token.start > pos) {
        segments.push(
          <span key={`gap-${pos}`} style={{ color: '#F8FAFC' }}>
            {code.slice(pos, token.start)}
          </span>
        );
      }

      const style = getEffectiveStyle(token, token.start);
      const cssStyle: React.CSSProperties = {
        color: style.color,
        fontWeight: style.bold ? 600 : 400,
        fontStyle: style.italic ? 'italic' : 'normal',
        textDecoration: style.underline ? 'underline' : 'none',
      };

      const isInSelection =
        selectedRange &&
        token.end > selectedRange.start &&
        token.start < selectedRange.end;

      if (isInSelection) {
        const segStart = Math.max(token.start, selectedRange!.start);
        const segEnd = Math.min(token.end, selectedRange!.end);

        if (segStart > token.start) {
          segments.push(
            <span key={`pre-${token.start}`} style={cssStyle}>
              {code.slice(token.start, segStart)}
            </span>
          );
        }

        segments.push(
          <span
            key={`sel-${segStart}`}
            style={{
              ...cssStyle,
              backgroundColor: 'rgba(254, 240, 138, 0.3)',
              borderRadius: '2px',
            }}
          >
            {code.slice(segStart, segEnd)}
          </span>
        );

        if (segEnd < token.end) {
          segments.push(
            <span key={`post-${token.end}`} style={cssStyle}>
              {code.slice(segEnd, token.end)}
            </span>
          );
        }
      } else {
        segments.push(
          <span key={`tok-${token.start}`} style={cssStyle}>
            {token.text}
          </span>
        );
      }

      pos = token.end;
    }

    if (pos < code.length) {
      segments.push(
        <span key={`tail-${pos}`} style={{ color: '#F8FAFC' }}>
          {code.slice(pos)}
        </span>
      );
    }

    return segments;
  };

  const combinedRef = (el: HTMLDivElement | null) => {
    (editorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (forwardRef) {
      (forwardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    }
  };

  return (
    <div className="h-full flex flex-col bg-app-bg overflow-hidden">
      <div
        ref={combinedRef}
        className="code-editor-container flex flex-1 overflow-hidden rounded-none"
        data-export-target="true"
      >
        <div
          className="flex-shrink-0 overflow-hidden select-none border-r border-border-primary"
          style={{
            width: '40px',
            backgroundColor: '#1E293B',
          }}
        >
          <div
            className="code-font py-4 text-right pr-3"
            style={{ color: '#64748B' }}
          >
            {lines.map((_, idx) => (
              <div key={idx} style={{ minHeight: '25.6px' }}>
                {idx + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 relative overflow-auto">
          <div
            className="code-font absolute inset-0 py-4 px-4 pointer-events-none overflow-hidden whitespace-pre"
            aria-hidden="true"
            style={{ wordBreak: 'keep-all' }}
          >
            {renderHighlightedCode()}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleInput}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            spellCheck={false}
            className="code-font absolute inset-0 py-4 px-4 w-full h-full resize-none outline-none bg-transparent whitespace-pre overflow-auto"
            style={{
              color: 'transparent',
              caretColor: '#F8FAFC',
              wordBreak: 'keep-all',
            }}
          />
        </div>
      </div>

      {toolbarPos && selectedRange && (
        <FloatingToolbar
          position={toolbarPos}
          selectedStyle={selectedStyle}
          onToggleBold={handleToggleBold}
          onToggleItalic={handleToggleItalic}
          onToggleUnderline={handleToggleUnderline}
          onColorClick={handleColorClick}
          currentColor={selectedStyle?.color ?? currentColor}
        />
      )}

      {showMiniPicker && (
        <div
          className="fixed z-50 bg-panel-bg rounded-lg shadow-lg p-3 grid grid-cols-6 gap-2 floating-toolbar"
          style={{ left: miniPickerPos.x, top: miniPickerPos.y }}
        >
          {miniPaletteColors.map((color) => (
            <button
              key={color}
              className="w-7 h-7 rounded color-swatch"
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentColor(color);
                updateCurrentSelectionStyle({ color });
                setShowMiniPicker(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(CodeEditor);
