import { useRef, useEffect, useState, useCallback } from 'react';
import type { ComicPage, Hotspot, MeshGrid, ShadowContour } from '@/types';
import { computeMeshDeformation, computeCurvedShadow } from './FlipAnimation';

interface PageRendererProps {
  page: ComicPage;
  width: number;
  height: number;
  activeHotspotId: string | null;
  flipDirection?: 'next' | 'prev' | null;
  flipProgress?: number;
  onHotspotHover?: (hotspotId: string | null) => void;
  onHotspotClick?: (hotspot: Hotspot) => void;
  disabled?: boolean;
}

interface HoverState {
  hotspotId: string | null;
  opacity: number;
  targetOpacity: number;
}

interface AnimationState {
  hotspotId: string | null;
  type: 'blink' | 'glow' | null;
  startTime: number;
  duration: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPaperTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 6;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

function hotspotToPixel(h: Hotspot, w: number, hh: number) {
  return {
    x: (h.x / 100) * w,
    y: (h.y / 100) * hh,
    width: (h.width / 100) * w,
    height: (h.height / 100) * hh,
  };
}

function drawMeshDeformedPage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  mesh: MeshGrid,
  shadow: ShadowContour | null,
  direction: 'next' | 'prev'
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const cellW = width / mesh.cols;
  const cellH = height / mesh.rows;

  drawPaperTexture(ctx, width, height);

  for (let row = 0; row < mesh.rows; row++) {
    for (let col = 0; col < mesh.cols; col++) {
      const tl = mesh.vertices[row][col];
      const tr = mesh.vertices[row][col + 1];
      const bl = mesh.vertices[row + 1][col];
      const br = mesh.vertices[row + 1][col + 1];

      const srcX = col * cellW;
      const srcY = row * cellH;
      const srcW = cellW;
      const srcH = cellH;

      const dx = Math.min(tl.x, bl.x);
      const dy = Math.min(tl.y, tr.y);
      const dw = Math.max(tr.x, br.x) - dx;
      const dh = Math.max(bl.y, br.y) - dy;

      if (dw < 0.5 || dh < 0.5) continue;

      ctx.save();

      ctx.beginPath();
      ctx.moveTo(tl.x, tl.y);
      ctx.lineTo(tr.x, tr.y);
      ctx.lineTo(br.x, br.y);
      ctx.lineTo(bl.x, bl.y);
      ctx.closePath();
      ctx.clip();

      const avgTopW = tr.x - tl.x;
      const avgBotW = br.x - bl.x;
      const avgW = (avgTopW + avgBotW) / 2;
      const scaleX = avgW > 0.5 ? srcW / avgW : 1;

      const avgLeftH = bl.y - tl.y;
      const avgRightH = br.y - tr.y;
      const avgH = (avgLeftH + avgRightH) / 2;
      const scaleY = avgH > 0.5 ? srcH / avgH : 1;

      const centerX = (tl.x + tr.x + bl.x + br.x) / 4;
      const centerY = (tl.y + tr.y + bl.y + br.y) / 4;

      ctx.translate(centerX, centerY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-centerX / scaleX, -centerY / scaleY);

      ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh);
      ctx.restore();
    }
  }

  if (shadow) {
    drawCurvedShadow(ctx, shadow, width, height, direction);
  }

  ctx.restore();
}

function drawCurvedShadow(
  ctx: CanvasRenderingContext2D,
  shadow: ShadowContour,
  _width: number,
  height: number,
  _direction: 'next' | 'prev'
) {
  if (shadow.points.length < 2) return;

  ctx.save();

  const outerPath = shadow.points;
  const innerPath = shadow.innerPoints;

  ctx.beginPath();
  ctx.moveTo(outerPath[0].x, outerPath[0].y);
  for (let i = 1; i < outerPath.length; i++) {
    ctx.lineTo(outerPath[i].x, outerPath[i].y);
  }
  for (let i = innerPath.length - 1; i >= 0; i--) {
    ctx.lineTo(innerPath[i].x, innerPath[i].y);
  }
  ctx.closePath();

  const minOuterX = Math.min(...outerPath.map((p) => p.x));
  const maxOuterX = Math.max(...outerPath.map((p) => p.x));
  const minInnerX = Math.min(...innerPath.map((p) => p.x));
  const maxInnerX = Math.max(...innerPath.map((p) => p.x));

  const gradientStart = Math.min(minOuterX, minInnerX);
  const gradientEnd = Math.max(maxOuterX, maxInnerX);
  const gradientRange = gradientEnd - gradientStart;

  if (gradientRange > 1) {
    const gradient = ctx.createLinearGradient(gradientStart, 0, gradientEnd, 0);
    for (const stop of shadow.gradientStops) {
      const offset = Math.max(0, Math.min(1, stop.offset));
      gradient.addColorStop(offset, `rgba(0,0,0,${stop.opacity})`);
    }
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = `rgba(0,0,0,0.2)`;
  }

  ctx.fill();
  ctx.restore();

  if (outerPath.length >= 2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(innerPath[0].x, innerPath[0].y);
    for (let i = 1; i < innerPath.length; i++) {
      ctx.lineTo(innerPath[i].x, innerPath[i].y);
    }
    const spineGrad = ctx.createLinearGradient(0, 0, 0, height);
    spineGrad.addColorStop(0, 'rgba(0,0,0,0.05)');
    spineGrad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
    spineGrad.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.strokeStyle = spineGrad;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

export default function PageRenderer({
  page,
  width,
  height,
  activeHotspotId,
  flipDirection,
  flipProgress,
  onHotspotHover,
  onHotspotClick,
  disabled = false,
}: PageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const hoverRef = useRef<HoverState>({ hotspotId: null, opacity: 0, targetOpacity: 0 });
  const animRef = useRef<AnimationState>({ hotspotId: null, type: null, startTime: 0, duration: 0 });
  const rafRef = useRef<number | null>(null);
  const prevHoverRafRef = useRef<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => setImgLoaded(true);
    img.src = page.imageUrl;
    return () => {
      imgRef.current = null;
    };
  }, [page.imageUrl]);

  useEffect(() => {
    if (activeHotspotId) {
      const hs = page.hotspots.find((h) => h.id === activeHotspotId);
      if (hs) {
        if (prevHoverRafRef.current !== null) {
          cancelAnimationFrame(prevHoverRafRef.current);
          prevHoverRafRef.current = null;
        }
        animRef.current = {
          hotspotId: activeHotspotId,
          type: hs.type,
          startTime: performance.now(),
          duration: hs.type === 'blink' ? 300 : 600,
        };
        scheduleRender();
      }
    }
  }, [activeHotspotId, page.hotspots]);

  const scheduleRender = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      performRender();
    });
  }, []);

  const performRender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const isFlipping = flipDirection != null && flipProgress != null && flipProgress > 0;

    if (isFlipping && imgRef.current && imgLoaded) {
      const mesh = computeMeshDeformation(flipDirection!, flipProgress!, width, height);
      const shadow = computeCurvedShadow(flipDirection!, flipProgress!, width, height, mesh);
      drawMeshDeformedPage(ctx, imgRef.current, width, height, mesh, shadow, flipDirection!);
    } else {
      drawPaperTexture(ctx, width, height);

      if (imgRef.current && imgLoaded) {
        const img = imgRef.current;
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let drawW = width;
        let drawH = height;
        let drawX = 0;
        let drawY = 0;
        if (imgRatio > canvasRatio) {
          drawH = width / imgRatio;
          drawY = (height - drawH) / 2;
        } else {
          drawW = height * imgRatio;
          drawX = (width - drawW) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }
    }

    const hover = hoverRef.current;
    if (hover.hotspotId && hover.opacity > 0.001) {
      const hs = page.hotspots.find((h) => h.id === hover.hotspotId);
      if (hs) {
        const p = hotspotToPixel(hs, width, height);
        ctx.save();
        ctx.globalAlpha = hover.opacity * 0.4;
        ctx.fillStyle = '#FFF9C4';
        ctx.shadowColor = '#FFF59D';
        ctx.shadowBlur = 18 * hover.opacity;
        roundRect(ctx, p.x - 4, p.y - 4, p.width + 8, p.height + 8, Math.min(p.width, p.height) * 0.25);
        ctx.fill();
        ctx.restore();
      }
    }

    const anim = animRef.current;
    if (anim.hotspotId && anim.type) {
      const elapsed = performance.now() - anim.startTime;
      const t = Math.min(1, elapsed / anim.duration);
      const hs = page.hotspots.find((h) => h.id === anim.hotspotId);
      if (hs) {
        const p = hotspotToPixel(hs, width, height);
        const cx = p.x + p.width / 2;
        const cy = p.y + p.height / 2;

        if (anim.type === 'blink') {
          const phase = Math.sin(t * Math.PI);
          ctx.save();
          ctx.fillStyle = '#000';
          ctx.globalAlpha = phase;
          const eyeH = p.height * (0.1 + phase * 0.85);
          roundRect(ctx, p.x, cy - eyeH / 2, p.width, eyeH, p.width * 0.5);
          ctx.fill();
          ctx.restore();
        } else if (anim.type === 'glow') {
          const radius = Math.max(p.width, p.height) * (0.5 + t * 1.8);
          const alpha = (1 - t) * 0.7;
          const gradient = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
          gradient.addColorStop(0, `rgba(255, 249, 196, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(255, 235, 130, ${alpha * 0.5})`);
          gradient.addColorStop(1, 'rgba(255, 235, 130, 0)');
          ctx.save();
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (t >= 1) {
          animRef.current = { hotspotId: null, type: null, startTime: 0, duration: 0 };
        }
      }
    }

    const hoverAnimating = Math.abs(hover.opacity - hover.targetOpacity) > 0.005;
    const easterEggAnimating = animRef.current.hotspotId != null && animRef.current.type != null;

    if (hoverAnimating) {
      const diff = hover.targetOpacity - hover.opacity;
      hover.opacity += diff * 0.15;
      if (Math.abs(diff) < 0.005) hover.opacity = hover.targetOpacity;
    }

    if (hoverAnimating || easterEggAnimating) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        performRender();
      });
    }
  }, [width, height, page.hotspots, imgLoaded, flipDirection, flipProgress]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      performRender();
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (prevHoverRafRef.current) cancelAnimationFrame(prevHoverRafRef.current);
    };
  }, [performRender]);

  useEffect(() => {
    if (flipDirection != null && flipProgress != null && flipProgress > 0) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        performRender();
      });
    }
  }, [flipDirection, flipProgress, performRender]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const hitTest = (pos: { x: number; y: number }): Hotspot | null => {
    for (let i = page.hotspots.length - 1; i >= 0; i--) {
      const h = page.hotspots[i];
      if (
        pos.x >= h.x &&
        pos.x <= h.x + h.width &&
        pos.y >= h.y &&
        pos.y <= h.y + h.height
      ) {
        return h;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const pos = getMousePos(e);
    const hit = hitTest(pos);
    const hover = hoverRef.current;

    if (hit) {
      if (hover.hotspotId !== hit.id) {
        if (prevHoverRafRef.current !== null) {
          cancelAnimationFrame(prevHoverRafRef.current);
          prevHoverRafRef.current = null;
        }
        hover.hotspotId = hit.id;
        hover.targetOpacity = 1;
        if (hover.opacity > 0.3) {
          hover.opacity = 0.3;
        }
        scheduleRender();
      }
      onHotspotHover?.(hit.id);
      e.currentTarget.style.cursor = 'pointer';
    } else {
      if (hover.hotspotId !== null) {
        if (prevHoverRafRef.current !== null) {
          cancelAnimationFrame(prevHoverRafRef.current);
          prevHoverRafRef.current = null;
        }
        hover.targetOpacity = 0;
        prevHoverRafRef.current = requestAnimationFrame(function fadeOut() {
          prevHoverRafRef.current = null;
          scheduleRender();
        });
        hover.hotspotId = null;
      }
      onHotspotHover?.(null);
      e.currentTarget.style.cursor = 'default';
    }
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    const hover = hoverRef.current;
    if (hover.hotspotId !== null) {
      if (prevHoverRafRef.current !== null) {
        cancelAnimationFrame(prevHoverRafRef.current);
        prevHoverRafRef.current = null;
      }
      hover.targetOpacity = 0;
      hover.hotspotId = null;
      scheduleRender();
    }
    onHotspotHover?.(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const pos = getMousePos(e);
    const hit = hitTest(pos);
    if (hit) {
      onHotspotClick?.(hit);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
}
