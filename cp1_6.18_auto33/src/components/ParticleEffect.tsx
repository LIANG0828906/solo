import { useEffect, useState } from 'react'
import './ParticleEffect.css'

interface ParticleProps {
  x: number
  y: number
  color: string
  onComplete: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  dx: number
  dy: number
  duration: number
}

export const ParticleEffect = ({ x, y, color, onComplete }: ParticleProps) => {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const count = 10 + Math.floor(Math.random() * 6)
    const colors = ['#6C63FF', '#4ECDC4', '#FF6B6B', color]
    const newParticles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const distance = 40 + Math.random() * 40
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        size: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        duration: 0.6 + Math.random() * 0.2,
      })
    }

    setParticles(newParticles)

    const timer = setTimeout(() => {
      onComplete()
    }, 900)

    return () => clearTimeout(timer)
  }, [x, y, color, onComplete])

  return (
    <div className="particle-container" style={{ left: x, top: y }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: `translate(${p.dx}px, ${p.dy}px)`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
