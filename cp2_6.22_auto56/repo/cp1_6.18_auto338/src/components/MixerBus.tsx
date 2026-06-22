import React, { useEffect, useRef } from 'react';
import type { Track } from '../store/audioStore';

interface MixerBusProps {
  tracks: Track[];
  rmsLevels: Record<string, number>;
  peakLevels: Record<string, number>;
  peakHoldValues: Record<string, number>;
}

const MixerBus: React.FC<MixerBusProps> = ({
  tracks,
  rmsLevels,
  peakLevels,
  peakHoldValues
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1A1A2E');
      gradient.addColorStop(1, '#16213E');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const barCount = tracks.length;
      if (barCount === 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const barWidth = Math.min(40, (width - 60) / barCount - 12);
      const totalBarsWidth = barCount * barWidth + (barCount - 1) * 12;
      const startX = (width - totalBarsWidth) / 2;
      const barMaxHeight = height - 40;

      tracks.forEach((track, index) => {
        const x = startX + index * (barWidth + 12);
        const rms = rmsLevels[track.id] || 0;
        const peakHold = peakHoldValues[track.id] || 0;

        const barHeight = Math.min(rms * barMaxHeight, barMaxHeight);
        const peakHoldHeight = Math.min(peakHold * barMaxHeight, barMaxHeight);

        ctx.fillStyle = '#2A2A3E';
        ctx.fillRect(x, 15, barWidth, barMaxHeight);

        if (barHeight > 0) {
          const barGradient = ctx.createLinearGradient(0, height - 25 - barHeight, 0, height - 25);
          barGradient.addColorStop(0, '#FF1744');
          barGradient.addColorStop(0.5, '#FFEB3B');
          barGradient.addColorStop(1, '#00E676');

          ctx.fillStyle = barGradient;
          ctx.fillRect(x, height - 25 - barHeight, barWidth, barHeight);
        }

        if (peakHoldHeight > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, height - 25 - peakHoldHeight, barWidth, 2);
        }

        ctx.fillStyle = track.color;
        ctx.fillRect(x - 2, height - 20, barWidth + 4, 14);

        ctx.fillStyle = '#121212';
        ctx.font = 'bold 10px Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(track.title.substring(0, 6), x + barWidth / 2, height - 10);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [tracks, rmsLevels, peakLevels, peakHoldValues]);

  return (
    <div className="mixer-bus-container">
      <h2 className="mixer-title">混音总线</h2>
      <canvas ref={canvasRef} className="meter-canvas" />

      <style>{`
        .mixer-bus-container {
          background: linear-gradient(180deg, #1A1A2E 0%, #16213E 100%);
          border-radius: 8px;
          padding: 12px 16px;
          border: 1px solid #333333;
        }

        .mixer-title {
          font-size: 12px;
          font-weight: 500;
          color: #888888;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meter-canvas {
          width: 100%;
          height: 100px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
};

export default MixerBus;
