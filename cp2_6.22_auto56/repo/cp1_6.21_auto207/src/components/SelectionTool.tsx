import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useSelection } from '../contexts/SelectionContext';
import { detectContentType, htmlToPlainText, sanitizeHtml } from '../utils/html';
import type { SelectionData } from '../types';

interface Rect {
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const SelectionTool: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setSelection } = useSelection();
  const [isSelecting, setIsSelecting] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const updateRect = useCallback((clientX: number, clientY: number) => {
    if (!startPointRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const { left: cLeft, top: cTop } = container.getBoundingClientRect();

    const start = startPointRef.current;
    const x = Math.max(0, Math.min(start.x, clientX - cLeft));
    const y = Math.max(0, Math.min(start.y, clientY - cTop));
    const width = Math.abs(clientX - cLeft - start.x);
    const height = Math.abs(clientY - cTop - start.y);

    setRect({
      startX: start.x,
      startY: start.y,
      x,
      y,
      width,
      height,
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.prevent-selection')) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, a, select')) return;

    isDraggingRef.current = true;
    const container = containerRef.current;
    if (!container) return;
    const { left, top } = container.getBoundingClientRect();

    startPointRef.current = {
      x: e.clientX - left,
      y: e.clientY - top,
    };

    setRect({
      startX: startPointRef.current.x,
      startY: startPointRef.current.y,
      x: startPointRef.current.x,
      y: startPointRef.current.y,
      width: 0,
      height: 0,
    });
    setIsSelecting(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      updateRect(e.clientX, e.clientY);
      rafIdRef.current = null;
    });
  }, [updateRect]);

  const extractContentFromRect = useCallback((r: Rect): SelectionData | null => {
    const container = containerRef.current;
    if (!container) return null;
    const { left: cLeft, top: cTop } = container.getBoundingClientRect();

    const absX = cLeft + r.x;
    const absY = cTop + r.y;
    const absW = r.width;
    const absH = r.height;

    if (absW < 5 || absH < 5) return null;

    const range = document.createRange();
    const centerX = absX + absW / 2;
    const centerY = absY + absH / 2;
    const centerEl = document.elementFromPoint(centerX, centerY);

    if (!centerEl) return null;

    let targetEl: Element | null = centerEl;
    while (targetEl && targetEl !== document.body) {
      const rect = targetEl.getBoundingClientRect();
      if (
        rect.left >= absX - 20 &&
        rect.top >= absY - 20 &&
        rect.right <= absX + absW + 20 &&
        rect.bottom <= absY + absH + 20
      ) {
        break;
      }
      targetEl = targetEl.parentElement;
    }

    if (!targetEl || targetEl === document.body) {
      targetEl = centerEl.closest('p, div, section, article, li, td, th, table, ul, ol, blockquote, pre, figure, h1, h2, h3, h4, h5, h6') || centerEl;
    }

    const elRect = targetEl.getBoundingClientRect();
    const html = sanitizeHtml(targetEl.innerHTML || targetEl.outerHTML || '');
    const plainText = htmlToPlainText(html);
    const contentType = detectContentType(html);

    return {
      x: elRect.left,
      y: elRect.top,
      width: elRect.width,
      height: elRect.height,
      contentType,
      html,
      plainText,
    };
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (rect && rect.width > 8 && rect.height > 8) {
      const data = extractContentFromRect(rect);
      if (data && (data.html.length > 0 || data.plainText.length > 0)) {
        setSelection(data);
      }
    }

    setTimeout(() => {
      setIsSelecting(false);
      setRect(null);
    }, 50);

    startPointRef.current = null;
  }, [rect, extractContentFromRect, setSelection]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        userSelect: isSelecting ? 'none' : 'auto',
      }}
    >
      {children}
      {isSelecting && rect && (
        <div
          style={{
            position: 'fixed',
            left: rect.x + (containerRef.current?.getBoundingClientRect().left || 0),
            top: rect.y + (containerRef.current?.getBoundingClientRect().top || 0),
            width: rect.width,
            height: rect.height,
            border: '2px dashed #3B82F6',
            backgroundColor: '#3B82F640',
            pointerEvents: 'none',
            zIndex: 10,
            transition: 'background-color 0.1s ease',
          }}
        />
      )}
    </div>
  );
};

export default SelectionTool;
