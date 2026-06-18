import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

interface ParticleEffectProps {
  position: { x: number; y: number } | null;
  onComplete?: () => void;
}

const COLORS = ['#6C5CE7', '#FD79A8', '#00B894', '#FDCB6E', '#74B9FF', '#E17055'];

export default function ParticleEffect({ position, onComplete }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!position) {
      setParticles([]);
      return;
    }

    startTimeRef.current = performance.now();
    const newParticles: Particle[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 80 + Math.random() * 120;
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
      });
    }

    setParticles(newParticles);

    const animate = (time: number) => {
      const elapsed = (time - startTimeRef.current) / 1000;
      const duration = 0.8;

      if (elapsed >= duration) {
        setParticles([]);
        onComplete?.();
        return;
      }

      const progress = elapsed / duration;

      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: p.vx * elapsed,
          y: p.vy * elapsed + 0.5 * 200 * elapsed * elapsed,
          life: 1 - progress * progress,
        }))
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [position, onComplete]);

  if (!position || particles.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 100,
        willChange: 'transform',
      }}
    >
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: p.life,
            scale: p.life > 0.5 ? 1 : p.life * 2,
          }}
          transition={{ duration: 0 }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            left: -p.size / 2,
            top: -p.size / 2,
          }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253,121,168,0.8) 0%, rgba(108,92,231,0.4) 50%, transparent 70%)',
          left: -20,
          top: -20,
        }}
      />
    </div>
  );
}
