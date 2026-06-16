import React, { useEffect, useRef, useCallback } from 'react';
import { useColorStore } from '../store/colorStore';
import type { RGB, PickerPixel } from '../types';

interface BeamConfig {
  x: number;
  y: number;
  radius: number;
  color: RGB;
  alpha: number;
  label: string;
}

interface FilterRect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: RGB;
  alpha: number;
  label: string;
}

function getContrastTextColor({ r, g, b }: RGB): string {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1a1a2e' : '#ffffff';
}

function formatRGB(c: RGB): string {
  return `(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
}

const Mixer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const dirtyRef = useRef(true);

  const mode = useColorStore((s) => s.mode);
  const lights = useColorStore((s) => s.lights);
  const filters = useColorStore((s) => s.filters);
  const fading = useColorStore((s) => s.fading);
  const openPicker = useColorStore((s) => s.openPicker);

  useEffect(() => {
    dirtyRef.current = true;
  }, [mode, lights, filters, fading]);

  const drawAdditive = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const beams: BeamConfig[] = [
        {
          x: w * 0.38,
          y: h * 0.4,
          radius: Math.min(w, h) * 0.34,
          color: { r: lights.r, g: 0, b: 0 },
          alpha: lights.r / 255,
          label: 'R',
        },
        {
          x: w * 0.62,
          y: h * 0.4,
          radius: Math.min(w, h) * 0.34,
          color: { r: 0, g: lights.g, b: 0 },
          alpha: lights.g / 255,
          label: 'G',
        },
        {
          x: w * 0.5,
          y: h * 0.62,
          radius: Math.min(w, h) * 0.34,
          color: { r: 0, g: 0, b: lights.b },
          alpha: lights.b / 255,
          label: 'B',
        },
      ];

      ctx.globalCompositeOperation = 'lighter';
      for (const beam of beams) {
        if (beam.alpha <= 0.01) continue;
        const grad = ctx.createRadialGradient(
          beam.x,
          beam.y,
          0,
          beam.x,
          beam.y,
          beam.radius
        );
        const { r, g, b } = beam.color;
        const a = Math.max(0.05, beam.alpha);
        grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(0.55, `rgba(${r},${g},${b},${a * 0.65})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(beam.x, beam.y, beam.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      const getPixelRGB = (px: number, py: number): RGB => {
        const img = ctx.getImageData(Math.round(px), Math.round(py), 1, 1).data;
        return { r: img[0], g: img[1], b: img[2] };
      };

      const labels: { x: number; y: number; color: RGB }[] = [
        {
          x: beams[0].x - beams[0].radius * 0.25,
          y: beams[0].y - beams[0].radius * 0.25,
          color: { r: lights.r, g: 0, b: 0 },
        },
        {
          x: beams[1].x + beams[1].radius * 0.25,
          y: beams[1].y - beams[1].radius * 0.25,
          color: { r: 0, g: lights.g, b: 0 },
        },
        {
          x: beams[2].x,
          y: beams[2].y + beams[2].radius * 0.35,
          color: { r: 0, g: 0, b: lights.b },
        },
        {
          x: w * 0.5,
          y: h * 0.3,
          color: {
            r: Math.min(255, lights.r + lights.g),
            g: Math.min(255, lights.g + lights.r),
            b: Math.min(255, 0),
          },
        },
        {
          x: w * 0.3,
          y: h * 0.58,
          color: {
            r: Math.min(255, lights.r + lights.b),
            g: 0,
            b: Math.min(255, lights.b + lights.r),
          },
        },
        {
          x: w * 0.7,
          y: h * 0.58,
          color: {
            r: 0,
            g: Math.min(255, lights.g + lights.b),
            b: Math.min(255, lights.b + lights.g),
          },
        },
        {
          x: w * 0.5,
          y: h * 0.5,
          color: {
            r: Math.min(255, lights.r + lights.g + lights.b),
            g: Math.min(255, lights.r + lights.g + lights.b),
            b: Math.min(255, lights.r + lights.g + lights.b),
          },
        },
      ];

      for (const lb of labels) {
        const px = getPixelRGB(lb.x, lb.y);
        const txt = formatRGB(px);
        const txtColor = getContrastTextColor(px);
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(txt);
        const padX = 6;
        const padY = 3;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(
          lb.x - metrics.width / 2 - padX,
          lb.y - 8 - padY,
          metrics.width + padX * 2,
          16 + padY * 2
        );
        ctx.fillStyle = txtColor;
        ctx.fillText(txt, lb.x, lb.y);
      }
    },
    [lights]
  );

  const drawSubtractive = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const margin = w * 0.12;
      const rectW = w * 0.42;
      const rectH = h * 0.42;
      const cy = h * 0.48;
      const cAlpha = filters.c / 100;
      const mAlpha = filters.m / 100;
      const yAlpha = filters.y / 100;

      const rects: FilterRect[] = [
        {
          x: w / 2 - rectW / 2,
          y: cy - rectH * 0.65,
          w: rectW,
          h: rectH,
          color: {
            r: Math.round(255 * (1 - cAlpha)),
            g: 255,
            b: 255,
          },
          alpha: cAlpha,
          label: 'C',
        },
        {
          x: margin,
          y: cy,
          w: rectW,
          h: rectH,
          color: {
            r: 255,
            g: Math.round(255 * (1 - mAlpha)),
            b: 255,
          },
          alpha: mAlpha,
          label: 'M',
        },
        {
          x: w - margin - rectW,
          y: cy,
          w: rectW,
          h: rectH,
          color: {
            r: 255,
            g: 255,
            b: Math.round(255 * (1 - yAlpha)),
          },
          alpha: yAlpha,
          label: 'Y',
        },
      ];

      ctx.globalCompositeOperation = 'multiply';
      for (const r of rects) {
        if (r.alpha <= 0.01) continue;
        const grad = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
        const { r: cr, g: cg, b: cb } = r.color;
        grad.addColorStop(
          0,
          `rgba(${cr},${cg},${cb},${Math.max(0.2, r.alpha)})`
        );
        grad.addColorStop(
          1,
          `rgba(${cr},${cg},${cb},${Math.max(0.1, r.alpha * 0.85)})`
        );
        ctx.fillStyle = grad;
        ctx.beginPath();
        const radius = 14;
        ctx.moveTo(r.x + radius, r.y);
        ctx.lineTo(r.x + r.w - radius, r.y);
        ctx.quadraticCurveTo(r.x + r.w, r.y, r.x + r.w, r.y + radius);
        ctx.lineTo(r.x + r.w, r.y + r.h - radius);
        ctx.quadraticCurveTo(
          r.x + r.w,
          r.y + r.h,
          r.x + r.w - radius,
          r.y + r.h
        );
        ctx.lineTo(r.x + radius, r.y + r.h);
        ctx.quadraticCurveTo(r.x, r.y + r.h, r.x, r.y + r.h - radius);
        ctx.lineTo(r.x, r.y + radius);
        ctx.quadraticCurveTo(r.x, r.y, r.x + radius, r.y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      const getPixelRGB = (px: number, py: number): RGB => {
        const img = ctx.getImageData(Math.round(px), Math.round(py), 1, 1).data;
        return { r: img[0], g: img[1], b: img[2] };
      };

      const labelPoints = [
        { x: rects[0].x + rects[0].w / 2, y: rects[0].y + rects[0].h / 2 - 20 },
        { x: rects[1].x + rects[1].w / 2 - 20, y: rects[1].y + rects[1].h / 2 },
        { x: rects[2].x + rects[2].w / 2 + 20, y: rects[2].y + rects[2].h / 2 },
        {
          x: (rects[0].x + rects[1].x + rects[1].w) / 2 - 10,
          y: (rects[0].y + rects[0].h + rects[1].y) / 2 + 5,
        },
        {
          x: (rects[0].x + rects[0].w + rects[2].x) / 2 + 10,
          y: (rects[0].y + rects[0].h + rects[2].y) / 2 + 5,
        },
        {
          x: w / 2,
          y: cy + rectH / 2 + 10,
        },
        {
          x: w / 2,
          y: cy + 15,
        },
      ];

      for (const pt of labelPoints) {
        const px = getPixelRGB(pt.x, pt.y);
        const txt = formatRGB(px);
        const txtColor = getContrastTextColor(px);
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(txt);
        const padX = 6;
        const padY = 3;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(
          pt.x - metrics.width / 2 - padX,
          pt.y - 8 - padY,
          metrics.width + padX * 2,
          16 + padY * 2
        );
        ctx.fillStyle = txtColor;
        ctx.fillText(txt, pt.x, pt.y);
      }
    },
    [filters]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const wrapper = wrapperRef.current;
    if (wrapper) {
      const cssW = wrapper.clientWidth;
      const cssH = Math.round(cssW * 0.8);
      if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    if (mode === 'additive') {
      drawAdditive(ctx, w, h);
    } else {
      drawSubtractive(ctx, w, h);
    }

    dirtyRef.current = false;
  }, [mode, drawAdditive, drawSubtractive]);

  useEffect(() => {
    const loop = () => {
      if (dirtyRef.current) {
        render();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  useEffect(() => {
    const onResize = () => {
      dirtyRef.current = true;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const sampleX = Math.round(px);
    const sampleY = Math.round(py);
    const startX = Math.max(0, sampleX - 2 * dpr);
    const startY = Math.max(0, sampleY - 2 * dpr);
    const size = Math.min(
      5,
      Math.floor((canvas.width - startX) / dpr),
      Math.floor((canvas.height - startY) / dpr)
    );
    if (size <= 0) return;

    const data = ctx.getImageData(
      Math.round(startX),
      Math.round(startY),
      Math.round(size * dpr),
      Math.round(size * dpr)
    ).data;

    const pixels: PickerPixel[] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const srcX = Math.min(x * dpr, (size * dpr) - 1);
        const srcY = Math.min(y * dpr, (size * dpr) - 1);
        const idx = (srcY * size * dpr + srcX) * 4;
        pixels.push({
          x,
          y,
          rgb: { r: data[idx], g: data[idx + 1], b: data[idx + 2] },
        });
      }
    }

    const centerIdx = 12;
    const centerColor = pixels[centerIdx].rgb;

    openPicker(
      Math.round(px / dpr),
      Math.round(py / dpr),
      pixels,
      centerColor
    );
  };

  return (
    <div ref={wrapperRef} className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="mixer-canvas"
        onClick={handleClick}
      />
    </div>
  );
};

export default Mixer;
