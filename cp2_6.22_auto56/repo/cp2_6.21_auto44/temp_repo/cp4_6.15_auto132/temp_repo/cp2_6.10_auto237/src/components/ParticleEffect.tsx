import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function ParticleEffect() {
  const { particles, clearParticles } = useGameStore((state) => ({
    particles: state.particles,
    clearParticles: state.clearParticles
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      clearParticles();
    }, 500);
    return () => clearInterval(interval);
  }, [clearParticles]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0.5, 
              opacity: 0 
            }}
            animate={{
              x: particle.x - window.innerWidth / 2,
              y: particle.y - window.innerHeight / 2 - 100,
              scale: [0.5, 1.5, 0],
              opacity: [0, 1, 0],
              rotate: [0, 360]
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 1.5,
              ease: 'easeOut'
            }}
            className="absolute left-1/2 top-1/2"
          >
            {particle.type === 'petal' ? (
              <svg width="12" height="12" viewBox="0 0 12 12">
                <ellipse
                  cx="6"
                  cy="3"
                  rx="3"
                  ry="5"
                  fill={particle.color}
                  transform="rotate(45 6 6)"
                />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d="M6 0 L7.5 4.5 L12 4.5 L8.5 7 L10 12 L6 9 L2 12 L3.5 7 L0 4.5 L4.5 4.5 Z"
                  fill={particle.color}
                />
              </svg>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function SuccessGlow() {
  const { feedback, setFeedback } = useGameStore((state) => ({
    feedback: state.feedback,
    setFeedback: state.setFeedback
  }));

  useEffect(() => {
    if (feedback.type === 'success') {
      const timer = setTimeout(() => {
        setFeedback(null, null);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [feedback, setFeedback]);

  return (
    <AnimatePresence>
      {feedback.type === 'success' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            boxShadow: 'inset 0 0 100px 20px rgba(245, 230, 184, 0.6)',
            background: 'radial-gradient(circle at center, transparent 40%, rgba(245, 230, 184, 0.2) 100%)'
          }}
        />
      )}
    </AnimatePresence>
  );
}
