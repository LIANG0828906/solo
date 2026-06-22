import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useReviewStore, Annotation } from '../../store/reviewStore';

interface AnnotationOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
  scaleFactor: number;
  isCompared: boolean;
}

interface ActiveForm {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  canvasWidth,
  canvasHeight,
  scaleFactor,
  isCompared,
}) => {
  const { annotations, addAnnotation, isComparing } = useReviewStore();
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);
  const [text, setText] = useState('');
  const [hoveredAnn, setHoveredAnn] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeForm]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isCompared || isComparing) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const canvasX = x / scaleFactor;
    const canvasY = y / scaleFactor;

    setActiveForm({ x, y, canvasX, canvasY });
    setText('');
  }, [isCompared, isComparing, scaleFactor]);

  const handleSubmit = useCallback(() => {
    if (!activeForm || !text.trim()) {
      setActiveForm(null);
      return;
    }
    addAnnotation(activeForm.canvasX, activeForm.canvasY, text.trim());
    setActiveForm(null);
    setText('');
  }, [activeForm, text, addAnnotation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setActiveForm(null);
      setText('');
    }
  }, [handleSubmit]);

  const sortedAnnotations = [...annotations].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={containerRef}
      className={`annotation-overlay ${isCompared && !isComparing ? 'interactive' : ''}`}
      style={{
        width: canvasWidth * scaleFactor,
        height: canvasHeight * scaleFactor,
      }}
      onClick={handleClick}
    >
      {sortedAnnotations.map((ann: Annotation) => {
        const displayX = ann.x * scaleFactor;
        const displayY = ann.y * scaleFactor;
        const isHovered = hoveredAnn === ann.id;

        return (
          <div key={ann.id}>
            <div
              className="annotation-marker"
              style={{
                transform: `translate(${displayX - 8}px, ${displayY - 8}px)`,
              }}
              onMouseEnter={() => setHoveredAnn(ann.id)}
              onMouseLeave={() => setHoveredAnn(null)}
              onClick={(e) => {
                e.stopPropagation();
                setActiveForm(null);
              }}
            >
              {ann.order}
            </div>
            {isHovered && (
              <div
                className="annotation-tooltip"
                style={{
                  transform: `translate(${displayX + 12}px, ${displayY - 8}px)`,
                }}
              >
                <div className="tooltip-order">#{ann.order}</div>
                <div className="tooltip-text">{ann.text}</div>
                <div className="tooltip-time">
                  {new Date(ann.createdAt).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {activeForm && (
        <div
          className="annotation-bubble"
          style={{
            transform: `translate(${activeForm.x + 12}px, ${activeForm.y - 8}px)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            className="annotation-input"
            placeholder="描述差异细节..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="annotation-buttons">
            <button
              className="btn btn-small btn-cancel"
              onClick={() => {
                setActiveForm(null);
                setText('');
              }}
            >
              取消
            </button>
            <button
              className="btn btn-small btn-primary"
              onClick={handleSubmit}
              disabled={!text.trim()}
            >
              提交
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
