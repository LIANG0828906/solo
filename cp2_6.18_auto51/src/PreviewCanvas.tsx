import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { MosaicCell } from './imageProcessor';
import { MosaicConfig } from './ControlPanel';

interface PreviewCanvasProps {
  cells: MosaicCell[];
  imageSize: { width: number; height: number } | null;
  config: MosaicConfig;
}

export interface PreviewCanvasHandle {
  exportHD: () => Promise<Blob> | null;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const PreviewCanvas = forwardRef<PreviewCanvasHandle, PreviewCanvasProps>(
  ({ cells, imageSize, config }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
    const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 });
    const draggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
    const [opacity, setOpacity] = useState(1);
    const fadeTimerRef = useRef<number | null>(null);
    const renderTokenRef = useRef(0);

    useImperativeHandle(ref, (): PreviewCanvasHandle => ({
      exportHD: () => {
        if (!imageSize || cells.length === 0) return null;
        const scale = 2;
        const cellW = imageSize.width / Math.ceil(imageSize.width / config.cellSize);
        const cellH = imageSize.height / Math.ceil(imageSize.height / config.cellSize);
        const cols = Math.ceil(imageSize.width / config.cellSize);
        const rows = Math.ceil(imageSize.height / config.cellSize);

        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(cols * cellW * scale);
        canvas.height = Math.ceil(rows * cellH * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        drawMosaic(ctx, cells, cellW, cellH, config.cellSize, true);

        return new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('Blob creation failed'));
          }, 'image/png');
        });
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      const update = () => {
        if (containerRef.current) {
          const r = containerRef.current.getBoundingClientRect();
          setCanvasSize({ w: r.width, h: r.height });
        }
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }, []);

    const triggerFade = useCallback(() => {
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
      setOpacity(0.6);
      fadeTimerRef.current = window.setTimeout(() => {
        setOpacity(1);
      }, 30);
    }, []);

    const drawMosaic = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        data: MosaicCell[],
        cellW: number,
        cellH: number,
        _cellSize: number,
        exportMode = false,
      ) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.min(cellW, cellH) * 0.9;
        ctx.font = `${fontSize}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;

        for (let i = 0; i < data.length; i++) {
          const cell = data[i];
          const cx = cell.col * cellW + cellW / 2;
          const cy = cell.row * cellH + cellH / 2;

          if (!exportMode) {
            const rotSeed = (cell.col * 73856093) ^ (cell.row * 19349663);
            const scaleSeed = (cell.col * 83492791) ^ (cell.row * 2971215073);
            const rand = (seed: number) => {
              const x = Math.sin(seed) * 10000;
              return x - Math.floor(x);
            };
            const angle = (rand(rotSeed) - 0.5) * 10 * (Math.PI / 180);
            const s = 0.95 + rand(scaleSeed) * 0.1;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.scale(s, s);
            ctx.fillText(cell.emoji, 0, 0);
            ctx.restore();
          } else {
            ctx.fillText(cell.emoji, cx, cy);
          }
        }
      },
      [],
    );

    useEffect(() => {
      if (!canvasRef.current || !imageSize || cells.length === 0 || canvasSize.w === 0) return;

      const token = ++renderTokenRef.current;
      const rafId = requestAnimationFrame(() => {
        if (token !== renderTokenRef.current) return;
        const canvas = canvasRef.current!;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasSize.w * dpr;
        canvas.height = canvasSize.h * dpr;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#EDF2F7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cols = Math.ceil(imageSize.width / config.cellSize);
        const rows = Math.ceil(imageSize.height / config.cellSize);
        const aspect = (cols * config.cellSize) / (rows * config.cellSize);
        const containerAspect = canvasSize.w / canvasSize.h;

        let renderW: number, renderH: number;
        if (aspect > containerAspect) {
          renderW = canvasSize.w * 0.9;
          renderH = renderW / aspect;
        } else {
          renderH = canvasSize.h * 0.9;
          renderW = renderH * aspect;
        }

        const cellW = renderW / cols;
        const cellH = renderH / rows;

        const t = transformRef.current;
        ctx.save();
        ctx.translate(canvasSize.w / 2 + t.x, canvasSize.h / 2 + t.y);
        ctx.scale(t.scale, t.scale);
        ctx.translate(-renderW / 2, -renderH / 2);
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, renderW, renderH);

        drawMosaic(ctx, cells, cellW, cellH, config.cellSize, false);
        ctx.restore();
      });

      triggerFade();
      return () => cancelAnimationFrame(rafId);
    }, [cells, imageSize, canvasSize, config.cellSize, drawMosaic, triggerFade]);

    const onWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const t = transformRef.current;
      t.scale = Math.max(0.5, Math.min(4, t.scale * (1 + delta)));
      if (canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx && imageSize && cells.length > 0) {
          const canvas = canvasRef.current;
          canvas.width = canvasSize.w * dpr;
          canvas.height = canvasSize.h * dpr;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#EDF2F7';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const cols = Math.ceil(imageSize.width / config.cellSize);
          const rows = Math.ceil(imageSize.height / config.cellSize);
          const aspect = (cols * config.cellSize) / (rows * config.cellSize);
          const containerAspect = canvasSize.w / canvasSize.h;
          let renderW: number, renderH: number;
          if (aspect > containerAspect) {
            renderW = canvasSize.w * 0.9;
            renderH = renderW / aspect;
          } else {
            renderH = canvasSize.h * 0.9;
            renderW = renderH * aspect;
          }
          const cellW = renderW / cols;
          const cellH = renderH / rows;
          const t2 = transformRef.current;
          ctx.save();
          ctx.translate(canvasSize.w / 2 + t2.x, canvasSize.h / 2 + t2.y);
          ctx.scale(t2.scale, t2.scale);
          ctx.translate(-renderW / 2, -renderH / 2);
          ctx.scale(dpr, dpr);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, renderW, renderH);
          drawMosaic(ctx, cells, cellW, cellH, config.cellSize, false);
          ctx.restore();
        }
      }
    };

    const onMouseDown = (e: React.MouseEvent) => {
      draggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        tx: transformRef.current.x,
        ty: transformRef.current.y,
      };
    };

    const onMouseMove = (e: React.MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      transformRef.current.x = dragStartRef.current.tx + dx;
      transformRef.current.y = dragStartRef.current.ty + dy;
      if (canvasRef.current && imageSize && cells.length > 0) {
        const dpr = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = canvasSize.w * dpr;
        canvas.height = canvasSize.h * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#EDF2F7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cols = Math.ceil(imageSize.width / config.cellSize);
        const rows = Math.ceil(imageSize.height / config.cellSize);
        const aspect = (cols * config.cellSize) / (rows * config.cellSize);
        const containerAspect = canvasSize.w / canvasSize.h;
        let renderW: number, renderH: number;
        if (aspect > containerAspect) {
          renderW = canvasSize.w * 0.9;
          renderH = renderW / aspect;
        } else {
          renderH = canvasSize.h * 0.9;
          renderW = renderH * aspect;
        }
        const cellW = renderW / cols;
        const cellH = renderH / rows;
        const t = transformRef.current;
        ctx.save();
        ctx.translate(canvasSize.w / 2 + t.x, canvasSize.h / 2 + t.y);
        ctx.scale(t.scale, t.scale);
        ctx.translate(-renderW / 2, -renderH / 2);
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, renderW, renderH);
        drawMosaic(ctx, cells, cellW, cellH, config.cellSize, false);
        ctx.restore();
      }
    };

    const onMouseUp = () => {
      draggingRef.current = false;
    };

    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          height: '100%',
          background: '#EDF2F7',
          position: 'relative',
          overflow: 'hidden',
          cursor: draggingRef.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            opacity,
            transition: 'opacity 0.5s ease',
          }}
        />
        {!imageSize || cells.length === 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
              <div style={{ fontSize: 16, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>
                上传图片开始创作
              </div>
              <div>点击左侧虚线框或拖拽图片到此区域</div>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);

PreviewCanvas.displayName = 'PreviewCanvas';

export default PreviewCanvas;
