import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ShadowDevourProps {
  x: number
  y: number
  cellSize: number
  onComplete: () => void
}

export function ShadowDevour({ x, y, cellSize, onComplete }: ShadowDevourProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 700)
    return () => clearTimeout(timer)
  }, [onComplete])

  const centerX = x * cellSize + cellSize / 2
  const centerY = y * cellSize + cellSize / 2

  const ashParticles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (i / 20) * Math.PI * 2,
    distance: 20 + Math.random() * 30,
    delay: 0.4 + Math.random() * 0.2,
    size: 3 + Math.random() * 4,
  }))

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
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 20,
            height: 20,
            left: -10,
            top: -10,
            background: 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(30,0,50,0.8) 50%, transparent 70%)',
            boxShadow: '0 0 30px #1a0033, 0 0 60px #0d001a',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2.5, 3], opacity: [0, 1, 1] }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute rounded-full"
          style={{
            width: 50,
            height: 50,
            left: -25,
            top: -25,
            border: '2px solid #4A148C',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 1.5], opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        <motion.div
          className="absolute rounded-full"
          style={{
            width: 70,
            height: 70,
            left: -35,
            top: -35,
            border: '1px solid #7B1FA2',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 1.8], opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
        />

        {ashParticles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              background: '#424242',
              left: -particle.size / 2,
              top: -particle.size / 2,
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
            animate={{
              x: Math.cos(particle.angle) * particle.distance,
              y: Math.sin(particle.angle) * particle.distance - 30,
              scale: 0,
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 0.4,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    </AnimatePresence>
  )
}
