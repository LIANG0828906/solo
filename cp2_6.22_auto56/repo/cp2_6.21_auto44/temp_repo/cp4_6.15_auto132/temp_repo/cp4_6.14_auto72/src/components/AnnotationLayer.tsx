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
  height: number;
}

interface DirtyRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 标注模块
 *
 * 数据流向：
 *   - 从 store 读取 annotations、selectedRange
 *   - 通过 requestAnimationFrame 驱动渲染循环，目标 30 FPS
 *   - 脏区域（dirty rect）重绘：仅重绘变化的区域，避免全量重绘
 *   - 滚动事件中标记 dirty 但不立即重绘，交由 rAF 在下一帧统一处理
 *
 * 性能优化：
 *   1. requestAnimationFrame 驱动，帧间隔 >= 33ms（30 FPS 以上）
 *   2. dirty flag + dirty rect，仅在需要时重绘且仅重绘变化区域
 *   3. 段落测量结果缓存，滚动时不重新测量
 *   4. 使用 devicePixelRatio 保证高清屏清晰度
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
  const lastFrameTimeRef = useRef(0);
  const dirtyRef = useRef(false);
  const dirtyRectRef = useRef<DirtyRect | null>(null);

  const paragraphRectsRef = useRef<Map<number, ParagraphRect>>(new Map());
  const prevAnnotationsRef = useRef<string>('');

  const [hoverComment, setHoverComment] = useState<Annotation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const MIN_FRAME_INTERVAL = 1000 / 30;

  const markDirty = useCallback((rect?: DirtyRect) => {
    dirtyRef.current = true;
    if (rect) {
      const prev = dirtyRectRef.current;
      if (prev) {
        const x1 = Math.min(prev.x, rect.x);
        const y1 = Math.min(prev.y, rect.y);
        const x2 = Math.max(prev.x + prev.w, rect.x + rect.w);
        const y2 = Math.max(prev.y + prev.h, rect.y + rect.h);
        dirtyRectRef.current = {
          x: x1,
          y: y1,
          w: x2 - x1,
          h: y2 - y1,
        };
      } else {
        dirtyRectRef.current = { ...rect };
      }
    } else {
      dirtyRectRef.current = null;
    }
  }, []);

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
      let charWidth = fontSize * 0.55;
      if (ctx) {
        ctx.font = `${fontSize}px -apple-system, sans-serif`;
        charWidth = ctx.measureWidth('中').width;
      }
      rects.set(idx, {
        paragraphIndex: idx,
        top: pRect.top - containerRect.top,
        left: pRect.left - containerRect.left,
        width: pRect.width,
        lineHeight,
        charWidth,
        height: pRect.height,
      });
    });
    paragraphRectsRef.current = rects;
    markDirty();
  }, [markDirty]);

  useEffect(() => {
    measureParagraphs();
    const ro = new ResizeObserver(() => {
      measureParagraphs();
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    const handleScroll = () => {
      measureParagraphs();
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [measureParagraphs, pageState.page]);

  useEffect(() => {
    const annKey = annotations.map((a) => a.id + a.type).join(',');
    if (annKey !== prevAnnotationsRef.current) {
      prevAnnotationsRef.current = annKey;
      markDirty();
    }
  }, [annotations, markDirty]);

  const getAnnotationRect = useCallback((ann: Annotation): DirtyRect | null => {
    const rect = paragraphRectsRef.current.get(ann.paragraphIndex);
    if (!rect) return null;
    const startX = rect.left + ann.startOffset * rect.charWidth;
    const width = Math.min(
      (ann.endOffset - ann.startOffset) * rect.charWidth,
      rect.width + rect.left - startX + 20
    );
    return {
      x: startX - 2,
      y: rect.top - 2,
      w: width + 4,
      h: rect.lineHeight + 4,
    };
  }, []);

  /**
   * 渲染循环
   * - 使用 requestAnimationFrame 调度
   * - 帧间隔 >= MIN_FRAME_INTERVAL 才执行绘制（30 FPS 限制）
   * - 仅在 dirty 标记时才执行绘制
   * - 优先使用 dirtyRect 局部重绘，否则全量重绘
   */
  const renderLoop = useCallback(
    (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current < MIN_FRAME_INTERVAL) {
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      if (!dirtyRef.current) {
        lastFrameTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const cRect = container.getBoundingClientRect();
      const needsResize =
        canvas.width !== cRect.width * dpr ||
        canvas.height !== cRect.height * dpr;

      if (needsResize) {
        canvas.width = cRect.width * dpr;
        canvas.height = cRect.height * dpr;
        canvas.style.width = cRect.width + 'px';
        canvas.style.height = cRect.height + 'px';
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const dirtyRect = dirtyRectRef.current;

      if (dirtyRect && !needsResize) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(dirtyRect.x, dirtyRect.y, dirtyRect.w, dirtyRect.h);
        ctx.clip();
        ctx.clearRect(dirtyRect.x, dirtyRect.y, dirtyRect.w, dirtyRect.h);

        const startIdx = (pageState.page - 1) * paragraphsPerPage;
        const endIdx = startIdx + paragraphsPerPage;
        const pageAnnotations = annotations.filter(
          (a) => a.paragraphIndex >= startIdx && a.paragraphIndex < endIdx
        );

        pageAnnotations.forEach((ann) => {
          const rect = paragraphRectsRef.current.get(ann.paragraphIndex);
          if (!rect) return;

          const startX = rect.left + ann.startOffset * rect.charWidth;
          const highlightWidth = Math.min(
            (ann.endOffset - ann.startOffset) * rect.charWidth,
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

        ctx.restore();
      } else {
        ctx.clearRect(0, 0, cRect.width, cRect.height);

        const startIdx = (pageState.page - 1) * paragraphsPerPage;
        const endIdx = startIdx + paragraphsPerPage;
        const pageAnnotations = annotations.filter(
          (a) => a.paragraphIndex >= startIdx && a.paragraphIndex < endIdx
        );

        pageAnnotations.forEach((ann) => {
          const rect = paragraphRectsRef.current.get(ann.paragraphIndex);
          if (!rect) return;

          const startX = rect.left + ann.startOffset * rect.charWidth;
          const highlightWidth = Math.min(
            (ann.endOffset - ann.startOffset) * rect.charWidth,
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
      }

      dirtyRef.current = false;
      dirtyRectRef.current = null;
      lastFrameTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(renderLoop);
    },
    [annotations, pageState.page, paragraphsPerPage]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [renderLoop]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setSelectedRange(null);
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
      const container = containerRef.current;
      if (!canvas || !container) return;
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
      let foundPos = { x: 0, y: 0 };
      for (const ann of pageAnnotations) {
        const rect = paragraphRectsRef.current.get(ann.paragraphIndex);
        if (!rect) continue;
        const startX = rect.left + ann.startOffset * rect.charWidth;
        const highlightWidth = Math.min(
          (ann.endOffset - ann.startOffset) * rect.charWidth,
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
          foundPos = { x: bubbleX, y: bubbleY };
          break;
        }
      }
      if (found && hoverComment?.id !== found.id) {
        setHoverComment(found);
        setTooltipPos(foundPos);
      } else if (!found && hoverComment) {
        setHoverComment(null);
      }
    },
    [annotations, hoverComment, pageState.page, paragraphsPerPage]
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
