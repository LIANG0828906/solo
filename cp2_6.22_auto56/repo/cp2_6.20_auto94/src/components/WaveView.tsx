import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore } from '../modules/state/store';
import { WaveformGenerator } from '../modules/waveform/WaveformGenerator';

export const WaveView: React.FC = () => {
  const tracks = useAppStore((s) => s.tracks);
  const currentTime = useAppStore((s) => s.currentTime);
  const duration = useAppStore((s) => s.duration);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const trackCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null]);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; freq: string; amp: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const drawWaveform = useCallback((
    canvas: HTMLCanvasElement,
    buffer: Float32Array,
    color: string,
    w: number,
    h: number
  ) => {
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (buffer.length === 0) return;

    const step = Math.ceil(buffer.length / w);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();

    for (let x = 0; x < w; x++) {
      const idx = Math.floor((x / w) * buffer.length);
      let min = 1, max = -1;
      for (let j = 0; j < step && idx + j < buffer.length; j++) {
        const val = buffer[idx + j];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      const yMin = ((1 - max) / 2) * h;
      const yMax = ((1 - min) / 2) * h;
      if (x === 0) {
        ctx.moveTo(x, (yMin + yMax) / 2);
      } else {
        ctx.lineTo(x, (yMin + yMax) / 2);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    let running = true;
    const render = () => {
      if (!running) return;

      tracks.forEach((track, i) => {
        const canvas = trackCanvasRefs.current[i];
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        if (w <= 0 || h <= 0) return;
        const buffer = track.muted
          ? new Float32Array(WaveformGenerator.SAMPLE_RATE * WaveformGenerator.DURATION)
          : WaveformGenerator.generateTrackBuffer(track);
        drawWaveform(canvas, buffer, track.color, w, h);
      });

      const mainCanvas = mainCanvasRef.current;
      if (mainCanvas) {
        const rect = mainCanvas.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        if (w > 0 && h > 0) {
          const mixed = WaveformGenerator.mixTracks(tracks);
          drawWaveform(mainCanvas, mixed, '#e0e0e0', w, h);

          if (isPlaying && duration > 0) {
            const progress = currentTime / duration;
            const ctx = mainCanvas.getContext('2d')!;
            const dpr = window.devicePixelRatio || 1;
            ctx.save();
            ctx.scale(dpr, dpr);
            const px = progress * w;
            const gradient = ctx.createLinearGradient(px - 2, 0, px + 2, 0);
            gradient.addColorStop(0, '#6c5ce7');
            gradient.addColorStop(1, '#a29bfe');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#6c5ce7';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [tracks, drawWaveform, currentTime, duration, isPlaying]);

  const handleMainMouseMove = (e: React.MouseEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const mixed = WaveformGenerator.mixTracks(tracks);
    const idx = Math.floor((x / w) * mixed.length);
    if (idx >= 0 && idx < mixed.length) {
      const samplePos = idx / WaveformGenerator.SAMPLE_RATE;
      const amp = mixed[idx];
      const dominantFreq = tracks.length > 0 ? tracks[0].frequency : 0;
      setTooltip({ x: e.clientX, y: e.clientY, freq: `${dominantFreq.toFixed(1)}Hz`, amp: amp.toFixed(4) });
    }
  };

  const handleMainMouseLeave = () => setTooltip(null);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4, padding: 4 }}>
      <div style={{ display: 'flex', gap: 4, height: '35%' }}>
        {tracks.map((track, i) => (
          <div key={track.id} style={{ flex: 1, position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
            <canvas
              ref={(el) => { trackCanvasRefs.current[i] = el; }}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
            <div style={{
              position: 'absolute', top: 4, left: 6, fontSize: 9, color: track.color,
              textShadow: `0 0 4px ${track.color}`,
              pointerEvents: 'none',
            }}>
              {track.name} ({track.waveType} {track.frequency}Hz)
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
        <canvas
          ref={mainCanvasRef}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMainMouseMove}
          onMouseLeave={handleMainMouseLeave}
        />
        <div style={{
          position: 'absolute', top: 4, left: 6, fontSize: 10, color: '#e0e0e0',
          textShadow: '0 0 4px rgba(255,255,255,0.3)', pointerEvents: 'none',
        }}>
          Mixed Output
        </div>
        {tooltip && (
          <div style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y - 28,
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            pointerEvents: 'none',
            zIndex: 100,
            whiteSpace: 'nowrap',
          }}>
            {tooltip.freq} / Amp: {tooltip.amp}
          </div>
        )}
      </div>
    </div>
  );
};
