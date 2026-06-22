import React, { useEffect, useRef, useState } from 'react';
import { AudioEngine } from './AudioEngine';

const lerpColor = (t: number): string => {
  const r1 = 0, g1 = 212, b1 = 170;
  const r2 = 255, g2 = 107, b2 = 53;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
};

export const SpectrumVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const [viewportWidth, setViewportWidth] = useState<number>(600);

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      if (width < 768) setViewportWidth(Math.min(600, width - 32));
      else if (width < 1024) setViewportWidth(540);
      else setViewportWidth(600);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const HEIGHT = 90;
  const BARS = 128;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewportWidth * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const analyser = AudioEngine.getInstance().getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : BARS;
    const dataArray = new Uint8Array(bufferLength);

    const barWidth = viewportWidth / BARS;

    const draw = (timestamp: number) => {
      const interval = 1000 / 33;
      if (timestamp - lastFrameRef.current < interval) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = timestamp;

      ctx.clearRect(0, 0, viewportWidth, HEIGHT);
      ctx.fillStyle = 'rgba(26,26,46,0.3)';
      ctx.fillRect(0, 0, viewportWidth, HEIGHT);

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      for (let i = 0; i < BARS; i++) {
        const idx = Math.floor((i / BARS) * Math.min(bufferLength, 96));
        const value = dataArray[idx] || 0;
        const normalized = value / 255;
        const barH = Math.max(1, normalized * (HEIGHT - 4));
        const color = lerpColor(i / (BARS - 1));
        ctx.fillStyle = color;
        const x = i * barWidth;
        const y = HEIGHT - barH;
        const w = Math.max(1, barWidth - 1);
        ctx.fillRect(x, y, w, barH);

        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x, y, w, 1.5);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [viewportWidth]);

  return (
    <div
      style={{
        width: viewportWidth,
        height: HEIGHT,
        background: '#1A1A2E',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #2A2A3E',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: viewportWidth,
          height: HEIGHT,
          display: 'block',
        }}
      />
    </div>
  );
};
