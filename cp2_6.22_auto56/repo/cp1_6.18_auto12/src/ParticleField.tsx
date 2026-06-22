import React, { useEffect, useRef } from 'react';
import { Emotion, Particle } from './types';

interface ParticleFieldProps {
  emotions: Emotion[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function blendColors(colorA: string, colorB: string, ratio: number = 0.5): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return rgbToHex(a.r * ratio + b.r * (1 - ratio), a.g * ratio + b.g * (1 - ratio), a.b * ratio + b.b * (1 - ratio));
}

const ParticleField: React.FC<ParticleFieldProps> = ({ emotions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const targetCountRef = useRef<number>(300);
  const emotionsRef = useRef<Emotion[]>(emotions);
  const animFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    emotionsRef.current = emotions;
    const totalIntensity = emotions.reduce((s, e) => s + e.intensity, 0) || 1;
    const count = Math.round(300 + (totalIntensity / 15) * 500);
    targetCountRef.current = Math.max(300, Math.min(800, count));
  }, [emotions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(dpr, dpr);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const createParticle = (emotion: Emotion, width: number, height: number): Particle => {
      const intensityFactor = emotion.intensity / 5;
      const baseSpeed = 1.2 + intensityFactor * 1.6;
      return {
        x: Math.random() * width,
        y: height - 10 + Math.random() * 10,
        vx: 0,
        vy: baseSpeed * (0.7 + Math.random() * 0.6),
        size: 6 + Math.random() * 8,
        baseSize: 6 + Math.random() * 8,
        color: emotion.color,
        emotion: emotion.name,
        opacity: 0.6 + intensityFactor * 0.4,
        phase: Math.random() * Math.PI * 2,
        sineAmp: 0.3,
        sineFreq: 0.02 + Math.random() * 0.03,
        isFused: false,
        fuseLife: 0,
        fuseMaxLife: 0,
        fading: false,
      };
    };

    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.67, 2);
      lastTime = time;

      const rect = container.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      const currentEmotions = emotionsRef.current;
      const targetCount = targetCountRef.current;
      const particles = particlesRef.current;

      const diff = targetCount - particles.length;
      const changePerFrame = 20;

      if (diff > 0) {
        const toAdd = Math.min(diff, changePerFrame);
        const totalIntensity = currentEmotions.reduce((s, e) => s + e.intensity, 0) || 1;
        for (let i = 0; i < toAdd; i++) {
          let rand = Math.random() * totalIntensity;
          let chosen = currentEmotions[0];
          for (const e of currentEmotions) {
            if (rand < e.intensity) {
              chosen = e;
              break;
            }
            rand -= e.intensity;
          }
          particles.push(createParticle(chosen, W, H));
        }
      } else if (diff < 0) {
        const toRemove = Math.min(-diff, changePerFrame);
        particles.splice(0, toRemove);
      }

      ctx.clearRect(0, 0, W, H);

      const glowGrad = ctx.createLinearGradient(0, H, 0, H - 120);
      glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, H - 120, W, 120);

      const gridCell = 60;
      const cols = Math.ceil(W / gridCell) + 1;
      const grid: number[][] = [];
      for (let i = 0; i < cols * Math.ceil(H / gridCell); i++) grid.push([]);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += p.sineFreq * dt;
        p.x += Math.sin(p.phase) * p.sineAmp * dt;
        p.y -= p.vy * dt;

        if (p.isFused) {
          p.fuseLife -= dt / 60;
          if (p.fuseLife <= 0) {
            p.fading = true;
          }
          if (p.fading) {
            p.size -= 0.5 * dt;
            p.opacity -= 0.015 * dt;
          }
        }

        if (p.y < -20 || p.size <= 0 || p.opacity <= 0) {
          const totalIntensity = currentEmotions.reduce((s, e) => s + e.intensity, 0) || 1;
          let rand = Math.random() * totalIntensity;
          let chosen = currentEmotions[0];
          for (const e of currentEmotions) {
            if (rand < e.intensity) {
              chosen = e;
              break;
            }
            rand -= e.intensity;
          }
          Object.assign(p, createParticle(chosen, W, H));
        }

        const gx = Math.max(0, Math.min(Math.floor(p.x / gridCell), cols - 1));
        const gy = Math.max(0, Math.floor(p.y / gridCell));
        const idx = gy * cols + gx;
        if (grid[idx]) grid[idx].push(i);
      }

      const fusedToAdd: Particle[] = [];
      const checked = new Set<string>();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const gx = Math.max(0, Math.min(Math.floor(p.x / gridCell), cols - 1));
        const gy = Math.max(0, Math.floor(p.y / gridCell));

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const cx = gx + dx;
            const cy = gy + dy;
            if (cx < 0 || cy < 0 || cx >= cols) continue;
            const cell = grid[cy * cols + cx];
            if (!cell) continue;
            for (const j of cell) {
              if (j <= i) continue;
              const key = Math.min(i, j) + '_' + Math.max(i, j);
              if (checked.has(key)) continue;
              checked.add(key);
              const q = particles[j];
              if (p.isFused || q.isFused) continue;
              const ddx = p.x - q.x;
              const ddy = p.y - q.y;
              const dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (dist < 30 && p.color !== q.color) {
                const newColor = blendColors(p.color, q.color, 0.5);
                const life = 8 + Math.random() * 4;
                fusedToAdd.push({
                  x: (p.x + q.x) / 2,
                  y: (p.y + q.y) / 2,
                  vx: 0,
                  vy: (p.vy + q.vy) / 2,
                  size: (p.size + q.size) / 2 + 2,
                  baseSize: (p.baseSize + q.baseSize) / 2 + 2,
                  color: newColor,
                  emotion: p.emotion,
                  opacity: (p.opacity + q.opacity) / 2,
                  phase: (p.phase + q.phase) / 2,
                  sineAmp: 0.3,
                  sineFreq: (p.sineFreq + q.sineFreq) / 2,
                  isFused: true,
                  fuseLife: life,
                  fuseMaxLife: life,
                  fading: false,
                });
              }
            }
          }
        }
      }

      for (const fp of fusedToAdd) {
        if (particles.length < targetCountRef.current + 100) {
          particles.push(fp);
        }
      }

      for (const p of particles) {
        const rgb = hexToRgb(p.color);
        const glowSize = p.size * 2;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity})`);
        gradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#111118',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '400px',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default ParticleField;
