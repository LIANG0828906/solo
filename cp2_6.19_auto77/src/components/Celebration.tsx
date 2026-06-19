import { useEffect, useMemo, useState } from 'react';

const CONFETTI_COLORS = [
  '#e94560', '#f5c542', '#3fb950', '#58a6ff',
  '#bc8cff', '#ffa657', '#79c0ff', '#ff7b72',
];

interface Particle {
  id: number;
  color: string;
  delay: number;
  rotateStart: number;
  rotateEnd: number;
  dx: number;
  dy: number;
  size: [number, number];
  rotateY: number;
}

interface CelebrationProps {
  trigger: number;
}

function buildParticles(nonce: number): Particle[] {
  const count = 80;
  const list: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const dx = side * (40 + Math.random() * 340);
    const dy = 40 + Math.random() * 300;
    list.push({
      id: nonce * 1000 + i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 80,
      rotateStart: Math.random() * 360,
      rotateEnd: (Math.random() * 720 - 360),
      dx,
      dy,
      size: [6 + Math.random() * 4, 10 + Math.random() * 8],
      rotateY: Math.random() * 720 - 360,
    });
  }
  return list;
}

export function Celebration({ trigger }: CelebrationProps) {
  const [nonce, setNonce] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger <= 0) return;
    setNonce((n) => n + 1);
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 1100);
    return () => window.clearTimeout(t);
  }, [trigger]);

  const particles = useMemo(() => buildParticles(nonce), [nonce]);

  if (!visible) return null;

  return (
    <div className="confetti" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            background: p.color,
            width: p.size[0],
            height: p.size[1],
            animationDelay: `${p.delay}ms`,
            // Keyframes defined in CSS: translate from center to sides.
            // Use individual CSS vars per particle for variety:
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            ['--rs' as string]: `${p.rotateStart}deg`,
            ['--re' as string]: `${p.rotateEnd}deg`,
            ['--ry' as string]: `${p.rotateY}deg`,
            animation: `confetti-burst-custom 1s ease-out ${p.delay}ms forwards`,
          } as React.CSSProperties}
        />
      ))}
      <style>
        {`
          @keyframes confetti-burst-custom {
            0% {
              opacity: 1;
              transform: translate(-50%, 0) rotate(var(--rs)) rotateY(0deg);
            }
            20% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translate(calc(-50% + var(--dx)), var(--dy))
                rotate(var(--re)) rotateY(var(--ry));
            }
          }
        `}
      </style>
    </div>
  );
}
