import { useRef, useState, useEffect, useCallback } from 'react';
import { FontConfig, MeasureData, getCharBounds, CharBounds } from '../utils/fontMeasure';
import './PreviewPanel.css';

interface PreviewPanelProps {
  config: FontConfig;
  text: string;
  onTextChange?: (text: string) => void;
  onMeasure?: (data: MeasureData | null) => void;
  label?: string;
  panelRef?: React.RefObject<HTMLDivElement>;
}

export default function PreviewPanel({
  config,
  text,
  onTextChange,
  onMeasure,
  label,
  panelRef,
}: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [measureResult, setMeasureResult] = useState<MeasureData | null>(null);
  const [showLabel, setShowLabel] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.target === container || (e.target as HTMLElement).classList.contains('preview-text')) {
      setIsDragging(true);
      setSelection({ startX: x, startY: y, endX: x, endY: y });
      setShowLabel(false);
      setMeasureResult(null);
      if (onMeasure) onMeasure(null);
    }
  }, [onMeasure]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selection) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    setSelection((prev) => (prev ? { ...prev, endX: x, endY: y } : null));
  }, [isDragging, selection]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !selection) {
      setIsDragging(false);
      return;
    }

    const left = Math.min(selection.startX, selection.endX);
    const right = Math.max(selection.startX, selection.endX);
    const top = Math.min(selection.startY, selection.endY);
    const bottom = Math.max(selection.startY, selection.endY);
    const width = right - left;
    const height = bottom - top;

    if (width < 3 || height < 3) {
      setIsDragging(false);
      setSelection(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const textElement = container.querySelector('.preview-text');
    if (!textElement) {
      setIsDragging(false);
      return;
    }

    const textRect = textElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const textOffsetLeft = textRect.left - containerRect.left;
    const textOffsetTop = textRect.top - containerRect.top;

    const relativeLeft = left - textOffsetLeft;
    const relativeWidth = width;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${config.fontSize}px ${config.fontFamily}`;
      ctx.textBaseline = 'top';

      let accumulatedWidth = 0;
      let firstChar = '';
      let charIndex = -1;

      for (let i = 0; i < text.length; i++) {
        const charWidth = ctx.measureText(text[i]).width;
        if (accumulatedWidth + charWidth >= relativeLeft) {
          if (accumulatedWidth <= relativeLeft + relativeWidth) {
            firstChar = text[i];
            charIndex = i;
          }
          break;
        }
        accumulatedWidth += charWidth;
      }

      let charBounds: CharBounds | null = null;
      if (firstChar) {
        const bounds = getCharBounds(firstChar, config);
        if (bounds) {
          charBounds = {
            top: textOffsetTop + bounds.top,
            left: textOffsetLeft + accumulatedWidth + bounds.left,
            right: textOffsetLeft + accumulatedWidth + bounds.right,
            bottom: textOffsetTop + bounds.bottom,
          };
        }
      }

      const result: MeasureData = {
        width: parseFloat(width.toFixed(1)),
        height: parseFloat(height.toFixed(1)),
        charBounds,
      };

      setMeasureResult(result);
      setShowLabel(true);
      if (onMeasure) onMeasure(result);
    }

    setIsDragging(false);
  }, [isDragging, selection, config, text, onMeasure]);

  const closeLabel = useCallback(() => {
    setShowLabel(false);
    setSelection(null);
    setMeasureResult(null);
    if (onMeasure) onMeasure(null);
  }, [onMeasure]);

  useEffect(() => {
    const handleClickOutside = () => {
      // Handle outside clicks if needed
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selLeft = selection
    ? Math.min(selection.startX, selection.endX)
    : 0;
  const selTop = selection
    ? Math.min(selection.startY, selection.endY)
    : 0;
  const selWidth = selection
    ? Math.abs(selection.endX - selection.startX)
    : 0;
  const selHeight = selection
    ? Math.abs(selection.endY - selection.startY)
    : 0;

  return (
    <div className="preview-panel" ref={panelRef || containerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {label && <div className="preview-label">{label}</div>}
      <div
        className="preview-text"
        contentEditable={onTextChange ? true : false}
        suppressContentEditableWarning
        onInput={(e) => {
          if (onTextChange) {
            onTextChange(e.currentTarget.textContent || '');
          }
        }}
        style={{
          fontFamily: config.fontFamily,
          fontSize: `${config.fontSize}px`,
          lineHeight: config.lineHeight,
          transition: 'font-size 0.2s ease-out, line-height 0.2s ease-out, font-family 0.2s ease-out',
        }}
      >
        {text}
      </div>
      {selection && (
        <div
          className="selection-rect"
          style={{
            left: selLeft,
            top: selTop,
            width: selWidth,
            height: selHeight,
          }}
        />
      )}
      {showLabel && measureResult && selection && (
        <div
          className="measure-label"
          style={{
            left: Math.min(selection.startX, selection.endX) + selWidth + 8,
            top: Math.min(selection.startY, selection.endY) + selHeight + 8,
          }}
          onClick={closeLabel}
        >
          <div className="measure-size">
            宽: {measureResult.width.toFixed(1)}px × 高: {measureResult.height.toFixed(1)}px
          </div>
          {measureResult.charBounds && (
            <div className="measure-bounds">
              <div>top: {measureResult.charBounds.top.toFixed(1)}</div>
              <div>right: {measureResult.charBounds.right.toFixed(1)}</div>
              <div>bottom: {measureResult.charBounds.bottom.toFixed(1)}</div>
              <div>left: {measureResult.charBounds.left.toFixed(1)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
