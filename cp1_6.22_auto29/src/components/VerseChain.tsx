import { useEffect, useRef } from 'react';
import type { Verse } from '../types';

interface Props {
  chain: Verse[];
  lastVerseId?: string;
}

export default function VerseChain({ chain, lastVerseId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<any[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life: number;
      rotation: number;
      rotationSpeed: number;
    }

    const createParticle = (): Particle => {
      const w = canvas.width;
      return {
        x: Math.random() * w,
        y: -30,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.3 + Math.random() * 0.6,
        size: 3 + Math.random() * 8,
        opacity: 0.25 + Math.random() * 0.35,
        life: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
      };
    };

    const drop = () => {
      if (particlesRef.current.length < 6) {
        particlesRef.current.push(createParticle());
      }
    };
    const dropInterval = setInterval(drop, 900);

    const drawInkBlob = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity * p.life;
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      const s = p.size;
      ctx.moveTo(-s, 0);
      ctx.bezierCurveTo(-s, -s * 0.7, 0, -s * 0.9, s * 0.7, -s * 0.3);
      ctx.bezierCurveTo(s * 1.1, s * 0.1, s * 0.5, s * 0.8, -s * 0.3, s * 0.6);
      ctx.bezierCurveTo(-s * 0.9, s * 0.4, -s, s * 0.1, -s, 0);
      ctx.fill();
      ctx.globalAlpha = p.opacity * p.life * 0.4;
      ctx.beginPath();
      ctx.arc(-s * 0.1, s * 0.3, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0 && p.y < canvas.height + 40);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height * 0.85) {
          p.life -= 0.015;
          p.vy *= 0.97;
        }
        drawInkBlob(p);
      }
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(dropInterval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <div className="ink-particles">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="scroll-unroll">
        <div className="verse-chain">
          {chain.length === 0 && (
            <div className="text-center mt-6 mb-6" style={{ color: '#8a7a6a', fontStyle: 'italic', fontSize: '1rem' }}>
              ~ 尚无诗句，静待首联之题 ~
            </div>
          )}

          {chain.map((verse, i) => (
            <div
              key={verse.id || `${verse.text}-${i}`}
              className={`verse-card ${verse.id === lastVerseId ? 'success' : ''}`}
              style={{
                animationDelay: `${i * 0.12}s`,
                ['--r' as any]: i % 2 === 0 ? '-0.5deg' : '0.5deg',
              } as React.CSSProperties}
            >
              <div
                style={{
                  fontFamily: "'Ma Shan Zheng', 'STKaiti', serif",
                  fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)',
                  letterSpacing: '0.06em',
                  lineHeight: 1.9,
                  color: '#1a1a1a',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: 32,
                  height: 32,
                  lineHeight: '32px',
                  textAlign: 'center',
                  marginRight: 12,
                  background: 'linear-gradient(135deg, #c9302c, #9e2522)',
                  color: '#f5f0e6',
                  borderRadius: '50%',
                  fontFamily: 'serif',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                }}>
                  {i + 1}
                </span>
                {verse.text}
              </div>

              <div
                className="verse-tooltip"
              >
                {verse.dynasty && `[${verse.dynasty}] `}
                {verse.author} · 《{verse.source}》
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 6,
                  fontSize: '0.8rem',
                  color: '#7a6a5a',
                }}
              >
                <span style={{ fontStyle: 'italic' }}>
                  {verse.dynasty && `${verse.dynasty}·`}{verse.author}《{verse.source}》
                </span>
                <span>
                  <span style={{ color: '#9e2522', fontWeight: 700 }}>{verse.firstChar}</span>
                  {' '}→{' '}
                  <span style={{ color: '#d4a84a', fontWeight: 700 }}>{verse.lastChar}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
