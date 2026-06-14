import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

interface ParticleProps {
  x: number
  y: number
  color?: string
  count?: number
  spread?: number
  trigger: number
  sizeRange?: [number, number]
}

interface Particle {
  id: number
  angle: number
  distance: number
  size: number
  delay: number
  life: number
}

export const ParticleBurst: React.FC<ParticleProps> = ({
  x,
  y,
  color = '#00FFFF',
  count = 18,
  spread = 80,
  trigger,
  sizeRange = [3, 7]
}) => {
  const [gen, setGen] = useState(0)
  const prev = React.useRef(trigger)

  useEffect(() => {
    if (trigger !== prev.current) {
      prev.current = trigger
      setGen((g) => g + 1)
    }
  }, [trigger])

  const particles = useMemo<Particle[]>(() => {
    const arr: Particle[] = []
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        angle: (Math.PI * 2 * i) / count + Math.random() * 0.5,
        distance: spread * (0.4 + Math.random() * 0.8),
        size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
        delay: Math.random() * 60,
        life: 400 + Math.random() * 400
      })
    }
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gen])

  if (gen === 0) return null

  return (
    <div
      key={gen}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 50
      }}
    >
      {particles.map((p) => {
        const endX = Math.cos(p.angle) * p.distance
        const endY = Math.sin(p.angle) * p.distance
        return (
          <motion.div
            key={p.id}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1
            }}
            animate={{
              x: endX,
              y: endY,
              opacity: 0,
              scale: 0.2
            }}
            transition={{
              duration: p.life / 1000,
              delay: p.delay / 1000,
              ease: [0.16, 1, 0.3, 1]
            }}
            style={{
              position: 'absolute',
              left: -p.size / 2,
              top: -p.size / 2,
              width: p.size,
              height: p.size,
              background: color,
              boxShadow: `0 0 ${p.size * 2}px ${color}, 0 0 ${p.size * 4}px ${color}88`,
              borderRadius: 2,
              clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)'
            }}
          />
        )
      })}
    </div>
  )
}
