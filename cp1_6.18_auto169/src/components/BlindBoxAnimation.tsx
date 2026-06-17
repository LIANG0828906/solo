import { useEffect, useRef, useState, useCallback } from 'react';
import { PetInstance, RARITY_COLORS, RARITY_LABELS } from '@/data/petData';

interface Props {
  pet: PetInstance | null;
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

const PARTICLE_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'];

export default function BlindBoxAnimation({ pet, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'flipping' | 'particles' | 'reveal'>('flipping');
  const [flipProgress, setFlipProgress] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const spawnParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 3,
      });
    }
    return particles;
  }, []);

  useEffect(() => {
    if (!pet) return;

    const flipStart = performance.now();
    const flipDuration = 800;

    const animateFlip = () => {
      const now = performance.now();
      const elapsed = now - flipStart;
      const progress = Math.min(1, elapsed / flipDuration);
      setFlipProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateFlip);
      } else {
        setPhase('particles');
        particlesRef.current = spawnParticles();

        const particleStart = performance.now();
        const particleDuration = 1000;

        const animateParticles = () => {
          const elapsed = performance.now() - particleStart;
          const pProgress = Math.min(1, elapsed / particleDuration);

          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = canvas.offsetWidth * 2;
          canvas.height = canvas.offsetHeight * 2;
          ctx.scale(2, 2);

          ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

          const cx = canvas.offsetWidth / 2;
          const cy = canvas.offsetHeight / 2;

          for (const p of particlesRef.current) {
            p.x += p.vx;
            p.y += p.vy;
            p.life = 1 - pProgress;
            const alpha = Math.max(0, p.life);
            const size = p.size * (1 - pProgress * 0.9);

            ctx.beginPath();
            ctx.arc(cx + p.x, cy + p.y, size, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.fill();
          }

          if (pProgress < 1) {
            animFrameRef.current = requestAnimationFrame(animateParticles);
          } else {
            setPhase('reveal');
            setTimeout(onComplete, 1500);
          }
        };

        animFrameRef.current = requestAnimationFrame(animateParticles);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFlip);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [pet, onComplete, spawnParticles]);

  if (!pet) return null;

  const rarityColor = RARITY_COLORS[pet.rarity];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div style={{ position: 'relative', width: 280, height: 380 }}>
        {(phase === 'flipping' || phase === 'particles') && (
          <div
            style={{
              width: 280,
              height: 380,
              perspective: 800,
              position: 'absolute',
              inset: 0,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s ease-in-out',
                transform: `rotateY(${flipProgress * 180}deg)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #2a2a4a, #1a1a3a)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                }}
              >
                ❓
              </div>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${rarityColor}33, #1a1a3a)`,
                  border: `2px solid ${rarityColor}66`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: '#fff',
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: rarityColor,
                    boxShadow: `0 0 24px ${rarityColor}88`,
                  }}
                />
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>
                  {pet.name}
                </div>
                <span
                  style={{
                    padding: '4px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    background: `${rarityColor}33`,
                    color: rarityColor,
                    border: `1px solid ${rarityColor}55`,
                  }}
                >
                  {RARITY_LABELS[pet.rarity]}
                </span>
                <div style={{ fontSize: 14, color: '#FFD700' }}>⚔️ {pet.power}</div>
              </div>
            </div>
          </div>
        )}

        {phase === 'reveal' && (
          <div
            style={{
              width: 280,
              height: 380,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${rarityColor}33, #1a1a3a)`,
              border: `2px solid ${rarityColor}66`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: '#fff',
              animation: 'glowPulse 1s ease-in-out infinite',
              boxShadow: `0 0 30px ${rarityColor}44`,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: rarityColor,
                boxShadow: `0 0 24px ${rarityColor}88`,
              }}
            />
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>
              {pet.name}
            </div>
            <span
              style={{
                padding: '4px 14px',
                borderRadius: 10,
                fontSize: 13,
                background: `${rarityColor}33`,
                color: rarityColor,
                border: `1px solid ${rarityColor}55`,
              }}
            >
              {RARITY_LABELS[pet.rarity]}
            </span>
            <div style={{ fontSize: 14, color: '#FFD700' }}>⚔️ {pet.power}</div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
