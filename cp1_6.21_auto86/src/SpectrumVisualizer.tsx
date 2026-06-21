import React, { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store/useStore';
import type { SpectrumData } from './api';

const SpectrumVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const spectrumDataRef = useRef<number[]>(new Array(256).fill(0));
  const waterfallDataRef = useRef<number[][]>([]);
  const { isPlaying } = useStore();

  const WATERFALL_HEIGHT = 200;

  const handleSpectrumData = useCallback((data: SpectrumData) => {
    spectrumDataRef.current = data.magnitudes;
  }, []);

  const interpolateColor = useCallback(
    (value: number): string => {
      const startHue = 200;
      const endHue = 270;
      const hue = startHue + (endHue - startHue) * value;
      const saturation = 80 + value * 20;
      const lightness = 30 + value * 40;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
    []
  );

  const drawSpectrum = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const spectrumHeight = height - WATERFALL_HEIGHT - 20;

    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(0, 0, width, height);

    const spectrumData = spectrumDataRef.current;
    const barCount = Math.min(128, spectrumData.length);
    const barWidth = width / barCount;
    const gap = 2;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * spectrumData.length);
      const magnitude = spectrumData[dataIndex] || 0;
      const barHeight = magnitude * spectrumHeight;
      const x = i * barWidth;
      const y = WATERFALL_HEIGHT + 20 + (spectrumHeight - barHeight);

      const gradient = ctx.createLinearGradient(0, y, 0, WATERFALL_HEIGHT + 20 + spectrumHeight);
      gradient.addColorStop(0, interpolateColor(magnitude));
      gradient.addColorStop(1, interpolateColor(magnitude * 0.5));

      ctx.fillStyle = gradient;
      ctx.fillRect(x + gap / 2, y, barWidth - gap, barHeight);

      ctx.fillStyle = interpolateColor(Math.min(1, magnitude + 0.2));
      ctx.fillRect(x + gap / 2, y - 4, barWidth - gap, 4);
    }

    if (isPlaying) {
      const currentRow = spectrumData.slice(0, 128);
      waterfallDataRef.current.unshift(currentRow);
      if (waterfallDataRef.current.length > WATERFALL_HEIGHT) {
        waterfallDataRef.current.pop();
      }
    }

    for (let y = 0; y < waterfallDataRef.current.length; y++) {
      const row = waterfallDataRef.current[y];
      for (let x = 0; x < row.length; x++) {
        const magnitude = row[x];
        if (magnitude > 0.01) {
          const pixelX = (x / row.length) * width;
          const pixelWidth = width / row.length;
          ctx.fillStyle = interpolateColor(magnitude);
          ctx.globalAlpha = magnitude * 0.8;
          ctx.fillRect(pixelX, y, pixelWidth, 1);
        }
      }
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = WATERFALL_HEIGHT + 20 + (spectrumHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '10px var(--font-body)';
    ctx.textAlign = 'left';
    const freqLabels = ['60Hz', '250Hz', '1kHz', '4kHz', '16kHz'];
    freqLabels.forEach((label, i) => {
      const x = (i / (freqLabels.length - 1)) * width;
      ctx.fillText(label, x + 4, height - 4);
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px var(--font-display)';
    ctx.fontWeight = '600';
    ctx.fillText('频谱瀑布图', 12, 24);
    ctx.fillText('实时频谱', 12, WATERFALL_HEIGHT + 40);

    animationRef.current = requestAnimationFrame(drawSpectrum);
  }, [interpolateColor, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      let frame = 0;
      const generateData = () => {
        if (!isPlaying) return;

        const newData = new Array(256).fill(0).map((_, i) => {
          const base = Math.sin((i / 256) * Math.PI * 2 + frame * 0.05) * 0.3;
          const noise = Math.random() * 0.2;
          const peak =
            i > 20 && i < 80
              ? Math.sin((i - 50) * 0.1 + frame * 0.1) * 0.5
              : 0;
          return Math.max(0, Math.min(1, 0.2 + base + noise + peak));
        });

        handleSpectrumData({
          timestamp: Date.now(),
          frequencies: newData.map((_, i) => i),
          magnitudes: newData,
        });

        frame++;
        setTimeout(generateData, 1000 / 30);
      };
      generateData();
    } else {
      const fadeOut = () => {
        spectrumDataRef.current = spectrumDataRef.current.map((v) => v * 0.95);
        if (spectrumDataRef.current.some((v) => v > 0.01)) {
          setTimeout(fadeOut, 1000 / 30);
        }
      };
      fadeOut();
    }
  }, [isPlaying, handleSpectrumData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    animationRef.current = requestAnimationFrame(drawSpectrum);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [drawSpectrum]);

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          音频可视化
        </h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            }`}
          />
          <span className="text-sm text-[var(--text-secondary)]">
            {isPlaying ? '正在采集' : '待机'}
          </span>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-[var(--border-color)]">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            background: '#1E1E1E',
            width: '100%',
            height: '400px',
            minHeight: '400px',
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">
            采样率
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--accent-primary)]">
            44.1
            <span className="text-sm text-[var(--text-secondary)]"> kHz</span>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">
            刷新率
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--success)]">
            30
            <span className="text-sm text-[var(--text-secondary)]"> fps</span>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1">
            频段数
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--warning)]">
            256
            <span className="text-sm text-[var(--text-secondary)]"> bins</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpectrumVisualizer;
