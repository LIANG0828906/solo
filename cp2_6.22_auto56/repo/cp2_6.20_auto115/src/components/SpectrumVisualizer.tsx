import React, { useRef, useEffect, useCallback } from 'react';
import { useAudioEngine } from './AudioEngine';
import { indexToFrequency, frequencyToColor } from '../utils/audioUtils';

const SpectrumVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { spectrumData, playTone, audioContext } = useAudioEngine();
  const animationRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(performance.now());
  const totalBarsRef = useRef<number>(0);
  const barHeightsRef = useRef<number[]>([]);

  const BAR_WIDTH = 4;
  const BAR_SPACING = 1;
  const MIN_FREQ = 20;
  const MAX_FREQ = 20000;
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = x * scaleX;
      const canvasY = y * scaleY;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.width / dpr;
      const displayHeight = canvas.height / dpr;

      const barTotalWidth = BAR_WIDTH + BAR_SPACING;
      const barIndex = Math.floor(canvasX / (barTotalWidth * dpr));
      const totalBars = totalBarsRef.current;

      if (barIndex >= 0 && barIndex < totalBars) {
        const barX = barIndex * barTotalWidth;
        const barHeight = barHeightsRef.current[barIndex] || 0;
        const barY = displayHeight - barHeight;

        const withinBarX = canvasX >= barX * dpr && canvasX < (barX + BAR_WIDTH) * dpr;
        const withinBarY = canvasY >= barY * dpr && canvasY <= displayHeight * dpr;

        if (withinBarX && withinBarY && barHeight > 0) {
          const frequency = indexToFrequency(barIndex, totalBars, MIN_FREQ, MAX_FREQ);
          playTone(frequency);
        }
      }
    },
    [playTone]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = container.clientWidth * dpr;
        canvas.height = 300 * dpr;
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = (timestamp: number) => {
      const elapsed = timestamp - lastRenderTimeRef.current;

      if (elapsed >= FRAME_INTERVAL) {
        lastRenderTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);

        const displayWidth = canvas.width / (window.devicePixelRatio || 1);
        const displayHeight = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        const barTotalWidth = BAR_WIDTH + BAR_SPACING;
        const totalBars = Math.floor(displayWidth / barTotalWidth);
        totalBarsRef.current = totalBars;
        if (barHeightsRef.current.length !== totalBars) {
          barHeightsRef.current = new Array(totalBars).fill(0);
        }

        const gradient = ctx.createLinearGradient(0, displayHeight, 0, 0);
        gradient.addColorStop(0, 'rgba(30, 144, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(30, 144, 255, 0.02)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        const fftSize = 2048;
        const nyquist = (audioContext?.sampleRate || 44100) / 2;

        for (let i = 0; i < totalBars; i++) {
          const freq = indexToFrequency(i, totalBars, MIN_FREQ, MAX_FREQ);
          const fftIndex = Math.floor((freq / nyquist) * (fftSize / 2));
          const clampedIndex = Math.min(fftIndex, spectrumData.length - 1);

          let magnitude = spectrumData[clampedIndex] || 0;

          if (clampedIndex > 0) {
            const prevMag = spectrumData[clampedIndex - 1] || 0;
            const nextMag = spectrumData[Math.min(clampedIndex + 1, spectrumData.length - 1)] || 0;
            magnitude = (prevMag + magnitude + nextMag) / 3;
          }

          const normalizedValue = magnitude / 255;
          const barHeight = Math.max(2, normalizedValue * (displayHeight - 20));
          barHeightsRef.current[i] = barHeight;
          const x = i * barTotalWidth;
          const y = displayHeight - barHeight;

          const color = frequencyToColor(freq, MIN_FREQ, MAX_FREQ);

          ctx.fillStyle = color;
          ctx.fillRect(x, y, BAR_WIDTH, barHeight);

          const glowGradient = ctx.createLinearGradient(x, y, x, displayHeight);
          glowGradient.addColorStop(0, color);
          glowGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGradient;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x, y, BAR_WIDTH, barHeight);
          ctx.globalAlpha = 1;
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          const y = (displayHeight / 4) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(displayWidth, y);
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [spectrumData, audioContext]);

  return (
    <div className="spectrum-container">
      <div className="spectrum-header">
        <span className="spectrum-title">频谱可视化</span>
        <div className="spectrum-legend">
          <div className="legend-item">
            <span className="legend-dot low"></span>
            <span>低音 (20-250Hz)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot mid"></span>
            <span>中音 (250Hz-4kHz)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot high"></span>
            <span>高音 (4kHz-20kHz)</span>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="spectrum-canvas"
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default SpectrumVisualizer;
