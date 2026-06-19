import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface IceShardProps {
  x: number
  y: number
  cellSize: number
  onComplete: () => void
}

const SHARD_COUNT = 6

export function IceShard({ x, y, cellSize, onComplete }: IceShardProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600)
    return () => clearTimeout(timer)
  }, [onComplete])

  const shards = Array.from({ length: SHARD_COUNT }, (_, i) => {
    const angle = (i / SHARD_COUNT) * Math.PI * 2 + Math.PI / SHARD_COUNT
    return {
      id: i,
      angle,
      distance: 35 + Math.random() * 15,
      rotation: Math.random() * 360,
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
        {shards.map(shard => (
          <motion.div
            key={shard.id}
            className="absolute"
            style={{
              width: 12,
              height: 12,
              left: -6,
              top: -6,
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: shard.rotation }}
            animate={{
              x: Math.cos(shard.angle) * shard.distance,
              y: Math.sin(shard.angle) * shard.distance,
              scale: 0,
              opacity: 0,
              rotate: shard.rotation + 180,
            }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <polygon
                points="6,0 12,4 10,12 2,12 0,4"
                fill="#81D4FA"
                stroke="#4FC3F7"
                strokeWidth="1"
              />
              <polygon
                points="6,2 10,5 8,10 4,10 2,5"
                fill="rgba(255,255,255,0.5)"
              />
            </svg>
          </motion.div>
        ))}
        <motion.div
          className="absolute"
          style={{
            width: 30,
            height: 30,
            left: -15,
            top: -15,
          }}
          initial={{ scale: 0, opacity: 1, rotate: 0 }}
          animate={{ scale: 1.5, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30">
            <polygon
              points="15,0 26,8 26,22 15,30 4,22 4,8"
              fill="none"
              stroke="#81D4FA"
              strokeWidth="2"
            />
          </svg>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
