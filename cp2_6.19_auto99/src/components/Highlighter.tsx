import React, { useState, useRef, useEffect } from 'react';
import type { Highlight } from '../utils/types';

interface HighlighterProps {
  text: string;
  paragraphIndex: number;
  highlights: Highlight[];
  selectedHighlightId: string | null;
  onAddHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt' | 'userId' | 'color'>) => void;
  onSelectHighlight: (highlightId: string | null) => void;
  onUpdateAnnotation: (highlightId: string, annotation: string) => void;
  isBlinking?: boolean;
}

interface PopupPosition {
  top: number;
  left: number;
}

export const Highlighter: React.FC<HighlighterProps> = ({
  text,
  paragraphIndex,
  highlights,
  selectedHighlightId,
  onAddHighlight,
  onSelectHighlight,
  onUpdateAnnotation,
  isBlinking,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState<PopupPosition | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);

  const paragraphHighlights = highlights
    .filter((h) => h.paragraphIndex === paragraphIndex)
    .sort((a, b) => a.startOffset - b.startOffset);

  useEffect(() => {
    if (selectedHighlightId) {
      const hl = paragraphHighlights.find((h) => h.id === selectedHighlightId);
      if (hl) {
        setEditingHighlightId(hl.id);
        setAnnotationText(hl.annotation || '');
      }
    } else {
      setEditingHighlightId(null);
      setPopupPos(null);
    }
  }, [selectedHighlightId, paragraphHighlights]);

  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const preRange = document.createRange();
    preRange.selectNodeContents(containerRef.current!);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + selectedText.length;

    onAddHighlight({
      roomId: '',
      paragraphIndex,
      startOffset,
      endOffset,
      text: selectedText,
    });

    selection.removeAllRanges();
  };

  const handleHighlightClick = (e: React.MouseEvent, highlight: Highlight) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setPopupPos({
      top: rect.top - containerRect.top - 8,
      left: rect.left - containerRect.left + rect.width / 2,
    });
    setEditingHighlightId(highlight.id);
    setAnnotationText(highlight.annotation || '');
    onSelectHighlight(highlight.id);
  };

  const handleSaveAnnotation = () => {
    if (editingHighlightId) {
      onUpdateAnnotation(editingHighlightId, annotationText);
    }
    setEditingHighlightId(null);
    setPopupPos(null);
    onSelectHighlight(null);
  };

  const renderTextWithHighlights = () => {
    if (paragraphHighlights.length === 0) {
      return <span>{text}</span>;
    }

    const nodes: React.ReactNode[] = [];
    let currentIndex = 0;

    paragraphHighlights.forEach((highlight, i) => {
      if (highlight.startOffset > currentIndex) {
        nodes.push(
          <span key={`text-${i}-before`}>
            {text.slice(currentIndex, highlight.startOffset)}
          </span>
        );
      }

      const opacity = 0.3 + ((i % 5) * 0.15);
      const isSelected = highlight.id === selectedHighlightId;
      nodes.push(
        <span
          key={`highlight-${highlight.id}`}
          onClick={(e) => handleHighlightClick(e, highlight)}
          className={`highlight-span ${isSelected ? 'highlight-selected' : ''}`}
          style={{
            backgroundColor: `rgba(230, 195, 132, ${opacity})`,
          }}
        >
          {text.slice(highlight.startOffset, highlight.endOffset)}
        </span>
      );
      currentIndex = highlight.endOffset;
    });

    if (currentIndex < text.length) {
      nodes.push(
        <span key="text-after">{text.slice(currentIndex)}</span>
      );
    }

    return nodes;
  };

  return (
    <div
      ref={containerRef}
      className={`paragraph-container ${isBlinking ? 'paragraph-blink' : ''}`}
      onMouseUp={handleMouseUp}
    >
      {renderTextWithHighlights()}
      {popupPos && editingHighlightId && (
        <div
          className="annotation-popup"
          style={{ top: popupPos.top, left: popupPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="annotation-popup-arrow" />
          <textarea
            className="annotation-textarea"
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            placeholder="添加批注..."
            autoFocus
          />
          <div className="annotation-actions">
            <button className="btn btn-small" onClick={handleSaveAnnotation}>
              保存
            </button>
            <button
              className="btn btn-small btn-secondary"
              onClick={() => {
                setEditingHighlightId(null);
                setPopupPos(null);
                onSelectHighlight(null);
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
