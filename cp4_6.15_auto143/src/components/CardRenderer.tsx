import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { RaceConfig } from '@/data/RaceData';
import { calculateBattlePower, getSkillById } from '@/data/RaceData';
import { cn } from '@/lib/utils';

interface CardRendererProps {
  race: RaceConfig;
  currentHp?: number;
  maxHp?: number;
  team?: 'blue' | 'red';
  compact?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
  type: string;
}

const POWER_COLORS: Record<string, string> = {
  S: '#ffd700',
  A: '#22c55e',
  B: '#3b82f6',
  C: '#9ca3af',
};

const PARTICLE_COLORS: Record<string, string[]> = {
  leaf: ['#4ade80', '#22c55e', '#86efac'],
  fire: ['#f97316', '#ef4444', '#fbbf24'],
  skull: ['#a78bfa', '#6b7280', '#c4b5fd'],
  lightning: ['#fbbf24', '#ffffff', '#fde68a'],
  gear: ['#38bdf8', '#ffffff', '#7dd3fc'],
};

const RADAR_LABELS = ['生命', '攻击', '防御', '速度', '魔力', '韧性'];

function getRadarValues(attr: { hp: number; attack: number; defense: number; speed: number }): number[] {
  const magic = attr.attack * 0.5 + attr.defense * 0.3;
  const resilience = attr.hp * 0.2 + attr.defense * 0.8;
  return [attr.hp / 200, attr.attack / 100, attr.defense / 50, attr.speed / 10, magic / 65, resilience / 60];
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  size: number,
  values: number[],
  cs: { primary: string; gradientFrom: string; gradientTo: string },
) {
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.min(cx, cy) * 0.65;
  const n = 6;
  const step = (2 * Math.PI) / n;

  ctx.clearRect(0, 0, size, size);

  for (let ring = 1; ring <= 3; ring++) {
    const rr = r * (ring / 3);
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (i % n) * step;
      const px = cx + rr * Math.cos(a);
      const py = cy + rr * Math.sin(a);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(212,168,67,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.strokeStyle = 'rgba(212,168,67,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i % n) * step;
    const v = Math.min(values[i % n], 1);
    const px = cx + r * v * Math.cos(a);
    const py = cy + r * v * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();

  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, cs.gradientFrom);
  grad.addColorStop(1, cs.gradientTo);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = cs.primary;
  ctx.lineWidth = 2;
  ctx.stroke();

  const fontSize = size < 150 ? 9 : 11;
  ctx.font = `${fontSize}px 'Noto Sans SC', sans-serif`;
  ctx.fillStyle = '#d4a843';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    ctx.fillText(RADAR_LABELS[i], cx + (r + 14) * Math.cos(a), cy + (r + 14) * Math.sin(a));
  }
}

export default function CardRenderer({
  race,
  currentHp,
  maxHp,
  team,
  compact,
  onClick,
  draggable,
  onDragStart,
}: CardRendererProps) {
  const radarRef = useRef<HTMLCanvasElement>(null);
  const particleRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const [isWarCry, setIsWarCry] = useState(false);

  const radarSize = compact ? 130 : 180;
  const cardW = compact ? 160 : 220;
  const cardH = compact ? 230 : 320;

  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawRadar(ctx, radarSize, getRadarValues(race.attributes), race.colorScheme);
  }, [race, radarSize]);

  useEffect(() => () => cancelAnimationFrame(animFrameRef.current), []);

  const createParticles = useCallback((): Particle[] => {
    const count = window.innerWidth <= 768 ? 25 : 50;
    const skill = race.skills.map(id => getSkillById(id)).find(Boolean);
    const pType = skill?.particleType || 'fire';
    const colors = PARTICLE_COLORS[pType] || PARTICLE_COLORS.fire;
    const midX = cardW / 2;
    const midY = cardH / 2;
    const ps: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const maxLife = 400 + Math.random() * 800;
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;
      if (pType === 'leaf') {
        vx *= 0.5;
        vy = -(0.5 + Math.random() * 2);
      }
      ps.push({
        x: midX,
        y: midY,
        vx,
        vy,
        size: 2 + Math.random() * 4,
        life: 0,
        maxLife,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        type: pType,
      });
    }
    return ps;
  }, [race.skills, cardW, cardH]);

  const tickParticles = useCallback(() => {
    const canvas = particleRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const now = performance.now();
    const dt = lastTimeRef.current ? now - lastTimeRef.current : 16;
    lastTimeRef.current = now;
    const ps = particlesRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of ps) {
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.alpha = 0;
        continue;
      }
      alive = true;
      const ratio = dt / 16;
      p.alpha = 1 - p.life / p.maxLife;

      switch (p.type) {
        case 'leaf':
          p.vy -= 0.02 * ratio;
          p.vx += (Math.random() - 0.5) * 0.1 * ratio;
          break;
        case 'fire':
          p.vy += 0.04 * ratio;
          break;
        case 'skull': {
          const c = Math.cos(0.08 * ratio);
          const s = Math.sin(0.08 * ratio);
          const nvx = p.vx * c - p.vy * s;
          const nvy = p.vx * s + p.vy * c;
          p.vx = nvx;
          p.vy = nvy;
          break;
        }
        case 'lightning':
          p.x += (Math.random() - 0.5) * 8 * ratio;
          p.y += (Math.random() - 0.5) * 8 * ratio;
          p.alpha *= Math.random() > 0.3 ? 1 : 0.2;
          break;
        case 'gear': {
          const gc = Math.cos(0.06 * ratio);
          const gs = Math.sin(0.06 * ratio);
          const gvx = p.vx * gc - p.vy * gs;
          const gvy = p.vx * gs + p.vy * gc;
          p.vx = gvx * 1.005;
          p.vy = gvy * 1.005;
          break;
        }
      }

      p.x += p.vx * ratio;
      p.y += p.vy * ratio;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (alive) {
      animFrameRef.current = requestAnimationFrame(tickParticles);
    } else {
      lastTimeRef.current = 0;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isWarCry) return;
    setIsWarCry(true);
    cancelAnimationFrame(animFrameRef.current);
    particlesRef.current = createParticles();
    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(tickParticles);
    onClick?.();
    setTimeout(() => setIsWarCry(false), 800);
  }, [isWarCry, createParticles, tickParticles, onClick]);

  const power = calculateBattlePower(race.attributes);
  const hpPct = currentHp != null && maxHp != null ? Math.max(0, (currentHp / maxHp) * 100) : 0;

  return (
    <div
      className={cn(
        'parchment-bg noise-overlay relative rounded-lg cursor-pointer select-none overflow-hidden',
        isWarCry && 'animate-war-cry',
      )}
      style={{
        width: cardW,
        height: cardH,
        border: '2px solid var(--gold-dim)',
        boxShadow: 'inset 0 0 12px rgba(139,112,50,0.4)',
      }}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {isWarCry && (
        <div
          className="animate-glow-flash absolute inset-0 pointer-events-none z-10"
          style={{ background: race.colorScheme.glow }}
        />
      )}
      <canvas
        ref={particleRef}
        width={cardW}
        height={cardH}
        className="absolute inset-0 pointer-events-none z-20"
      />
      <div className="relative z-0 flex flex-col h-full p-2">
        <div className="flex justify-between items-start">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: race.colorScheme.primary }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
              <path d={race.iconPath} />
            </svg>
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: POWER_COLORS[power] || POWER_COLORS.C,
              color: power === 'S' ? '#1a1035' : '#fff',
            }}
          >
            {power}
          </div>
        </div>

        <div
          className="text-center title-font mt-1"
          style={{ color: 'var(--gold-light)', fontSize: compact ? 12 : 14 }}
        >
          {race.name}
        </div>

        <div className="flex justify-center mt-1">
          <canvas ref={radarRef} width={radarSize} height={radarSize} />
        </div>

        {currentHp != null && maxHp != null && (
          <div className="mt-1">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${hpPct}%`,
                  background: 'linear-gradient(to right, #7f1d1d, #ef4444)',
                }}
              />
            </div>
            <div
              className="text-center mt-0.5"
              style={{ color: '#fca5a5', fontSize: compact ? 9 : 11 }}
            >
              {currentHp}/{maxHp}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1 justify-center mt-auto pt-1">
          {race.skills.map(sid => {
            const sk = getSkillById(sid);
            return sk ? (
              <span
                key={sid}
                className="px-1.5 py-0.5 rounded"
                style={{
                  fontSize: compact ? 9 : 11,
                  background: `${race.colorScheme.primary}33`,
                  color: race.colorScheme.primary,
                  border: `1px solid ${race.colorScheme.primary}55`,
                }}
              >
                {sk.name}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
