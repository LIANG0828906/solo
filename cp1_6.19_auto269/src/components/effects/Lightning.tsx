import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LightningProps {
  x: number
  y: number
  targetX?: number
  targetY?: number
  cellSize: number
  onComplete: () => void
}

export function Lightning({ x, y, targetX, targetY, cellSize, onComplete }: LightningProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 400)
    return () => clearTimeout(timer)
  }, [onComplete])

  const segments = useMemo(() => {
    const startX = x * cellSize + cellSize / 2
    const startY = y * cellSize + cellSize / 2
    const endX = targetX !== undefined ? targetX * cellSize + cellSize / 2 : startX + (Math.random() - 0.5) * 100
    const endY = targetY !== undefined ? targetY * cellSize + cellSize / 2 : startY + (Math.random() - 0.5) * 100

    const points: { x: number; y: number }[] = []
    const segmentCount = 5

    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount
      const baseX = startX + (endX - startX) * t
      const baseY = startY + (endY - startY) * t
      const offsetX = i > 0 && i < segmentCount ? (Math.random() - 0.5) * 16 : 0
      const offsetY = i > 0 && i < segmentCount ? (Math.random() - 0.5) * 16 : 0
      points.push({ x: baseX + offsetX, y: baseY + offsetY })
    }

    return points
  }, [x, y, targetX, targetY, cellSize])

  const pathData = segments.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const startX = x * cellSize + cellSize / 2
  const startY = y * cellSize + cellSize / 2

  return (
    <AnimatePresence>
      <svg
        className="absolute pointer-events-none overflow-visible"
        style={{
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d={pathData}
          fill="none"
          stroke="#CE93D8"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 1 }}
          animate={{ pathLength: 1, opacity: [1, 0.8, 1, 0] }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
        <motion.path
          d={pathData}
          fill="none"
          stroke="#E1BEE7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 1 }}
          animate={{ pathLength: 1, opacity: [1, 0.8, 1, 0] }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
        <motion.circle
          cx={startX}
          cy={startY}
          r="15"
          fill="rgba(206, 147, 216, 0.5)"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1.5, 0], opacity: [1, 0.8, 0] }}
          transition={{ duration: 0.4 }}
        />
      </svg>
    </AnimatePresence>
  )
}
