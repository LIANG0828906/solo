import React, { useEffect, useRef } from 'react';
import './Fireworks.css';

const RAINBOW = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
  '#0000FF', '#4B0082', '#8B00FF',
];

const GRAVITY = 0.06;
const PARTICLE_COUNT_MIN = 30;
const PARTICLE_COUNT_MAX = 50;
const FIREWORK_COUNT_MIN = 5;
const FIREWORK_COUNT_MAX = 8;
const DURATION = 5000;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  trail: { x: number; y: number }[];
  trailLength: number;
}

interface Firework {
  phase: 'launch' | 'explode';
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  particles: Particle[];
  done: boolean;
  launchTrail: { x: number; y: number }[];
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createExplosionParticles(x: number, y: number, color: string): Particle[] {
  const count = Math.floor(randomRange(PARTICLE_COUNT_MIN, PARTICLE_COUNT_MAX + 1));
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + randomRange(-0.1, 0.1);
    const speed = randomRange(1.5, 4.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      alpha: 1,
      decay: randomRange(0.012, 0.025),
      size: randomRange(1.5, 3),
      trail: [],
      trailLength: Math.floor(randomRange(4, 8)),
    });
  }
  return particles;
}

function createFirework(canvasW: number, canvasH: number): Firework {
  const x = randomRange(canvasW * 0.15, canvasW * 0.85);
  const targetY = randomRange(canvasH * 0.1, canvasH * 0.45);
  const color = RAINBOW[Math.floor(Math.random() * RAINBOW.length)];
  return {
    phase: 'launch',
    x,
    y: canvasH,
    targetY,
    vy: randomRange(-6, -4),
    color,
    particles: [],
    done: false,
    launchTrail: [],
  };
}

interface FireworksProps {
  active: boolean;
}

const Fireworks: React.FC<FireworksProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const fireworksRef = useRef<Firework[]>([]);
  const startTimeRef = useRef<number>(0);
  const spawnTimersRef = useRef<number[]>([]);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(animRef.current);
      spawnTimersRef.current.forEach(clearTimeout);
      spawnTimersRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      fireworksRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    fireworksRef.current = [];
    startTimeRef.current = performance.now();
    spawnTimersRef.current = [];

    const count = Math.floor(randomRange(FIREWORK_COUNT_MIN, FIREWORK_COUNT_MAX + 1));
    for (let i = 0; i < count; i++) {
      const delay = randomRange(0, DURATION * 0.6);
      const timer = window.setTimeout(() => {
        if (canvas.width > 0 && canvas.height > 0) {
          fireworksRef.current.push(createFirework(canvas.width, canvas.height));
        }
      }, delay);
      spawnTimersRef.current.push(timer);
    }

    const animate = () => {
      const elapsed = performance.now() - startTimeRef.current;
      if (elapsed > DURATION + 2000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fireworksRef.current = [];
        return;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const fireworks = fireworksRef.current;
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];

        if (fw.phase === 'launch') {
          fw.launchTrail.push({ x: fw.x, y: fw.y });
          if (fw.launchTrail.length > 8) fw.launchTrail.shift();

          ctx.beginPath();
          for (let t = 0; t < fw.launchTrail.length; t++) {
            const pt = fw.launchTrail[t];
            const a = (t / fw.launchTrail.length) * 0.6;
            ctx.strokeStyle = `rgba(255, 255, 200, ${a})`;
            ctx.lineWidth = 2;
            if (t === 0) {
              ctx.moveTo(pt.x, pt.y);
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 220, 0.9)';
          ctx.fill();

          fw.y += fw.vy;
          fw.vy += GRAVITY * 0.3;

          if (fw.y <= fw.targetY || fw.vy >= 0) {
            fw.phase = 'explode';
            fw.particles = createExplosionParticles(fw.x, fw.y, fw.color);
          }
        }

        if (fw.phase === 'explode') {
          let allDead = true;
          for (const p of fw.particles) {
            if (p.alpha <= 0) continue;
            allDead = false;

            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > p.trailLength) p.trail.shift();

            for (let t = 0; t < p.trail.length; t++) {
              const pt = p.trail[t];
              const a = (t / p.trail.length) * p.alpha * 0.4;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, p.size * 0.5, 0, Math.PI * 2);
              ctx.fillStyle = p.color.replace(')', `, ${a})`).replace('rgb', 'rgba').replace('#', '');
              ctx.globalAlpha = a;
              ctx.fillStyle = p.color;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.globalAlpha = 1;

            p.vx *= 0.98;
            p.vy *= 0.98;
            p.vy += GRAVITY;
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha < 0) p.alpha = 0;
          }
          if (allDead) fw.done = true;
        }
      }

      fireworksRef.current = fireworksRef.current.filter((fw) => !fw.done);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      spawnTimersRef.current.forEach(clearTimeout);
      spawnTimersRef.current = [];
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return (
    <div className="fireworks-container">
      <canvas ref={canvasRef} className="fireworks-canvas" />
    </div>
  );
};

export default Fireworks;
