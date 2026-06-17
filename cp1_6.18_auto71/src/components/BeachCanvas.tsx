import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameLoop } from '../services/gameLoop';
import {
  SCENE_WIDTH,
  SCENE_HEIGHT,
  THEME,
  PARTICLE,
  CAPSULE,
  ANIMATION
} from '../constants';
import { Capsule, SandParticle, DigAnimation } from '../types';
import { CapsuleEditor } from './CapsuleEditor';

interface ShellDot {
  x: number;
  y: number;
  size: number;
  rotation: number;
  type: number;
}

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export const BeachCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const mouseRef = useRef({ x: -100, y: -100, inside: false });
  const lastEmitRef = useRef(0);
  const shellsRef = useRef<ShellDot[]>([]);
  const trailRef = useRef<TrailParticle[]>([]);
  const digAnimsRef = useRef<DigAnimation[]>([]);
  const breatheRef = useRef(0);
  const pendingClickRef = useRef<{ x: number; y: number } | null>(null);

  const [, forceRender] = useState(0);

  const {
    capsules,
    showEditor,
    editorPosition,
    setShowEditor,
    openCapsule,
    focusedCapsuleId,
    clearFocusedCapsule,
    fetchCapsules
  } = useGameStore();

  useEffect(() => {
    fetchCapsules();
  }, [fetchCapsules]);

  useEffect(() => {
    const shells: ShellDot[] = [];
    for (let i = 0; i < 35; i++) {
      shells.push({
        x: Math.random() * SCENE_WIDTH,
        y: Math.random() * SCENE_HEIGHT,
        size: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        type: Math.floor(Math.random() * 3)
      });
    }
    shellsRef.current = shells;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SCENE_WIDTH * dpr;
    canvas.height = SCENE_HEIGHT * dpr;
    canvas.style.width = `${SCENE_WIDTH}px`;
    canvas.style.height = `${SCENE_HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const loop = new GameLoop();
    loopRef.current = loop;

    loop.start((_delta, now) => {
      breatheRef.current = now / 1000;
      render(ctx, now);
    });

    return () => {
      loop.dispose();
      loopRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusedCapsuleId) {
      const t = setTimeout(() => clearFocusedCapsule(), 1200);
      return () => clearTimeout(t);
    }
  }, [focusedCapsuleId, clearFocusedCapsule]);

  const render = (ctx: CanvasRenderingContext2D, now: number) => {
    drawBackground(ctx);
    drawShells(ctx, now);
    drawCapsules(ctx, now);
    drawDigAnimations(ctx, now);
    updateAndDrawTrail(ctx, now);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const grad = ctx.createLinearGradient(0, 0, 0, SCENE_HEIGHT);
    grad.addColorStop(0, THEME.beachStart);
    grad.addColorStop(1, THEME.beachEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 150; i++) {
      const x = (i * 97) % SCENE_WIDTH;
      const y = (i * 53) % SCENE_HEIGHT;
      ctx.fillStyle = i % 3 === 0 ? '#D4A84B' : '#E8C97A';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  };

  const drawShells = (ctx: CanvasRenderingContext2D, now: number) => {
    const t = now / 2000;
    shellsRef.current.forEach(shell => {
      const float = Math.sin(t + shell.x * 0.01) * 0.5;
      ctx.save();
      ctx.translate(shell.x, shell.y + float);
      ctx.rotate(shell.rotation);
      ctx.globalAlpha = 0.3 + Math.sin(t * 2 + shell.y * 0.02) * 0.08;
      ctx.fillStyle = '#FFFFFF';
      if (shell.type === 0) {
        ctx.beginPath();
        ctx.ellipse(0, 0, shell.size, shell.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.5;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(0, -shell.size * 0.4);
          ctx.lineTo(i * shell.size * 0.3, shell.size * 0.5);
          ctx.stroke();
        }
      } else if (shell.type === 1) {
        ctx.beginPath();
        ctx.moveTo(-shell.size, 0);
        ctx.quadraticCurveTo(0, -shell.size * 0.8, shell.size, 0);
        ctx.quadraticCurveTo(0, shell.size * 0.3, -shell.size, 0);
        ctx.fill();
      } else {
        for (let r = shell.size; r > 0; r -= shell.size / 4) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI, true);
          ctx.fill();
        }
      }
      ctx.restore();
    });
  };

  const drawCapsules = (ctx: CanvasRenderingContext2D, now: number) => {
    const t = breatheRef.current;
    capsules.forEach(cap => {
      drawCapsule(ctx, cap, t, now, focusedCapsuleId === cap.id);
    });
  };

  const drawCapsule = (
    ctx: CanvasRenderingContext2D,
    cap: Capsule,
    t: number,
    now: number,
    isFocused: boolean
  ) => {
    const { x, y } = cap.position;
    const bob = Math.sin(t * 1.8 + x * 0.02) * 1.2;
    const cw = CAPSULE.width;
    const ch = CAPSULE.height;
    const cy = y + bob;
    const buryOffset = ch * 0.35;

    ctx.save();
    if (isFocused) {
      const pulse = (Math.sin(now / 120) + 1) / 2;
      ctx.shadowColor = '#FFD93D';
      ctx.shadowBlur = 20 + pulse * 15;
    }
    ctx.globalAlpha = CAPSULE.opacity;

    ctx.beginPath();
    ctx.ellipse(x, cy, cw / 2, buryOffset + 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120, 80, 20, 0.25)';
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.rect(x - cw / 2 - 1, cy - ch / 2 - 1, cw + 2, ch / 2 + buryOffset + 1);
    ctx.clip();

    const grad = ctx.createLinearGradient(0, cy - ch / 2, 0, cy + ch / 2);
    grad.addColorStop(0, lightenColor(cap.color, 30));
    grad.addColorStop(0.4, cap.color);
    grad.addColorStop(1, darkenColor(cap.color, 25));
    ctx.fillStyle = grad;
    ctx.strokeStyle = darkenColor(cap.color, 40);
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.ellipse(x, cy, cw / 2, ch / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - cw * 0.1, cy - ch * 0.28);
    ctx.quadraticCurveTo(x, cy - ch * 0.5, x + cw * 0.25, cy - ch * 0.18);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (cap.isOpened) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x + cw * 0.3, cy - ch * 0.18, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  };

  const drawDigAnimations = (ctx: CanvasRenderingContext2D, now: number) => {
    const anims = digAnimsRef.current;
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i];
      const elapsed = now - a.startTime;
      const progress = elapsed / a.duration;
      if (progress >= 1) {
        anims.splice(i, 1);
        continue;
      }
      for (const p of a.particles) {
        p.life -= 16;
        const plife = Math.max(0, p.life / p.maxLife);
        p.x += p.vx;
        p.y += p.vy;
        p.vy += a.type === 'open' ? -0.08 : 0.06;
        p.vx *= 0.99;
        ctx.save();
        ctx.globalAlpha = plife * p.opacity;
        ctx.fillStyle = '#D4A84B';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (a.type === 'dig' && progress < 0.6) {
        const ring = progress / 0.6;
        ctx.save();
        ctx.globalAlpha = (1 - ring) * 0.35;
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(a.x, a.y, 10 + ring * 25, 6 + ring * 15, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const updateAndDrawTrail = (ctx: CanvasRenderingContext2D, now: number) => {
    const mouse = mouseRef.current;
    if (mouse.inside && now - lastEmitRef.current > 25) {
      lastEmitRef.current = now;
      for (let i = 0; i < 2; i++) {
        if (trailRef.current.length >= PARTICLE.maxCount) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = PARTICLE.trailSpeed * (0.3 + Math.random() * 0.7);
        const life = 1500 + Math.random() * 2000;
        trailRef.current.push({
          x: mouse.x + (Math.random() - 0.5) * 6,
          y: mouse.y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.2,
          size: PARTICLE.minSize + Math.random() * (PARTICLE.maxSize - PARTICLE.minSize),
          opacity: PARTICLE.minOpacity + Math.random() * (PARTICLE.maxOpacity - PARTICLE.minOpacity),
          life,
          maxLife: life
        });
      }
    }
    const trail = trailRef.current;
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      p.life -= 16;
      if (p.life <= 0) {
        trail.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy *= 0.985;
      const plife = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = plife * p.opacity;
      ctx.fillStyle = plife > 0.6 ? '#F4E4A8' : '#E8C97A';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const triggerDigAnimation = (x: number, y: number) => {
    const particles: SandParticle[] = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3;
      particles.push({
        x,
        y,
        size: 1 + Math.random() * 2.5,
        speed,
        opacity: 0.5 + Math.random() * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 400 + Math.random() * 200,
        maxLife: 600
      });
    }
    digAnimsRef.current.push({
      id: `dig-${Date.now()}-${Math.random()}`,
      x,
      y,
      startTime: performance.now(),
      duration: ANIMATION.digDuration,
      type: 'dig',
      particles
    });
  };

  const triggerOpenAnimation = (x: number, y: number) => {
    const particles: SandParticle[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        size: 1.5 + Math.random() * 2.5,
        speed,
        opacity: 0.5 + Math.random() * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 600 + Math.random() * 300,
        maxLife: 900
      });
    }
    digAnimsRef.current.push({
      id: `open-${Date.now()}-${Math.random()}`,
      x,
      y,
      startTime: performance.now(),
      duration: ANIMATION.openDuration,
      type: 'open',
      particles
    });
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = SCENE_WIDTH / rect.width;
    const scaleY = SCENE_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const hitTestCapsule = (x: number, y: number): Capsule | null => {
    for (let i = capsules.length - 1; i >= 0; i--) {
      const cap = capsules[i];
      const dx = x - cap.position.x;
      const dy = y - cap.position.y;
      const rx = CAPSULE.width / 2 + 4;
      const ry = CAPSULE.height / 2 + 8;
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
        return cap;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    mouseRef.current = { x, y, inside: true };
  };

  const handleMouseLeave = () => {
    mouseRef.current.inside = false;
  };

  const handleClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const hit = hitTestCapsule(x, y);
    if (hit) {
      triggerOpenAnimation(hit.position.x, hit.position.y);
      pendingClickRef.current = null;
      setTimeout(() => {
        openCapsule(hit.id);
      }, ANIMATION.openDuration * 0.6);
      return;
    }
    pendingClickRef.current = { x, y };
    triggerDigAnimation(x, y);
    setTimeout(() => {
      if (pendingClickRef.current) {
        setShowEditor(true, { x: pendingClickRef.current.x, y: pendingClickRef.current.y });
        pendingClickRef.current = null;
        forceRender(n => n + 1);
      }
    }, ANIMATION.digDuration * 0.7);
  };

  return (
    <>
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
      </div>
      {showEditor && editorPosition && (
        <CapsuleEditor
          position={editorPosition}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
};

function lightenColor(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  let r = parseInt(h.substring(0, 2), 16);
  let g = parseInt(h.substring(2, 4), 16);
  let b = parseInt(h.substring(4, 6), 16);
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  let r = parseInt(h.substring(0, 2), 16);
  let g = parseInt(h.substring(2, 4), 16);
  let b = parseInt(h.substring(4, 6), 16);
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return `rgb(${r},${g},${b})`;
}
