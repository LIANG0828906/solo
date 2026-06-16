import React, { useRef, useEffect, useCallback } from 'react';
import useStore, { computeHash } from './store';
import { generateArt, renderElements, GeomElement } from './artGenerator';

const ANIMATION_DURATION = 1500;

const ArtCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const elementsRef = useRef<GeomElement[]>([]);
  const animStartRef = useRef<number>(0);
  const params = useStore((s) => s.params);
  const isFavorited = useStore((s) => s.isFavorited);
  const favorites = useStore((s) => s.favorites);
  const addFavorite = useStore((s) => s.addFavorite);
  const setIsFavorited = useStore((s) => s.setIsFavorited);
  const exportModal = useStore((s) => s.exportModal);
  const setExportModal = useStore((s) => s.setExportModal);

  const [heartAnim, setHeartAnim] = React.useState(false);

  const hash = computeHash(params);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    return { width: rect.width, height: rect.height };
  }, []);

  const startAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    elementsRef.current = generateArt({
      lineDensity: params.lineDensity,
      shapeComplexity: params.shapeComplexity,
      hueShift: params.hueShift,
      opacity: params.opacity,
      primaryColor: params.primaryColor,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
      seed: Date.now(),
    });

    animStartRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - animStartRef.current;
      const progress = Math.min(1, elapsed / ANIMATION_DURATION);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderElements(ctx, elementsRef.current, params.bgColor, progress);
        ctx.restore();
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(animate);
  }, [params]);

  useEffect(() => {
    const dims = resizeCanvas();
    if (dims) {
      startAnimation();
    }
  }, [params, resizeCanvas, startAnimation]);

  useEffect(() => {
    const handleResize = () => {
      const dims = resizeCanvas();
      if (dims) {
        startAnimation();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeCanvas, startAnimation]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handleFavorite = useCallback(() => {
    if (isFavorited) return;
    const canvas = canvasRef.current;
    let thumbnailDataUrl = '';
    if (canvas) {
      thumbnailDataUrl = canvas.toDataURL('image/png', 0.3);
    }
    addFavorite({
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      params: { ...params },
      hash,
      thumbnailDataUrl,
      createdAt: Date.now(),
    });
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 500);
  }, [isFavorited, params, hash, addFavorite]);

  const handleExport = useCallback(
    (format: 'png' | 'svg') => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (format === 'png') {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `abstract-art-${hash}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      } else {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const elements = elementsRef.current;
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">`;
        svgContent += `<rect width="100%" height="100%" fill="${params.bgColor}"/>`;

        for (const el of elements) {
          const opacity = Math.max(0, Math.min(1, el.opacity));
          if (el.type === 'circle' && el.radius !== undefined) {
            svgContent += `<circle cx="${el.x}" cy="${el.y}" r="${el.radius}" fill="${el.fillColor}" opacity="${opacity}" transform="rotate(${el.rotation} ${el.x} ${el.y})"/>`;
          } else if (el.type === 'rect') {
            const w = el.width ?? 20;
            const h = el.height ?? 20;
            svgContent += `<rect x="${el.x - w / 2}" y="${el.y - h / 2}" width="${w}" height="${h}" fill="${el.fillColor}" opacity="${opacity}" transform="rotate(${el.rotation} ${el.x} ${el.y})"/>`;
          } else if (el.type === 'bezier' && el.points && el.points.length >= 2) {
            let d = `M ${el.points[0].x} ${el.points[0].y}`;
            for (let i = 1; i < el.points.length; i++) {
              d += ` L ${el.points[i].x} ${el.points[i].y}`;
            }
            svgContent += `<path d="${d}" stroke="${el.strokeColor}" stroke-width="${el.lineWidth ?? 2}" fill="none" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
          }
        }

        svgContent += `</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `abstract-art-${hash}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setExportModal(false);
    },
    [hash, params, setExportModal]
  );

  return (
    <div className="canvas-area">
      <div className="canvas-topbar">
        <span className="hash-display">#{hash}</span>
        <button
          className={`favorite-btn btn-click ${isFavorited ? 'active' : ''} ${heartAnim ? 'beating' : ''}`}
          onClick={handleFavorite}
          disabled={isFavorited}
          title={isFavorited ? '已收藏' : '收藏'}
        >
          {isFavorited ? '❤' : '♡'}
        </button>
      </div>

      <div className="canvas-container" ref={containerRef}>
        <canvas ref={canvasRef} />

        <button
          className="export-btn btn-click"
          onClick={() => setExportModal(true)}
          title="导出"
        >
          ⬇
        </button>
      </div>

      {exportModal.show && (
        <div className="modal-overlay" onClick={() => setExportModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>导出画作</h3>
            <div className="modal-buttons">
              <button
                className="modal-btn btn-click"
                onClick={() => handleExport('png')}
              >
                PNG 格式
              </button>
              <button
                className="modal-btn btn-click"
                onClick={() => handleExport('svg')}
              >
                SVG 格式
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtCanvas;
