import { useRef, useEffect, useState, useCallback } from 'react';
import type { ComicPage, Hotspot } from '@/types';

interface PageRendererProps {
  page: ComicPage;
  width: number;
  height: number;
  activeHotspotId: string | null;
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

export default function PageRenderer({
  page,
  width,
  height,
  activeHotspotId,
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
        animRef.current = {
          hotspotId: activeHotspotId,
          type: hs.type,
          startTime: performance.now(),
          duration: hs.type === 'blink' ? 300 : 600,
        };
      }
    }
  }, [activeHotspotId, page.hotspots]);

  const render = useCallback(() => {
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

    const needsAnim =
      hover.opacity !== hover.targetOpacity ||
      (animRef.current.hotspotId && animRef.current.type);

    if (hover.opacity !== hover.targetOpacity) {
      const diff = hover.targetOpacity - hover.opacity;
      hover.opacity += diff * 0.18;
      if (Math.abs(diff) < 0.005) hover.opacity = hover.targetOpacity;
    }

    if (needsAnim) {
      rafRef.current = requestAnimationFrame(render);
    } else {
      rafRef.current = null;
    }
  }, [width, height, page.hotspots, imgLoaded]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

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
    for (let i = page.hotspots.length -