import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { EmotionType } from './emotionAnalyzer';
import { emotionColors } from './emotionAnalyzer';

export interface ParticleSceneHandle {
  exportImage: () => string | null;
}

interface ParticleSceneProps {
  emotion: EmotionType | null;
  intensity: number;
}

interface BaseParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  fadeState: 'in' | 'stable' | 'out';
}

interface JoyParticle extends BaseParticle {
  vy: number;
  vx: number;
}

interface SadnessParticle extends BaseParticle {
  vy: number;
}

interface AngerPulse extends BaseParticle {
  angle: number;
  speed: number;
  length: number;
}

interface CalmParticle extends BaseParticle {
  baseX: number;
  baseY: number;
  phase: number;
  speed: number;
  radius: number;
}

interface AnxietyParticle extends BaseParticle {
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  maxRadius: number;
}

type AnyParticle = JoyParticle | SadnessParticle | AngerPulse | CalmParticle | AnxietyParticle;

const MAX_PARTICLES = 200;

const ParticleScene = forwardRef<ParticleSceneHandle, ParticleSceneProps>(
  ({ emotion, intensity }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<AnyParticle[]>([]);
    const ripplesRef = useRef<Ripple[]>([]);
    const animationRef = useRef<number>(0);
    const lastSpawnRef = useRef<number>(0);
    const currentEmotionRef = useRef<EmotionType | null>(null);
    const prevEmotionRef = useRef<EmotionType | null>(null);
    const transitionStartRef = useRef<number>(0);
    const isTransitioningRef = useRef<boolean>(false);
    const angerPulseStartRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      exportImage: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 1920;
        exportCanvas.height = 1080;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return null;
        const scaleX = 1920 / canvas.width;
        const scaleY = 1080 / canvas.height;
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(canvas, 0, 0);
        return exportCanvas.toDataURL('image/png');
      }
    }));

    const getSpeedMultiplier = () => {
      const diff = intensity - 50;
      if (diff >= 0) {
        return 1 + (diff / 10) * 0.2;
      }
      return 1 + (diff / 10) * 0.15;
    };

    const getCountMultiplier = () => {
      const diff = intensity - 50;
      if (diff >= 0) {
        return 1 + (diff / 10) * 0.15;
      }
      return 1 + (diff / 10) * 0.1;
    };

    const spawnJoyParticle = (w: number, h: number): JoyParticle => ({
      x: Math.random() * w,
      y: h + Math.random() * 50,
      size: 8 + Math.random() * 12,
      opacity: 0,
      life: 0,
      maxLife: 200 + Math.random() * 100,
      fadeState: 'in',
      vy: -(0.5 + Math.random() * 1),
      vx: (Math.random() - 0.5) * 0.3
    });

    const spawnSadnessParticle = (w: number): SadnessParticle => ({
      x: Math.random() * w,
      y: -30 - Math.random() * 50,
      size: 10 + Math.random() * 15,
      opacity: 0,
      life: 0,
      maxLife: 300 + Math.random() * 150,
      fadeState: 'in',
      vy: 0.3 + Math.random() * 0.5
    });

    const spawnAngerPulse = (w: number, h: number): AngerPulse => ({
      x: w / 2,
      y: h / 2,
      size: 6 + Math.random() * 6,
      opacity: 0,
      life: 0,
      maxLife: 120,
      fadeState: 'in',
      angle: Math.random() * Math.PI * 2,
      speed: 3 + Math.random() * 4,
      length: 30 + Math.random() * 50
    });

    const spawnCalmParticle = (w: number, h: number): CalmParticle => ({
      baseX: Math.random() * w,
      baseY: Math.random() * h,
      x: 0,
      y: 0,
      size: 15 + Math.random() * 25,
      opacity: 0,
      life: 0,
      maxLife: 400 + Math.random() * 200,
      fadeState: 'in',
      phase: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.01,
      radius: 20 + Math.random() * 40
    });

    const spawnAnxietyParticle = (w: number, h: number): AnxietyParticle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      targetX: Math.random() * w,
      targetY: Math.random() * h,
      size: 8 + Math.random() * 12,
      opacity: 0,
      life: 0,
      maxLife: 150 + Math.random() * 100,
      fadeState: 'in',
      vx: 0,
      vy: 0
    });

    const drawJoy = (ctx: CanvasRenderingContext2D, particles: JoyParticle[], w: number, h: number, alpha: number) => {
      const speed = getSpeedMultiplier();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.y += p.vy * speed;
        p.x += p.vx * speed;

        if (p.fadeState === 'in' && p.opacity < 0.9) {
          p.opacity = Math.min(0.9, p.opacity + 0.03);
        } else if (p.fadeState === 'out') {
          p.opacity = Math.max(0, p.opacity - 0.05);
          p.size = Math.max(0, p.size - 0.3);
        }

        if (p.opacity <= 0 || p.y < -50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${p.opacity * alpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 230, 100, ${p.opacity * 0.3 * alpha})`;
        ctx.fill();
      }

      const threshold = 80;
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < threshold) {
            const lineAlpha = (1 - dist / threshold) * 0.4 * alpha;
            ctx.strokeStyle = `rgba(255, 240, 150, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const drawSadness = (ctx: CanvasRenderingContext2D, particles: SadnessParticle[], _w: number, h: number, alpha: number) => {
      const speed = getSpeedMultiplier();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.y += p.vy * speed;

        if (p.fadeState === 'in' && p.opacity < 0.85) {
          p.opacity = Math.min(0.85, p.opacity + 0.02);
        } else if (p.fadeState === 'out') {
          p.opacity = Math.max(0, p.opacity - 0.05);
          p.size = Math.max(0, p.size - 0.3);
        }

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        if (p.y >= h - p.size && p.fadeState !== 'out') {
          ripplesRef.current.push({
            x: p.x,
            y: h - 10,
            radius: 0,
            opacity: 0.6,
            maxRadius: 30
          });
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.quadraticCurveTo(p.x + p.size * 0.7, p.y, p.x, p.y + p.size * 0.6);
        ctx.quadraticCurveTo(p.x - p.size * 0.7, p.y, p.x, p.y - p.size);
        ctx.fillStyle = `rgba(100, 180, 255, ${p.opacity * alpha})`;
        ctx.fill();
      }

      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += 1.2 * speed;
        r.opacity = Math.max(0, r.opacity - 0.02);

        if (r.opacity <= 0 || r.radius >= r.maxRadius) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150, 200, 255, ${r.opacity * alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const drawAnger = (ctx: CanvasRenderingContext2D, particles: AngerPulse[], w: number, h: number, alpha: number, now: number) => {
      const speed = getSpeedMultiplier();
      const pulseInterval = 800;
      if (now - angerPulseStartRef.current > pulseInterval) {
        angerPulseStartRef.current = now;
        const count = Math.floor(8 + Math.random() * 8);
        for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
          particles.push(spawnAngerPulse(w, h));
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        const dist = p.life * p.speed * speed;

        if (p.fadeState === 'in' && p.opacity < 0.9) {
          p.opacity = Math.min(0.9, p.opacity + 0.05);
        } else if (p.fadeState === 'out' || p.life > p.maxLife * 0.7) {
          p.fadeState = 'out';
          p.opacity = Math.max(0, p.opacity - 0.04);
        }

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const startX = w / 2 + Math.cos(p.angle) * dist * 0.3;
        const startY = h / 2 + Math.sin(p.angle) * dist * 0.3;
        const endX = w / 2 + Math.cos(p.angle) * (dist + p.length);
        const endY = h / 2 + Math.sin(p.angle) * (dist + p.length);

        const jaggedness = 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let j = 1; j <= jaggedness; j++) {
          const t = j / jaggedness;
          const midX = startX + (endX - startX) * t + (Math.random() - 0.5) * 10;
          const midY = startY + (endY - startY) * t + (Math.random() - 0.5) * 10;
          ctx.lineTo(midX, midY);
        }
        ctx.strokeStyle = `rgba(255, ${60 + Math.random() * 40}, ${40 + Math.random() * 30}, ${p.opacity * alpha})`;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    const drawCalm = (ctx: CanvasRenderingContext2D, particles: CalmParticle[], _w: number, _h: number, alpha: number, now: number) => {
      const speed = getSpeedMultiplier();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.phase += p.speed * speed;

        p.x = p.baseX + Math.cos(p.phase) * p.radius;
        p.y = p.baseY + Math.sin(p.phase * 0.8) * p.radius * 0.6;

        if (p.fadeState === 'in' && p.opacity < 0.6) {
          p.opacity = Math.min(0.6, p.opacity + 0.01);
        } else if (p.fadeState === 'out') {
          p.opacity = Math.max(0, p.opacity - 0.03);
          p.size = Math.max(0, p.size - 0.2);
        }

        if (p.opacity <= 0 || p.life > p.maxLife) {
          if (p.fadeState !== 'out') {
            p.fadeState = 'out';
          }
          if (p.opacity <= 0) {
            particles.splice(i, 1);
            continue;
          }
        }

        const wave = Math.sin(now * 0.001 + p.phase) * 5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size + wave, p.size * 0.6 + wave * 0.5, 0, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(100, 220, 200, ${p.opacity * alpha})`);
        gradient.addColorStop(1, `rgba(50, 180, 160, ${p.opacity * 0.3 * alpha})`);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    const drawAnxiety = (ctx: CanvasRenderingContext2D, particles: AnxietyParticle[], w: number, h: number, alpha: number) => {
      const speed = getSpeedMultiplier();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        p.vx += dx * 0.02 * speed;
        p.vy += dy * 0.02 * speed;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20 || p.life % 60 === 0) {
          p.targetX = Math.random() * w;
          p.targetY = Math.random() * h;
        }

        if (p.fadeState === 'in' && p.opacity < 0.7) {
          p.opacity = Math.min(0.7, p.opacity + 0.03);
        } else if (p.fadeState === 'out') {
          p.opacity = Math.max(0, p.opacity - 0.04);
          p.size = Math.max(0, p.size - 0.2);
        }

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const shake = (Math.random() - 0.5) * 3;
        ctx.beginPath();
        ctx.moveTo(p.x + shake, p.y - p.size);
        for (let j = 0; j < 8; j++) {
          const angle = (j / 8) * Math.PI * 2 - Math.PI / 2;
          const r = p.size * (0.6 + Math.sin(p.life * 0.1 + j) * 0.4);
          ctx.lineTo(p.x + Math.cos(angle) * r + shake, p.y + Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(160, 130, 200, ${p.opacity * alpha})`;
        ctx.fill();

        ctx.strokeStyle = `rgba(180, 150, 220, ${p.opacity * 0.3 * alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.targetX, p.targetY);
        ctx.stroke();
      }
    };

    const drawEmotion = (
      ctx: CanvasRenderingContext2D,
      emotionType: EmotionType,
      alpha: number,
      now: number
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const countMult = getCountMultiplier();

      switch (emotionType) {
        case 'joy': {
          const spawnInterval = 80 / getSpeedMultiplier();
          if (now - lastSpawnRef.current > spawnInterval) {
            const spawnCount = Math.floor(2 * countMult);
            for (let i = 0; i < spawnCount && particlesRef.current.length < MAX_PARTICLES; i++) {
              particlesRef.current.push(spawnJoyParticle(w, h));
            }
            lastSpawnRef.current = now;
          }
          drawJoy(ctx, particlesRef.current as JoyParticle[], w, h, alpha);
          break;
        }
        case 'sadness': {
          const spawnInterval = 150 / getSpeedMultiplier();
          if (now - lastSpawnRef.current > spawnInterval) {
            const spawnCount = Math.floor(1 * countMult);
            for (let i = 0; i < spawnCount && particlesRef.current.length < MAX_PARTICLES; i++) {
              particlesRef.current.push(spawnSadnessParticle(w));
            }
            lastSpawnRef.current = now;
          }
          drawSadness(ctx, particlesRef.current as SadnessParticle[], w, h, alpha);
          break;
        }
        case 'anger': {
          drawAnger(ctx, particlesRef.current as AngerPulse[], w, h, alpha, now);
          break;
        }
        case 'calm': {
          const targetCount = Math.floor(25 * countMult);
          if (particlesRef.current.length < targetCount) {
            particlesRef.current.push(spawnCalmParticle(w, h));
          }
          drawCalm(ctx, particlesRef.current as CalmParticle[], w, h, alpha, now);
          break;
        }
        case 'anxiety': {
          const spawnInterval = 100 / getSpeedMultiplier();
          if (now - lastSpawnRef.current > spawnInterval) {
            const spawnCount = Math.floor(2 * countMult);
            for (let i = 0; i < spawnCount && particlesRef.current.length < MAX_PARTICLES; i++) {
              particlesRef.current.push(spawnAnxietyParticle(w, h));
            }
            lastSpawnRef.current = now;
          }
          drawAnxiety(ctx, particlesRef.current as AnxietyParticle[], w, h, alpha);
          break;
        }
      }
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      if (emotion !== currentEmotionRef.current) {
        if (currentEmotionRef.current !== null) {
          prevEmotionRef.current = currentEmotionRef.current;
          isTransitioningRef.current = true;
          transitionStartRef.current = performance.now();
          particlesRef.current.forEach((p) => {
            p.fadeState = 'out';
          });
        }
        currentEmotionRef.current = emotion;
        if (emotion !== null) {
          angerPulseStartRef.current = performance.now();
        }
      }

      const animate = () => {
        const now = performance.now();
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (isTransitioningRef.current && prevEmotionRef.current) {
          const elapsed = now - transitionStartRef.current;
          const transitionDuration = 1000;
          const progress = Math.min(1, elapsed / transitionDuration);

          if (progress < 1) {
            drawEmotion(ctx, prevEmotionRef.current, 1 - progress, now);
          }

          if (currentEmotionRef.current) {
            drawEmotion(ctx, currentEmotionRef.current, progress, now);
          }

          if (progress >= 1) {
            isTransitioningRef.current = false;
            prevEmotionRef.current = null;
          }
        } else if (currentEmotionRef.current) {
          drawEmotion(ctx, currentEmotionRef.current, 1, now);
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationRef.current);
        window.removeEventListener('resize', resizeCanvas);
      };
    }, [emotion, intensity]);

    const getBgStyle = () => {
      if (emotion === null) {
        return { background: '#1a1a2e' };
      }
      const colors = emotionColors[emotion];
      return {
        background: `linear-gradient(135deg, ${colors.start} 0%, ${colors.end} 100%)`
      };
    };

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transition: 'background 1.5s ease',
          ...getBgStyle()
        }}
      />
    );
  }
);

ParticleScene.displayName = 'ParticleScene';

export default ParticleScene;
