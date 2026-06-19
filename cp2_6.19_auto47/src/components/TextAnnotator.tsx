import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Annotation } from '../types';

interface TextAnnotatorProps {
  content: string;
  annotations: Annotation[];
  onAddAnnotation: (startIndex: number, endIndex: number, text: string, content: string) => void;
  onDeleteAnnotation?: (id: string) => void;
  onJumpToAnnotation?: (id: string) => void;
  highlightId?: string | null;
}

export const TextAnnotator: React.FC<TextAnnotatorProps> = ({
  content,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  highlightId,
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [selectionInfo, setSelectionInfo] = useState<{
    startIndex: number;
    endIndex: number;
    text: string;
    top: number;
    left: number;
  } | null>(null);
  const [annotationInput, setAnnotationInput] = useState('');
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedAnnotations = [...annotations].sort((a, b) => a.startIndex - b.startIndex);

  const getCharOffset = useCallback((node: Node, offset: number): number => {
    const range = document.createRange();
    range.selectNodeContents(textRef.current!);
    range.setEnd(node, offset);
    return range.toString().length;
  }, []);

  const handleTextMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      setSelectionInfo(null);
      return;
    }

    if (!textRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    const startIndex = getCharOffset(range.startContainer, range.startOffset);
    const endIndex = getCharOffset(range.endContainer, range.endOffset);
    const selectedText = range.toString();

    if (selectedText.trim().length === 0) {
      setSelectionInfo(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = textRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setSelectionInfo({
        startIndex,
        endIndex,
        text: selectedText,
        top: rect.top - containerRect.top - 40,
        left: rect.left - containerRect.left + rect.width / 2,
      });
    }
  }, [getCharOffset]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.annotation-toolbar') && !target.closest('.text-content')) {
        setSelectionInfo(null);
        window.getSelection()?.removeAllRanges();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectionInfo && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [selectionInfo]);

  const handleSaveAnnotation = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectionInfo || !annotationInput.trim()) return;

    onAddAnnotation(
      selectionInfo.startIndex,
      selectionInfo.endIndex,
      selectionInfo.text,
      annotationInput.trim()
    );

    setAnnotationInput('');
    setSelectionInfo(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveAnnotation();
    } else if (e.key === 'Escape') {
      setSelectionInfo(null);
      setAnnotationInput('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const renderAnnotatedText = () => {
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedAnnotations.forEach((annotation, idx) => {
      if (annotation.startIndex > lastIndex) {
        result.push(
          <span key={`text-${idx}`}>
            {content.slice(lastIndex, annotation.startIndex)}
          </span>
        );
      }

      const isHovered = hoveredAnnotation === annotation.id;
      const isHighlighted = highlightId === annotation.id;

      result.push(
        <span
          key={`ann-${annotation.id}`}
          className={`annotated-text ${isHovered ? 'hovered' : ''} ${isHighlighted ? 'highlighted' : ''}`}
          onMouseEnter={() => setHoveredAnnotation(annotation.id)}
          onMouseLeave={() => setHoveredAnnotation(null)}
        >
          {content.slice(annotation.startIndex, annotation.endIndex)}
          <sup className="annotation-number">{idx + 1}</sup>
          {isHovered && (
            <div className="annotation-tooltip">
              <div className="tooltip-content">
                <span className="tooltip-number">#{idx + 1}</span>
                {annotation.content}
              </div>
              {onDeleteAnnotation && (
                <button
                  className="tooltip-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(annotation.id);
                  }}
                >
                  删除
                </button>
              )}
            </div>
          )}
        </span>
      );

      lastIndex = annotation.endIndex;
    });

    if (lastIndex < content.length) {
      result.push(
        <span key="text-end">{content.slice(lastIndex)}</span>
      );
    }

    return result;
  };

  return (
    <div className="text-annotator">
      <div
        ref={textRef}
        className="text-content"
        onMouseUp={handleTextMouseUp}
      >
        {renderAnnotatedText()}
      </div>

      {selectionInfo && (
        <div
          className="annotation-toolbar"
          style={{ top: selectionInfo.top, left: selectionInfo.left }}
        >
          <form onSubmit={handleSaveAnnotation}>
            <input
              ref={inputRef}
              type="text"
              value={annotationInput}
              onChange={(e) => setAnnotationInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入批注内容，Enter保存"
              className="toolbar-input"
              autoFocus
            />
            <button
              type="submit"
              className="toolbar-btn"
              disabled={!annotationInput.trim()}
            >
              添加
            </button>
          </form>
        </div>
      )}

      <style>{`
        .text-annotator {
          position: relative;
          height: 100%;
        }

        .text-content {
          background: #fff;
          padding: 24px 28px;
          line-height: 1.8;
          font-size: 16px;
          color: #333;
          overflow-y: auto;
          height: 100%;
          user-select: text;
          cursor: text;
        }

        .annotated-text {
          position: relative;
          background: linear-gradient(transparent 85%, #fff3b0 85%);
          cursor: pointer;
          border-bottom: 2px solid #e6c200;
          transition: background 0.2s;
        }

        .annotated-text.hovered,
        .annotated-text.highlighted {
          background: linear-gradient(transparent 80%, #ffd93d 80%);
        }

        .annotation-number {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          background: #ff8c42;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          line-height: 16px;
          text-align: center;
          margin-left: 2px;
          vertical-align: super;
          position: relative;
          top: -2px;
        }

        .annotation-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 10px 12px;
          min-width: 200px;
          max-width: 300px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 100;
          margin-bottom: 6px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .annotation-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #fff;
        }

        .tooltip-content {
          font-size: 13px;
          color: #333;
          line-height: 1.5;
        }

        .tooltip-number {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          background: #ff8c42;
          padding: 2px 6px;
          border-radius: 10px;
          margin-right: 6px;
          margin-bottom: 6px;
        }

        .tooltip-delete {
          margin-top: 8px;
          background: #fff0f0;
          color: #ff6b6b;
          border: none;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .tooltip-delete:hover {
          background: #ffe0e0;
        }

        .annotation-toolbar {
          position: absolute;
          transform: translateX(-50%);
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
          z-index: 100;
          animation: toolbarIn 0.15s ease;
        }

        @keyframes toolbarIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .annotation-toolbar form {
          display: flex;
          gap: 6px;
        }

        .toolbar-input {
          width: 220px;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
        }

        .toolbar-input:focus {
          border-color: #4a90d9;
        }

        .toolbar-btn {
          background: #4a90d9;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .toolbar-btn:disabled {
          background: #a0c4e8;
          cursor: not-allowed;
        }

        .toolbar-btn:hover:not(:disabled) {
          background: #3a7bc8;
        }
      `}</style>
    </div>
  );
};
