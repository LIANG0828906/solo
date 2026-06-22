import { useEffect, useRef } from 'react';
import { TrackType, TRACK_COLORS, WaveformType } from '../types';

interface WaveformCanvasProps {
  track: TrackType;
  waveform: WaveformType;
  enabled: boolean;
  active: boolean;
  beatCount?: number;
  height?: number;
}

export function WaveformCanvas({
  track,
  waveform,
  enabled,
  active,
  beatCount = 0,
  height = 32,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);
  const pulseRef = useRef(0);

  useEffect(() => {
    if (active) {
      pulseRef.current = 1;
    }
  }, [active, beatCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const color = TRACK_COLORS[track];
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const mid = h / 2;

      ctx.clearRect(0, 0, w, h);

      const amplitude = enabled ? (h * 0.35) * (0.6 + pulseRef.current * 0.4) : h * 0.1;
      const cycles = 2.5;
      const totalPoints = Math.floor(w * 0.9);

      ctx.beginPath();
      ctx.strokeStyle = enabled ? color : '#535C68';
      ctx.globalAlpha = enabled ? 0.5 : 0.3;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      for (let i = 0; i <= totalPoints; i++) {
        const x = (i / totalPoints) * w + w * 0.05;
        const t = (i / totalPoints) * cycles * Math.PI * 2 + phaseRef.current;
        let y: number;

        switch (waveform) {
          case 'sine':
            y = Math.sin(t) * amplitude;
            break;
          case 'sawtooth':
            y = ((((t / (Math.PI * 2)) % 1) + 1) % 1) * 2 - 1;
            y *= amplitude;
            break;
          case 'square':
            y = Math.sin(t) >= 0 ? amplitude : -amplitude;
            break;
          case 'triangle': {
            const normalized = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const value = normalized / (Math.PI * 2);
            y = (value < 0.5 ? 4 * value - 1 : 3 - 4 * value) * amplitude;
            break;
          }
          default:
            y = Math.sin(t) * amplitude;
        }

        if (i === 0) {
          ctx.moveTo(x, mid + y);
        } else {
          ctx.lineTo(x, mid + y);
        }
      }

      ctx.stroke();
      ctx.globalAlpha = 1;

      phaseRef.current += enabled ? 0.06 : 0.015;
      pulseRef.current *= 0.92;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [track, waveform, enabled, color]);

  return (
    <canvas
      ref={canvasRef}
      className="waveform-canvas"
      style={{ height: `${height}px` }}
    />
  );
}
