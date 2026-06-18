import React, { useRef, useEffect, useCallback } from 'react';
import { useAudioStore } from '../store/audioStore';
import { getFrequencyDistribution } from '../utils/audioAnalyzer';
import {
  Particle,
  updateParticle,
  manageParticles,
  createParticle,
} from '../utils/particleEngine';

export const Visualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastBeatTimeRef = useRef<number>(0);
  const beatPulseRef = useRef<number>(0);
  const { bpm, isPlaying, fileName, duration, currentTime } = useAudioStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analysis = (window as any).__audioAnalysis;
    let freqLow = 0, freqMid = 0, freqHigh = 0;

    if (analysis?.analyser && isPlaying) {
      const dist = getFrequencyDistribution(analysis.analyser);
      freqLow = dist.low;
      freqMid = dist.mid;
      freqHigh = dist.high;
      useAudioStore.getState().setFrequencyData(dist.raw);
    }

    const now = performance.now();
    if (bpm > 0) {
      const beatInterval = 60000 / bpm;
      if (now - lastBeatTimeRef.current > beatInterval) {
        lastBeatTimeRef.current = now;
        beatPulseRef.current = 1;
      }
    }
    beatPulseRef.current = Math.max(0, beatPulseRef.current - 0.03);

    particlesRef.current = manageParticles(
      particlesRef.current,
      freqLow,
      freqMid,
      freqHigh,
      canvas.width,
      canvas.height
    );

    ctx.fillStyle = 'rgba(26, 26, 46, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const p of particlesRef.current) {
      const freqIntensity = p.band === 'low' ? freqLow : p.band === 'mid' ? freqMid : freqHigh;
      updateParticle(p, beatPulseRef.current, freqIntensity, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      if (p.radius > 4) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
        const glowHue = (p.baseHue + p.hueOffset) % 360;
        ctx.fillStyle = `hsla(${glowHue}, 80%, 55%, ${p.opacity * 0.15})`;
        ctx.fill();
      }
    }

    ctx.save();
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(`BPM: ${bpm > 0 ? bpm : '--'}`, 16, 32);
    ctx.fillText(`Time: ${formatTime(currentTime)}`, 16, 60);
    ctx.restore();

    if (fileName) {
      ctx.save();
      ctx.font = '14px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      const display = duration > 0
        ? `${fileName} (${formatTime(currentTime)} / ${formatTime(duration)})`
        : fileName;
      ctx.fillText(display, 16, 88);
      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [bpm, isPlaying, fileName, duration, currentTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
