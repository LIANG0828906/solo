import { useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTavernStore, computeProfile, blendColors } from '../store';
import type { FlavorProfile } from '../types';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function ParticleBeam({ profile, color }: { profile: FlavorProfile; color: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Array<{
    x: number; y: number; vy: number; size: number; hue: number; alpha: number; life: number; maxLife: number;
  }>>([]);

  const [r, g, b] = useMemo(() => hexToRgb(color), [color]);
  const brightness = 0.5 + (profile.alcohol / 100) * 0.5;
  const spread = 6 + (profile.alcohol / 100) * 12;
  const baseSize = 2 + (profile.alcohol / 100) * 3;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    particlesRef.current = [];
    for (let i = 0; i < 100; i++) {
      particlesRef.current.push({
        x: W / 2 + (Math.random() - 0.5) * spread * 4,
        y: H + Math.random() * H,
        vy: 0.5 + Math.random() * 1.8,
        size: baseSize * (0.5 + Math.random() * 1.2),
        hue: Math.random() * 30 - 15,
        alpha: 0.2 + Math.random() * 0.5,
        life: Math.random() * 100,
        maxLife: 80 + Math.random() * 80,
      });
    }

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.width = W;
    canvas.height = H;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    const tick = () => {
      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.25 * brightness})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.08 * brightness})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, spread * 4, H / 1.6, 0, 0, Math.PI * 2);
      ctx.fill();

      for (const p of particlesRef.current) {
        p.life++;
        p.y -= p.vy;
        p.x += Math.sin(p.life * 0.05) * 0.5;

        if (p.y < -20 || p.life > p.maxLife) {
          p.x = W / 2 + (Math.random() - 0.5) * spread * 3;
          p.y = H + 10;
          p.vy = 0.5 + Math.random() * 1.8;
          p.life = 0;
          p.alpha = 0.2 + Math.random() * 0.5;
          p.size = baseSize * (0.5 + Math.random() * 1.2);
        }

        const a = p.alpha * (1 - p.life / p.maxLife) * brightness;
        if (a <= 0) continue;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, r + p.hue)},${Math.min(255, g + p.hue)},${Math.min(255, b + p.hue)},${a})`;
        ctx.shadowBlur = p.size * 4;
        ctx.shadowColor = `rgba(${r},${g},${b},${a})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.remove();
    };
  }, [color, brightness, spread, baseSize, r, g, b]);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}

function ArcBar({
  value, color, label, index,
}: { value: number; color: string; label: string; index: number }) {
  const mv = useMotionValue(0);
  const pathLength = useTransform(mv, v => 1 - v);

  useEffect(() => {
    const controls = animate(mv, value / 100, { duration: 0.3, ease: 'easeOut' });
    return controls.stop;
  }, [value, mv]);

  const size = 100;
  const strokeW = 8;
  const radius = (size - strokeW) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLen = circumference * 0.75;
  const startOffset = circumference * 0.125;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: `rotate(${index * 90}deg)` }}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(179,136,255,0.1)"
          strokeWidth={strokeW}
          strokeDasharray={`${arcLen} ${circumference}`}
          strokeDashoffset={-startOffset}
          strokeLinecap="round"
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeDasharray={`${arcLen} ${circumference}`}
          strokeLinecap="round"
          style={{
            strokeDashoffset: useTransform(pathLength, p => -(startOffset + arcLen * (1 - p))),
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 10, color: '#6B4F9E', letterSpacing: 1 }}>{label}</div>
        <motion.div
          key={value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontSize: 18,
            fontWeight: 700,
            color,
            textShadow: `0 0 8px ${color}88`,
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          {Math.round(value)}
        </motion.div>
      </div>
    </div>
  );
}

const FLAVOR_META: Array<{ key: keyof FlavorProfile; label: string; color: string }> = [
  { key: 'alcohol', label: 'ALC', color: '#E040FB' },
  { key: 'sweetness', label: 'SWT', color: '#FFD54F' },
  { key: 'sourness', label: 'SRC', color: '#81C784' },
  { key: 'bitterness', label: 'BIT', color: '#EF9A9A' },
];

export default function CocktailVisualizer() {
  const slots = useTavernStore(s => s.slots);
  const currentCocktail = useTavernStore(s => s.currentCocktail);
  const isMixing = useTavernStore(s => s.isMixing);

  const liveProfile = useMemo(() => computeProfile(slots), [slots]);
  const liveColor = useMemo(() => blendColors(slots), [slots]);

  const profile = currentCocktail ? currentCocktail.profile : liveProfile;
  const color = currentCocktail ? currentCocktail.blendedColor : liveColor;
  const hasContent = slots.some(s => s.ingredient) || currentCocktail;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 'calc(50% - 170px)',
        transform: 'translateX(-50%)',
        width: 380,
        height: 300,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        animate={{
          opacity: hasContent ? 1 : 0.08,
          scale: isMixing ? [1, 1.04, 1] : 1,
        }}
        transition={{
          opacity: { duration: 0.4 },
          scale: { duration: 0.5, repeat: isMixing ? Infinity : 0 },
        }}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 120,
          transform: 'translateX(-50%)',
          width: 180,
          height: 180,
        }}
      >
        {hasContent && <ParticleBeam profile={profile} color={color} />}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 100,
            height: 18,
            borderRadius: '50%',
            background: hasContent ? color : '#2A1A4A',
            filter: `blur(6px)`,
            opacity: hasContent ? 0.6 : 0.3,
            boxShadow: hasContent ? `0 0 40px ${color}88` : 'none',
          }}
        />
      </motion.div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        {FLAVOR_META.map((m, i) => (
          <ArcBar key={m.key} value={profile[m.key]} color={m.color} label={m.label} index={i} />
        ))}
      </div>

      {currentCocktail && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#6B4F9E',
              letterSpacing: 2,
              marginBottom: 2,
            }}
          >
            SERVED · 已调出
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#B388FF',
              letterSpacing: 1,
              textShadow: '0 0 12px rgba(179,136,255,0.5)',
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            {currentCocktail.name}
          </div>
        </motion.div>
      )}
    </div>
  );
}
