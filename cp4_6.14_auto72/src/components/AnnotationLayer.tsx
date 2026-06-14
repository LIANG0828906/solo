import React, { useEffect, useRef, useCallback, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useDocStore, Annotation } from '@/store/docStore';

interface ParagraphRect {
  paragraphIndex: number;
  top: number;
  left: number;
  width: number;
  lineHeight: number;
  charWidth: number;
}

/**
 * 标注模块
 * 数据流向：
 *   从 store 读取 annotations、selectedRange
 *   通过 requestAnimationFrame 驱动 Canvas 渲染（30FPS+）
 *   使用脏区域标记（dirty flag）避免每帧全量重绘
 *   监听 mouseup 获取文本选区 -> store.setSelectedRange()
 *   悬停批注图标显示 tooltip
 */
const AnnotationLayer: React.FC = () => {
  const {
    annotations,
    pageState,
    paragraphsPerPage,
    setSelectedRange,
    currentDoc,
  } = useDocStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const dirtyRef = useRef(true);
  const lastFrameTimeRef = useRef(0);
  const paragraphRectsRef = useRef<Map<number, ParagraphRect>>(new Map());
  const [hoverComment, setHoverComment] = useState<Annotation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const measureParagraphs = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rects = new Map<number, ParagraphRect>();
    const paragraphs = container.querySelectorAll<HTMLParagraphElement>(
      'p[data-paragraph-index]'
    );
    const containerRect = container.getBoundingClientRect();

    paragraphs.forEach((p) => {
      const idx = Number(p.dataset.paragraphIndex);
      if (Number.isNaN(idx)) return;
      const pRect = p.getBoundingClientRect();
      const style = window.getComputedStyle(p);
      const fontSize = parseFloat(style.fontSize);
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.8;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let charWidth = fontSize * 0.6;
      if (ctx) {
        ctx.font = style.font;
        charWidth = ctx.measureWidth('中').width;
      }
      rects.set(idx, {
        paragraphIndex: idx,
        top: pRect.top - containerRect.top,
        left: pRect.left - containerRect.left,
        width: pRect.width,
        lineHeight,
        charWidth,
      });
    });
    paragraphRectsRef.current = rects;
    dirtyRef.current = true;
  }, []);

  useEffect(() => {
    measureParagraphs();
    const ro = new ResizeObserver(() => {
      measureParagraphs();
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    window.addEventListener('scroll', measureParagraphs, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', measureParagraphs, true);
    };
  }, [measureParagraphs, pageState.page]);

  const drawCanvas = useCallback(
    (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current < 1000 / 30) {
        rafRef.current = requestAnimationFrame(drawCanvas);
        return;
      }
      lastFrameTimeRef.current = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(drawCanvas);
        return;
      }

      const container = containerRef.current;
      if (!container) {
        rafRef.current = requestAnimationFrame(drawCanvas);
        return;
      }

      if (!dirtyRef.current) {
        rafRef.current = requestAnimationFrame(drawCanvas);
        return;
      }
      dirtyRef.current = false;

      const dpr = window.devicePixelRatio || 1;
      const cRect = container.getBoundingClientRect();
      if (
        canvas.width !== cRect.width * dpr ||
        canvas.height !== cRect.height * dpr
      ) {
        canvas.width = cRect.width * dpr;
        canvas.height = cRect.height * dpr;
        canvas.style.width = cRect.width + 'px';
        canvas.style.height = cRect.height + 'px';
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(drawCanvas);
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cRect.width, cRect.height);

      const startIdx = (pageState.page - 1) * paragraphsPerPage;
      const endIdx = startIdx + paragraphsPerPage;
      const pageAnnotations = annotations.filter(
        (a) => a.paragraphIndex >= startIdx && a.paragraphIndex < endIdx
      );

      pageAnnotations.forEach((ann) => {
        const rect = paragraphRectsRef.current.get(ann.paragraphIndex);
        if (!rect) return;

        const offsetLength = ann.endOffset - ann.startOffset;
        const startX = rect.left + ann.startOffset * rect.charWidth;
        const highlightWidth = Math.min(
          offsetLength * rect.charWidth,
          rect.width + rect.left - startX
        );

        if (ann.type === 'highlight') {
          ctx.fillStyle = 'rgba(253, 224, 71, 0.5)';
          ctx.fillRect(startX, rect.top, highlightWidth, rect.lineHeight - 4);
        } else if (ann.type === 'comment') {
          ctx.fillStyle = 'rgba(253, 224, 71, 0.3)';
          ctx.fillRect(startX, rect.top, highlightWidth, rect.lineHeight - 4);
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          const bubbleX = Math.min(
            startX + highlightWidth + 8,
            rect.left + rect.width - 16
          );
          ctx.arc(bubbleX, rect.top + 8, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      rafRef.current = requestAnimationFrame(drawCanvas);
    },
    [annotations, pageState.page, paragraphsPerPage]
  );

  useEffect(() => {
    dirtyRef.current = true;
  }, [annotations, pageState.page]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawCanvas);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [drawCanvas]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) {
      setSelectedRange(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let paragraphEl: HTMLElement | null = range.startContainer.parentElement;
    while (paragraphEl && !paragraphEl.dataset.paragraphIndex) {
      paragraphEl = paragraphEl.parentElement;
    }
    if (!paragraphEl) {
      setSelectedRange(null);
      return;
    }
    const paragraphIndex = Number(paragraphEl.dataset.paragraphIndex);
    if (Number.isNaN(paragraphIndex)) {
      setSelectedRange(null);
      return;
    }

    const fullText = currentDoc.paragraphs[paragraphIndex] || '';
    const startOffset = Math.max(0, fullText.indexOf(text));
    if (startOffset === -1) {
      setSelectedRange(null);
      return;
    }
    const endOffset = startOffset + text.length;

    setSelectedRange({
      paragraphIndex,
      startOffset,
      endOffset,
      text,
    });
  }, [currentDoc.paragraphs, setSelectedRange]);

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = containerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const x = e.clientX - cRect.left;
      const y = e.clientY - cRect.top;

      const startIdx = (pageState.page - 1) * paragraphsPerPage;
      const endIdx = startIdx + paragraphsPerPage;
      const pageAnnotations = annotations.filter(
        (a) =>
          a.type === 'comment' &&
          a.paragraphIndex >= startIdx &&
          a.paragraphIndex < endIdx
      );

      let found: Annotation | null = null;
      for (const ann of pageAnnotations) {
        const rect = paragraphRectsRef.current.get(ann.paragraphIndex);
        if (!rect) continue;
        const offsetLength = ann.endOffset - ann.startOffset;
        const startX = rect.left + ann.startOffset * rect.charWidth;
        const highlightWidth = Math.min(
          offsetLength * rect.charWidth,
          rect.width + rect.left - startX
        );
        const bubbleX = Math.min(
          startX + highlightWidth + 8,
          rect.left + rect.width - 16
        );
        const bubbleY = rect.top + 8;
        const dx = x - bubbleX;
        const dy = y - bubbleY;
        if (dx * dx + dy * dy < 100) {
          found = ann;
          setTooltipPos({ x: bubbleX, y: bubbleY });
          break;
        }
      }
      setHoverComment(found);
    },
    [annotations, pageState.page, paragraphsPerPage]
  );

  return (
    <>
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoverComment(null)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'auto',
            zIndex: 5,
          }}
        />
      </div>

      {hoverComment && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltipPos.x + 20, 400),
            top: tooltipPos.y - 8,
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 13,
            maxWidth: 280,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 50,
            pointerEvents: 'none',
          }}
          className="anim-fade-in"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
              fontSize: 12,
              color: '#94a3b8',
            }}
          >
            <MessageCircle size={12} />
            <span>批注</span>
          </div>
          <div style={{ lineHeight: 1.5 }}>{hoverComment.comment}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
            {new Date(hoverComment.createdAt).toLocaleString('zh-CN')}
          </div>
        </div>
      )}
    </>
  );
};

export default AnnotationLayer;
