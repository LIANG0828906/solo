import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpiceStore } from '../store/spiceStore';
import type { Particle } from '../types';

function ParticleBurst() {
  const particles = useSpiceStore(state => state.particles);
  const removeParticle = useSpiceStore(state => state.removeParticle);

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    particles.forEach(particle => {
      const interval = setInterval(() => {
        removeParticle(particle.id);
      }, 600);
      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval);
  }, [particles, removeParticle]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map(particle => (
          <ParticleItem key={particle.id} particle={particle} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ParticleItem({ particle }: { particle: Particle }) {
  return (
    <motion.div
      initial={{ scale: 1, opacity: 1 }}
      animate={{
        x: particle.vx * 30,
        y: particle.vy * 30 - 50,
        scale: 0,
        opacity: 0
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: particle.x,
        top: particle.y,
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: particle.color,
        boxShadow: `0 0 4px ${particle.color}`,
        willChange: 'transform, opacity'
      }}
    />
  );
}

export default ParticleBurst;
