import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { PoemTheme } from '../poem-module/poemData';

interface Particle {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  vx: number;
  vy: number;
  phase: number;
  layer: number;
  type: number;
}

interface ParticleCanvasProps {
  theme: PoemTheme;
  particleHint: string;
  density: number;
  speed: number;
}

export interface ParticleCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

const THEME_PALETTES: Record<PoemTheme, string[]> = {
  '山水': ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc'],
  '田园': ['#606c38', '#8ea632', '#bc6c25', '#dda15e', '#fefae0', '#a8dadc', '#e9c46a'],
  '边塞': ['#6a040f', '#9d0208', '#d00000', '#e85d04', '#faa307', '#ffba08', '#dc2f02'],
  '咏物': ['#4cc9f0', '#4361ee', '#3a0ca3', '#7209b7', '#b5179e', '#f72585', '#4895ef'],
  '送别': ['#457b9d', '#a8dadc', '#f1faee', '#e63946', '#1d3557', '#ffd166', '#ef476f'],
  '思乡': ['#f4a261', '#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#ffb4a2', '#e5989b']
};

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const generateMountainPoints = (W: number, H: number, layers: number, seed: number): { points: Float32Array; depth: number }[] => {
  const result: { points: Float32Array; depth: number }[] = [];
  for (let l = 0; l < layers; l++) {
    const depth = (l + 1) / layers;
    const numPoints = Math.floor(W / 20) + 10;
    const pts = new Float32Array(numPoints);
    const baseY = H * (0.35 + 0.12 * l);
    const amp = H * (0.22 - 0.03 * l);
    const freq = 0.006 + l * 0.0015;
    let s = seed + l * 137.5;
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * W;
      const noise =
        Math.sin(x * freq + s) * 0.6 +
        Math.sin(x * freq * 2.3 + s * 1.3) * 0.25 +
        Math.sin(x * freq * 5.1 + s * 2.1) * 0.15;
      pts[i] = baseY + noise * amp;
    }
    result.push({ points: pts, depth });
  }
  return result;
};

const ParticleCanvas = forwardRef<ParticleCanvasHandle, ParticleCanvasProps>(function ParticleCanvas(
  { theme, particleHint, density, speed },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const transitionRef = useRef<{ active: boolean; startTime: number }>({ active: false, startTime: 0 });
  const lastTimeRef = useRef<number>(0);
  const themeRef = useRef(theme);
  const hintRef = useRef(particleHint);
  const densityRef = useRef(density);
  const speedRef = useRef(speed);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const timeRef = useRef(0);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }));

  const computeTargets = useCallback((ps: Particle[], W: number, H: number, t: PoemTheme, hint: string) => {
    const palette = THEME_PALETTES[t];
    const seed = hint.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 0.007;
    const rand = (i: number, k: number) => {
      const v = Math.sin(i * 12.9898 + k * 78.233 + seed * 43758.5453) * 43758.5453;
      return v - Math.floor(v);
    };

    const isMountainLike = t === '山水' || hint.includes('mountain') || hint.includes('forest') || hint.includes('bamboo') || hint.includes('gorge') || hint.includes('cliff') || hint.includes('岳');
    const isDesertLike = t === '边塞' || hint.includes('desert') || hint.includes('frontier') || hint.includes('battle') || hint.includes('war') || hint.includes('snow-farewell');
    const isFieldLike = t === '田园' || hint.includes('farm') || hint.includes('village') || hint.includes('spring') || hint.includes('flower') || hint.includes('grassland') || hint.includes('lotus') || hint.includes('duck') || hint.includes('new-year');
    const isWaterLike = hint.includes('waterfall') || hint.includes('river') || hint.includes('lake') || hint.includes('sea') || hint.includes('lotus') || hint.includes('jiangnan');
    const isNightLike = hint.includes('moon') || hint.includes('night') || hint.includes('heaven');

    if (isMountainLike) {
      const layers = 4;
      const mps = generateMountainPoints(W, H, layers, seed);
      for (let i = 0; i < ps.length; i++) {
        const r = rand(i, 1);
        const li = Math.min(Math.floor(r * layers), layers - 1);
        const { points, depth } = mps[li];
        const px = rand(i, 2) * W;
        const idx = (px / W) * (points.length - 1);
        const i0 = Math.floor(idx);
        const i1 = Math.min(i0 + 1, points.length - 1);
        const ft = idx - i0;
        const baseY = lerp(points[i0], points[i1], ft);
        const above = rand(i, 3);
        const py = baseY - above * H * 0.35 * (1 - depth * 0.7);
        ps[i].targetX = px + (rand(i, 4) - 0.5) * 20;
        ps[i].targetY = py;
        ps[i].layer = li;
        const ci = Math.min(Math.floor(depth * palette.length * 0.9), palette.length - 1);
        ps[i].color = palette[ci];
        ps[i].baseAlpha = 0.4 + depth * 0.55;
        ps[i].size = 1.2 + (1 - depth) * 3.5 + rand(i, 5) * 1.5;
        ps[i].type = 0;
        ps[i].phase = rand(i, 6) * Math.PI * 2;
      }
      return;
    }

    if (isDesertLike) {
      for (let i = 0; i < ps.length; i++) {
        const r = rand(i, 1);
        if (r < 0.15) {
          const bx = W * (0.35 + rand(i, 7) * 0.3);
          const by = H * (0.55 + rand(i, 8) * 0.08);
          const bw = W * 0.06;
          const bh = H * 0.18;
          const ang = rand(i, 9);
          if (ang < 0.4) {
            ps[i].targetX = bx + (rand(i, 10) - 0.5) * bw;
            ps[i].targetY = by - rand(i, 11) * bh * 0.3;
            ps[i].layer = 3;
          } else if (ang < 0.8) {
            ps[i].targetX = bx + (rand(i, 10) < 0.5 ? -1 : 1) * (bw * 0.5 + rand(i, 12) * bw * 0.4);
            ps[i].targetY = by + rand(i, 13) * bh;
            ps[i].layer = 3;
          } else {
            ps[i].targetX = bx + (rand(i, 10) - 0.5) * bw * 0.6;
            ps[i].targetY = by - bh - rand(i, 14) * bh * 0.3;
            ps[i].layer = 3;
          }
          ps[i].color = palette[2];
          ps[i].baseAlpha = 0.95;
          ps[i].size = 1.8 + rand(i, 15) * 1.4;
          ps[i].type = 2;
          ps[i].phase = rand(i, 16) * Math.PI * 2;
          continue;
        }
        if (r < 0.3) {
          const fx = rand(i, 17) * W;
          const fy = H * (0.3 + rand(i, 18) * 0.25);
          ps[i].targetX = fx;
          ps[i].targetY = fy - rand(i, 19) * 120;
          ps[i].layer = 5;
          ps[i].color = palette[5];
          ps[i].baseAlpha = 0.3 + rand(i, 20) * 0.4;
          ps[i].size = 1 + rand(i, 21) * 1.8;
          ps[i].type = 3;
          ps[i].phase = rand(i, 22) * Math.PI * 2;
          continue;
        }
        const depth = 0.3 + rand(i, 2) * 0.7;
        const px = rand(i, 3) * W;
        const baseY = H * (0.75 + depth * 0.05);
        const amp = H * (0.05 + (1 - depth) * 0.08);
        const py = baseY - Math.sin(px * 0.008 + seed * 5 + depth * 3) * amp - rand(i, 4) * H * 0.08;
        ps[i].targetX = px;
        ps[i].targetY = py;
        ps[i].layer = Math.floor(depth * 3);
        const ci = Math.min(Math.floor(depth * palette.length * 0.6), palette.length - 1);
        ps[i].color = palette[ci];
        ps[i].baseAlpha = 0.5 + depth * 0.45;
        ps[i].size = 1 + (1 - depth) * 3 + rand(i, 5) * 1.2;
        ps[i].type = 1;
        ps[i].phase = rand(i, 6) * Math.PI * 2;
      }
      return;
    }

    if (isFieldLike) {
      for (let i = 0; i < ps.length; i++) {
        const r = rand(i, 1);
        if (r < 0.25) {
          ps[i].targetX = rand(i, 7) * W;
          ps[i].targetY = H * (0.72 + rand(i, 8) * 0.22);
          ps[i].layer = 2;
          const ci = rand(i, 9) < 0.5 ? 3 : 5;
          ps[i].color = palette[Math.min(ci, palette.length - 1)];
          ps[i].baseAlpha = 0.85;
          ps[i].size = 1.5 + rand(i, 10) * 2.2;
          ps[i].type = 4;
          ps[i].phase = rand(i, 11) * Math.PI * 2;
          continue;
        }
        const row = Math.floor(rand(i, 2) * 5);
        const rowY = H * (0.45 + row * 0.11);
        const px = (rand(i, 3) + (row % 2) * 0.5) % 1 * W;
        const py = rowY + (rand(i, 4) - 0.5) * H * 0.05;
        const depth = row / 5;
        ps[i].targetX = px;
        ps[i].targetY = py;
        ps[i].layer = row;
        const ci = Math.min(Math.floor((1 - depth) * palette.length * 0.7), palette.length - 1);
        ps[i].color = palette[ci];
        ps[i].baseAlpha = 0.55 + depth * 0.4;
        ps[i].size = 1 + (1 - depth) * 2.5 + rand(i, 5) * 1.2;
        ps[i].type = 5;
        ps[i].phase = rand(i, 6) * Math.PI * 2;
      }
      return;
    }

    if (isWaterLike) {
      for (let i = 0; i < ps.length; i++) {
        const r = rand(i, 1);
        if (r < 0.35) {
          ps[i].targetX = rand(i, 7) * W;
          ps[i].targetY = H * (0.55 + rand(i, 8) * 0.42);
          ps[i].layer = 1;
          ps[i].color = palette[2];
          ps[i].baseAlpha = 0.55;
          ps[i].size = 0.8 + rand(i, 9) * 1.5;
          ps[i].type = 6;
          ps[i].phase = rand(i, 10) * Math.PI * 2;
          continue;
        }
        const depth = 0.2 + rand(i, 2) * 0.8;
        const px = rand(i, 3) * W;
        const baseY = H * (0.2 + (1 - depth) * 0.4);
        const amp = H * (0.08 + (1 - depth) * 0.15);
        const py = baseY - Math.sin(px * 0.01 + seed * 3 + depth * 2) * amp - rand(i, 4) * H * 0.15;
        ps[i].targetX = px;
        ps[i].targetY = py;
        ps[i].layer = Math.floor(depth * 3) + 2;
        const ci = Math.min(Math.floor(depth * palette.length * 0.7), palette.length - 1);
        ps[i].color = palette[ci];
        ps[i].baseAlpha = 0.45 + depth * 0.5;
        ps[i].size = 1 + (1 - depth) * 3 + rand(i, 5) * 1.5;
        ps[i].type = 0;
        ps[i].phase = rand(i, 6) * Math.PI * 2;
      }
      return;
    }

    if (isNightLike) {
      for (let i = 0; i < ps.length; i++) {
        const r = rand(i, 1);
        if (r < 0.25) {
          const ang = rand(i, 7) * Math.PI * 2;
          const rad = Math.sqrt(rand(i, 8)) * Math.min(W, H) * 0.18;
          ps[i].targetX = W * 0.5 + Math.cos(ang) * rad;
          ps[i].targetY = H * 0.22 + Math.sin(ang) * rad * 0.7;
          ps[i].layer = 5;
          ps[i].color = palette[4];
          ps[i].baseAlpha = 0.75 + rand(i, 9) * 0.25;
          ps[i].size = 1.2 + rand(i, 10) * 3;
          ps[i].type = 7;
          ps[i].phase = rand(i, 11) * Math.PI * 2;
          continue;
        }
        const depth = 0.3 + rand(i, 2) * 0.7;
        const px = rand(i, 3) * W;
        const baseY = H * (0.55 + depth * 0.35);
        const amp = H * (0.04 + (1 - depth) * 0.12);
        const py = baseY - Math.sin(px * 0.012 + seed * 4 + depth * 2.5) * amp - rand(i, 4) * H * 0.1;
        ps[i].targetX = px;
        ps[i].targetY = py;
        ps[i].layer = Math.floor(depth * 3);
        const ci = Math.min(Math.floor(depth * palette.length * 0.5), palette.length - 1);
        ps[i].color = palette[ci];
        ps[i].baseAlpha = 0.45 + depth * 0.45;
        ps[i].size = 1 + (1 - depth) * 2.8 + rand(i, 5) * 1.3;
        ps[i].type = 0;
        ps[i].phase = rand(i, 6) * Math.PI * 2;
      }
      return;
    }

    for (let i = 0; i < ps.length; i++) {
      const depth = rand(i, 1);
      ps[i].targetX = rand(i, 2) * W;
      ps[i].targetY = rand(i, 3) * H;
      ps[i].layer = Math.floor(depth * 4);
      const ci = Math.min(Math.floor(depth * palette.length), palette.length - 1);
      ps[i].color = palette[ci];
      ps[i].baseAlpha = 0.35 + depth * 0.6;
      ps[i].size = 1 + (1 - depth) * 3 + rand(i, 4) * 1.5;
      ps[i].type = 0;
      ps[i].phase = rand(i, 5) * Math.PI * 2;
    }
  }, []);

  const initParticles = useCallback((count: number, W: number, H: number, t: PoemTheme, hint: string) => {
    const arr: Particle[] = [];
    for (let i = 0; i < 1000; i++) {
      arr.push({
        x: Math.random() * W,
        y: Math.random() * H,
        oldX: 0,
        oldY: 0,
        targetX: 0,
        targetY: 0,
        size: 2,
        color: '#ffffff',
        alpha: 0.5,
        baseAlpha: 0.5,
        vx: 0,
        vy: 0,
        phase: 0,
        layer: 0,
        type: 0
      });
    }
    computeTargets(arr, W, H, t, hint);
    for (let i = 0; i < arr.length; i++) {
      arr[i].x = arr[i].targetX + (Math.random() - 0.5) * 40;
      arr[i].y = arr[i].targetY + (Math.random() - 0.5) * 40;
      arr[i].alpha = arr[i].baseAlpha;
    }
    return arr;
  }, [computeTargets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h, dpr };
      if (particlesRef.current.length === 0) {
        particlesRef.current = initParticles(1000, w, h, themeRef.current, hintRef.current);
      } else {
        computeTargets(particlesRef.current, w, h, themeRef.current, hintRef.current);
        for (const p of particlesRef.current) {
          p.x = Math.min(p.x, w);
          p.y = Math.min(p.y, h);
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      timeRef.current += dt;

      const { w: W, h: H } = sizeRef.current;
      const transition = transitionRef.current;
      const sp = speedRef.current;
      const activeCount = Math.min(Math.floor(densityRef.current), 1000);
      const t = timeRef.current;

      let transT = 0;
      let inTransition = false;
      if (transition.active) {
        const elapsed = (now - transition.startTime) / 1500;
        if (elapsed >= 1) {
          transition.active = false;
        } else {
          transT = easeInOutCubic(elapsed);
          inTransition = true;
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      const ps = particlesRef.current;
      for (let i = 0; i < activeCount; i++) {
        const p = ps[i];
        const depthFactor = (p.layer + 1) / 6;

        if (inTransition) {
          p.x = lerp(p.oldX, p.targetX, transT);
          p.y = lerp(p.oldY, p.targetY, transT);
          p.alpha = p.baseAlpha;
        } else {
          const driftAmp = 0.5 + depthFactor * 2.5;
          const freq = 0.8 + (1 - depthFactor) * 1.5;
          let dx = Math.sin(t * freq + p.phase) * driftAmp;
          let dy = Math.cos(t * freq * 0.7 + p.phase * 1.3) * driftAmp * 0.5;

          if (p.type === 3) {
            dy -= (0.3 + depthFactor) * 2.2 * sp;
            dx += Math.sin(t * 2 + p.phase) * 0.3;
            if (p.y < -20) {
              p.y = H * 0.8 + Math.random() * H * 0.15;
              p.x = p.targetX + (Math.random() - 0.5) * 40;
            }
          }
          if (p.type === 4) {
            dx += Math.sin(t * 1.5 + p.phase) * 0.6;
            dy += Math.cos(t * 1.2 + p.phase * 0.9) * 0.4;
          }
          if (p.type === 6) {
            dx = Math.sin(t * 0.5 + p.phase + p.x * 0.01) * driftAmp * 1.2;
            dy = Math.cos(t * 0.3 + p.phase * 0.7) * 0.3;
          }
          if (p.type === 7) {
            dy -= (0.05 + Math.random() * 0.02);
          }

          const slowFactor = 1 - depthFactor * 0.55;
          p.x = p.targetX + (p.x - p.targetX) * (1 - dt * 2 * slowFactor) + dx * dt * 30 * sp * slowFactor;
          p.y = p.targetY + (p.y - p.targetY) * (1 - dt * 2 * slowFactor) + dy * dt * 30 * sp * slowFactor;

          const pulse = 0.85 + 0.15 * Math.sin(t * 1.6 + p.phase * 2.1);
          p.alpha = p.baseAlpha * pulse;
        }

        const sizeMul = inTransition ? 1 : (0.85 + 0.15 * Math.sin(t * 1.3 + p.phase));
        const s = p.size * sizeMul;

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;

        if (p.type === 7) {
          const glowR = s * 3;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          grad.addColorStop(0, p.color);
          grad.addColorStop(0.4, p.color + 'aa');
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        } else if (p.type === 3) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 2.5);
          grad.addColorStop(0, p.color);
          grad.addColorStop(0.6, p.color + '88');
          grad.addColorStop(1, 'rgba(255,150,50,0)');
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, s * 2.5, 0, Math.PI * 2);
        } else if (p.type === 4) {
          ctx.save();
          ctx.translate(p.x, p.y);
          for (let k = 0; k < 5; k++) {
            ctx.rotate(Math.PI * 2 / 5);
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.35, -s * 0.35);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        } else {
          ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initParticles, computeTargets]);

  useEffect(() => {
    const shouldTransition = themeRef.current !== theme || hintRef.current !== particleHint;
    themeRef.current = theme;
    hintRef.current = particleHint;
    if (particlesRef.current.length === 0) return;
    const { w, h } = sizeRef.current;
    if (shouldTransition && w > 0) {
      for (const p of particlesRef.current) {
        p.oldX = p.x;
        p.oldY = p.y;
      }
      computeTargets(particlesRef.current, w, h, theme, particleHint);
      transitionRef.current = { active: true, startTime: performance.now() };
    }
  }, [theme, particleHint, computeTargets]);

  useEffect(() => {
    densityRef.current = density;
  }, [density]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  );
});

export default ParticleCanvas;
