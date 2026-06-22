import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

const ParticleEffects: React.FC = () => {
  const { particles, fallingFeathers, removeParticle, removeFallingFeather } = useGameStore()
  const animationFrameRef = useRef<number>()
  const particleRefs = useRef<Map<string, { x: number; y: number; vx: number; vy: number; life: number }>>(new Map())

  useEffect(() => {
    particles.forEach((p) => {
      if (!particleRefs.current.has(p.id)) {
        particleRefs.current.set(p.id, { ...p })
      }
    })

    const animate = () => {
      const toRemove: string[] = []

      particleRefs.current.forEach((state, id) => {
        state.x += state.vx
        state.y += state.vy
        state.vy += 0.1
        state.life -= 0.02

        if (state.life <= 0) {
          toRemove.push(id)
          removeParticle(id)
        }
      })

      toRemove.forEach((id) => particleRefs.current.delete(id))

      if (particleRefs.current.size > 0) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    if (particles.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [particles, removeParticle])

  return (
    <>
      {particles.map((particle) => {
        const state = particleRefs.current.get(particle.id)
        if (!state) return null

        return (
          <motion.div
            key={particle.id}
            className="particle"
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: state.life,
              scale: state.life * 1.5,
              x: state.x,
              y: state.y,
            }}
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: '50%',
              boxShadow: `0 0 ${particle.size}px ${particle.color}`,
              willChange: 'transform, opacity',
            }}
          />
        )
      })}

      <AnimatePresence>
        {fallingFeathers.map((feather) => (
          <motion.div
            key={feather.id}
            className="feather-falling"
            initial={{ y: feather.y, x: feather.x, opacity: 1, rotate: feather.rotation }}
            animate={{
              y: feather.y + 200,
              x: feather.x + Math.sin(feather.y * 0.05) * 30,
              opacity: 0,
              rotate: feather.rotation + 360,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            onAnimationComplete={() => removeFallingFeather(feather.id)}
            style={{
              width: 12,
              height: 20,
              willChange: 'transform, opacity',
            }}
          >
            <svg width="12" height="20" viewBox="0 0 12 20">
              <polygon points="6,0 0,20 12,20" fill={feather.color} opacity="0.9" />
              <polygon points="6,0 2,16 10,16" fill={feather.color} opacity="0.7" />
              <line x1="6" y1="2" x2="6" y2="18" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  )
}

export default ParticleEffects
