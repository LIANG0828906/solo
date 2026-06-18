import React, { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';

export const SpectrumPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frequencies = useAudioStore((state) => state.frequencies);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const barCount = 64;
    const barWidth = 4;
    const barGap = (rect.width - barCount * barWidth) / (barCount + 1);
    const maxHeight = rect.height - 16;

    for (let i = 0; i < barCount; i++) {
      const value = frequencies[i] || 0;
      const height = value * maxHeight;
      const x = barGap + i * (barWidth + barGap);
      const y = rect.height - 8 - height;

      const gradient = ctx.createLinearGradient(0, rect.height - 8, 0, y);
      gradient.addColorStop(0, '#E53935');
      gradient.addColorStop(1, '#1E88E5');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, height, 2);
      ctx.fill();
    }
  }, [frequencies]);

  return (
    <div className="spectrum-panel">
      <div className="spectrum-panel-header">
        <span className="spectrum-title">频谱</span>
      </div>
      <canvas ref={canvasRef} className="spectrum-canvas" />
    </div>
  );
};
