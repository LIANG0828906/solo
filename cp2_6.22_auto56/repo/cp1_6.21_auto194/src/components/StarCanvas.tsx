import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditor } from '../context/EditorContext';
import { Particle, Theme } from '../types';
import {
  PARTICLE_COUNT,
  PARTICLE_LAYERS,
  SPREAD_CONFIG,
  COLOR_CYCLE_SPEED,
  DARK_COLORS,
  LIGHT_COLORS,
} from '../constants';
import { lerpColor, rgbToString, distance } from '../utils/exportUtils';

interface SpreadWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  intensity: number;
  startTime: number;
  duration: number;
}

const StarCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const spreadWavesRef = useRef<SpreadWave[]>([]);
  const animationFrameRef = useRef<number>(0);
  const globalColorPhaseRef = useRef(0);
  const lastKeystrokeTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { stats, theme } = useEditor();
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  const createParticle = useCallback((w: number, h: number, index: number): Particle => {
    const rand = Math.random();
    let layer: 'far' | 'mid' | 'near';
    if (rand < 0.5) layer = 'far';
    else if (rand < 0.85) layer = 'mid';
    else layer = 'near';

    const layerConfig = PARTICLE_LAYERS[layer];
    const sizeRange = layerConfig.sizeRange;
    const speedRange = layerConfig.speedRange;
    const baseSize = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);

    return {
      x: Math.random() * w,
      y: Math.random() * h,
      baseY: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.05,
      vy: speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]),
      size: baseSize,
      baseSize,
      opacity: layerConfig.opacity,
      baseOpacity: layerConfig.opacity,
      layer,
      colorPhase: Math.random() * Math.PI * 2,
      spreadIntensity: 0,
      spreadOriginX: 0,
      spreadOriginY: 0,
    };
  }, []);

  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(w, h, i));
    }
    particlesRef.current = particles;
  }, [createParticle]);

  const addSpreadWave = useCallback((x: number, y: number, intensity: number) => {
    const now = performance.now();
    const interval = now - lastKeystrokeTimeRef.current;
    let finalIntensity = intensity;
    if (interval < SPREAD_CONFIG.fastInterval) {
      finalIntensity *= SPREAD_CONFIG.fastMultiplier;
    }
    lastKeystrokeTimeRef.current = now;

    const maxRadius = SPREAD_CONFIG.baseRadius * (1 + finalIntensity * 0.5);
    spreadWavesRef.current.push({
      x,
      y,
      radius: 0,
      maxRadius,
      intensity: finalIntensity,
      startTime: now,
      duration: SPREAD_CONFIG.intensityDuration,
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDims({ w, h });
      initParticles(w, h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initParticles]);

  useEffect(() => {
    if (stats.lastKeystrokeTime === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const editorX = rect.width / 2;
    const editorY = rect.height / 2;
    const intensity = stats.keystrokeCount > 0 ? 1 : 0;
    addSpreadWave(editorX, editorY, intensity);
  }, [stats.lastKeystrokeTime, addSpreadWave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.w * dpr;
    canvas.height = dims.h * dpr;
    ctx.scale(dpr, dpr);

    if (particlesRef.current.length === 0) {
      initParticles(dims.w, dims.h);
    }

    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimeAccum = 0;

    const render = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      frameCount++;
      fpsTimeAccum += dt;

      if (fpsTimeAccum >= 3000) {
        const currentFps = (frameCount * 1000) / fpsTimeAccum;
        if (currentFps < 50 && PARTICLE_COUNT > 150) {
          particlesRef.current = particlesRef.current.slice(0, 150);
        }
        frameCount = 0;
        fpsTimeAccum = 0;
      }

      globalColorPhaseRef.current = (globalColorPhaseRef.current + COLOR_CYCLE_SPEED * dt) % (Math.PI * 2);
      const globalT = (Math.sin(globalColorPhaseRef.current) + 1) / 2;

      const themeColors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

      ctx.clearRect(0, 0, dims.w, dims.h);

      spreadWavesRef.current = spreadWavesRef.current.filter(wave => {
        const elapsed = now - wave.startTime;
        if (elapsed > wave.duration) return false;
        const progress = elapsed / wave.duration;
        wave.radius = wave.maxRadius * progress;
        return true;
      });

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.baseY += p.vy * (dt / 16);
        if (p.baseY > dims.h + 10) {
          p.baseY = -10;
          p.x = Math.random() * dims.w;
        } else if (p.baseY < -10) {
          p.baseY = dims.h + 10;
          p.x = Math.random() * dims.w;
        }

        p.x += p.vx * (dt / 16);
        p.y = p.baseY;

        let spreadBoost = 0;
        let spreadGlow = 0;
        for (const wave of spreadWavesRef.current) {
          const d = distance(p.x, p.y, wave.x, wave.y);
          if (d < wave.radius + 30) {
            const progress = 1 - Math.abs(d - wave.radius) / (wave.maxRadius + 30);
            const influence = Math.max(0, progress) * wave.intensity;
            spreadBoost += influence * 2;
            spreadGlow += influence;
          }
        }

        p.size = p.baseSize * (1 + spreadBoost * 0.8);
        p.opacity = Math.min(1, p.baseOpacity + spreadGlow * 0.6);

        const particleColorT = (Math.sin(globalColorPhaseRef.current + p.colorPhase) + 1) / 2;
        const rgb = lerpColor(themeColors.particleStart, themeColors.particleEnd, particleColorT);

        if (p.layer === 'near' && spreadGlow > 0.1) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          gradient.addColorStop(0, rgbToString(rgb, p.opacity * 0.8));
          gradient.addColorStop(0.4, rgbToString(rgb, p.opacity * 0.3));
          gradient.addColorStop(1, rgbToString(rgb, 0));
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = rgbToString(rgb, p.opacity);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const wave of spreadWavesRef.current) {
        const elapsed = now - wave.startTime;
        const alpha = Math.max(0, 1 - elapsed / wave.duration) * 0.3 * wave.intensity;
        const rgb = lerpColor(themeColors.particleStart, themeColors.particleEnd, globalT);
        ctx.strokeStyle = rgbToString(rgb, alpha);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [dims, theme, initParticles]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        transition: 'background-color 0.4s ease',
        backgroundColor: theme === 'dark' ? DARK_COLORS.bg : LIGHT_COLORS.bg,
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

export default StarCanvas;
