import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DragPosition } from '@/types';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  opacity: number;
  delay: number;
}

interface HerbParticleProps {
  position: DragPosition | null;
  maxParticles?: number;
}

export default function HerbParticle({
  position,
  maxParticles = 30,
}: HerbParticleProps) {
  const particlesRef = useRef<Particle[]>([]);
  const idCounterRef = useRef(0);
  const lastPositionRef = useRef<DragPosition | null>(null);

  useEffect(() => {
    if (!position) return;
    
    const lastPos = lastPositionRef.current;
    const distance = lastPos
      ? Math.sqrt(
          Math.pow(position.x - lastPos.x, 2) + Math.pow(position.y - lastPos.y, 2)
        )
      : 10;

    if (distance < 5) return;

    const newParticle: Particle = {
      id: idCounterRef.current++,
      x: position.x + (Math.random() - 0.5) * 20,
      y: position.y + (Math.random() - 0.5) * 20,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 1.5 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 0.2,
    };

    particlesRef.current = [
      ...particlesRef.current.slice(-(maxParticles - 1)),
      newParticle,
    ];

    lastPositionRef.current = { ...position };
  }, [position, maxParticles]);

  useEffect(() => {
    if (!position) {
      const timer = setTimeout(() => {
        particlesRef.current = [];
        lastPositionRef.current = null;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [position]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      <AnimatePresence>
        {particlesRef.current.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              scale: 0,
              opacity: 0,
            }}
            animate={{
              x: particle.x + (Math.random() - 0.5) * 40,
              y: particle.y - Math.random() * 100 - 50,
              scale: [0, 1, 0.5],
              opacity: [0, particle.opacity, 0],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: 'easeOut',
            }}
            className={cn(
              'absolute rounded-full',
              'bg-herb-green-light',
              'blur-[1px]'
            )}
            style={{
              width: particle.size,
              height: particle.size,
              boxShadow: `0 0 ${particle.size * 2}px rgba(74, 157, 87, 0.6)`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
