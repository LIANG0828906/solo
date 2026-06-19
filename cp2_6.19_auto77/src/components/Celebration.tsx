import { useEffect, useMemo, useRef, useState } from 'react';

const CONFETTI_COLORS = [
  '#e94560', '#f5c542', '#3fb950', '#58a6ff',
  '#bc8cff', '#ffa657', '#79c0ff', '#ff7b72',
  '#ffb300', '#38bdf8', '#a78bfa', '#f472b6',
];

type Shape = 'rect' | 'circle' | 'star';

interface Particle {
  id: number;
  color: string;
  delay: number;
  duration: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  gravity: number;
  size: number;
  width: number;
  height: number;
  rotStart: number;
  rotSpeed: number;
  rotY: number;
  shape: Shape;
  opacityEnd: number;
}

interface CelebrationProps {
  trigger: number;
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildParticles(nonce: number): Particle[] {
  const count = 160;
  const list: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const power = randRange(80, 420);
    const dx = Math.cos(angle) * power;
    const dy = Math.sin(angle) * power * 0.6 - randRange(60, 180);
    const gravity = randRange(280, 560);
    const shapes: Shape[] = ['rect', 'circle', 'star'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    list.push({
      id: nonce * 10000 + i,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: randRange(0, 60),
      duration: randRange(900, 1200),
      startX: 0,
      startY: 0,
      dx,
      dy,
      gravity,
      size: randRange(5, 10),
      width: randRange(5, 11),
      height: randRange(8, 16),
      rotStart: randRange(0, 360),
      rotSpeed: randRange(-1080, 1080),
      rotY: randRange(-720, 720),
      shape,
      opacityEnd: Math.random() > 0.3 ? 0 : 0.15,
    });
  }
  return list;
}

function buildKeyframes(): string {
  const names: string[] = [];
  const rules: string[] = [];
  for (let i = 0; i < 12; i++) {
    const name = `cb-${i}`;
    names.push(name);
    rules.push(`
      @keyframes ${name} {
        0% {
          opacity: 1;
          transform: translate(-50%, 0) rotate(calc(var(--rs) * 1deg)) rotateY(0deg) scale(0.3);
        }
        15% {
          opacity: 1;
          transform: translate(
              calc(-50% + var(--dx) * 0.35),
              calc(var(--dy) * 0.35 + var(--g) * 0.0225)
            )
            rotate(calc((var(--rs) + var(--rspeed) * 0.15) * 1deg))
            rotateY(calc(var(--ry) * 0.15 * 1deg))
            scale(1);
        }
        50% {
          opacity: 1;
          transform: translate(
              calc(-50% + var(--dx) * 0.85),
              calc(var(--dy) * 0.85 + var(--g) * 0.25)
            )
            rotate(calc((var(--rs) + var(--rspeed) * 0.5) * 1deg))
            rotateY(calc(var(--ry) * 0.5 * 1deg))
            scale(1);
        }
        100% {
          opacity: var(--oe);
          transform: translate(
              calc(-50% + var(--dx)),
              calc(var(--dy) + var(--g))
            )
            rotate(calc((var(--rs) + var(--rspeed)) * 1deg))
            rotateY(calc(var(--ry) * 1deg))
            scale(0.85);
        }
      }
    `);
  }
  return rules.join('\n');
}

const KEYFRAME_STYLES = buildKeyframes();

export function Celebration({ trigger }: CelebrationProps) {
  const [nonce, setNonce] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);
  const keyframesInjected = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined' || keyframesInjected.current) return;
    keyframesInjected.current = true;
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-celebration-kf', 'true');
    styleEl.textContent = KEYFRAME_STYLES;
    document.head.appendChild(styleEl);
  }, []);

  useEffect(() => {
    if (trigger <= 0) return;
    setNonce((n) => n + 1);
    setVisible(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), 1400);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [trigger]);

  const particles = useMemo(() => buildParticles(nonce), [nonce]);
  const kfName = useMemo(() => `cb-${nonce % 12}`, [nonce]);

  if (!visible) return null;

  return (
    <div className="confetti" aria-hidden="true">
      {particles.map((p) => {
        let borderRadius: string;
        let clipPath: string | undefined;
        if (p.shape === 'circle') {
          borderRadius = '50%';
        } else if (p.shape === 'star') {
          borderRadius = '1px';
          clipPath =
            'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';
        } else {
          borderRadius = '2px';
        }
        const style: React.CSSProperties = {
          background: p.color,
          width: p.shape === 'circle' ? p.size : p.width,
          height: p.shape === 'circle' ? p.size : p.height,
          borderRadius,
          clipPath,
          ['--dx' as string]: `${p.dx}px`,
          ['--dy' as string]: `${p.dy}px`,
          ['--g' as string]: `${p.gravity}px`,
          ['--rs' as string]: String(p.rotStart),
          ['--rspeed' as string]: `${p.rotSpeed / 360}`,
          ['--ry' as string]: String(p.rotY),
          ['--oe' as string]: String(p.opacityEnd),
          animation: `${kfName} ${p.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}ms both`,
          top: '18%',
          boxShadow: `0 0 8px ${p.color}80`,
        };
        return <span key={p.id} className="particle" style={style} />;
      })}
      <style>{`
        .confetti .particle {
          position: absolute;
          left: 50%;
          opacity: 0;
          pointer-events: none;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
