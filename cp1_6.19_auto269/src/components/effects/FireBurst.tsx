import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FireBurstProps {
  x: number
  y: number
  cellSize: number
  onComplete: () => void
}

const PARTICLE_COUNT = 48

export function FireBurst({ x, y, cellSize, onComplete }: FireBurstProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 500)
    return () => clearTimeout(timer)
  }, [onComplete])

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2
    const distance = 20 + Math.random() * 20
    return {
      id: i,
      angle,
      distance,
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.1,
    }
  })

  const centerX = x * cellSize + cellSize / 2
  const centerY = y * cellSize + cellSize / 2

  return (
    <AnimatePresence>
      <div
        className="absolute pointer-events-none overflow-visible"
        style={{
          left: centerX,
          top: centerY,
          zIndex: 100,
        }}
      >
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              background: `radial-gradient(circle, #FF6B35 0%, #FF8C00 50%, #FFD700 100%)`,
              boxShadow: '0 0 10px #FF6B35, 0 0 20px #FF8C00',
              left: -particle.size / 2,
              top: -particle.size / 2,
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos(particle.angle) * particle.distance,
              y: Math.sin(particle.angle) * particle.distance,
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.5,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          />
        ))}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 40,
            height: 40,
            left: -20,
            top: -20,
            background: 'radial-gradient(circle, rgba(255,200,50,0.8) 0%, rgba(255,100,0,0.4) 50%, transparent 70%)',
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </AnimatePresence>
  )
}
