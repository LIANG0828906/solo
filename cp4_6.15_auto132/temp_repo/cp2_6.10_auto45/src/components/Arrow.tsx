import React, { useEffect, useCallback } from 'react'
import { motion, useMotionValue, useTransform, animate, type AnimationPlaybackControls } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { useGameStore } from '@/store/gameStore'
import { GameEngine } from '@/game/GameEngine'
import type { FeatherColor, PowerLevel, HitResult } from '@/store/gameStore'

interface ArrowProps {
  featherColor: FeatherColor
  isInQuiver?: boolean
  index?: number
  onLaunch?: () => void
}

const Arrow: React.FC<ArrowProps> = ({ featherColor, isInQuiver = false, index = 0, onLaunch }) => {
  const { currentArrow, addParticles, addFallingFeather } = useGameStore()

  const getFeatherColorHex = (color: FeatherColor): string => {
    switch (color) {
      case 'red':
        return '#dc143c'
      case 'blue':
        return '#4169e1'
      case 'green':
        return '#228b22'
    }
  }

  const featherHex = getFeatherColorHex(featherColor)

  const arrowX = useMotionValue(0)
  const arrowY = useMotionValue(0)
  const arrowRotation = useMotionValue(0)

  const trailOpacity = useTransform(arrowX, [0, 100], [1, 0])

  useEffect(() => {
    if (currentArrow && currentArrow.id === `arrow-${featherColor}-${index}`) {
      const startX = window.innerWidth * 0.3
      const startY = window.innerHeight * 0.6
      const endX = currentArrow.endX
      const endY = currentArrow.endY

      arrowX.set(startX)
      arrowY.set(startY)

      arrowRotation.set(-currentArrow.angle)

      const controls = animateArrow(startX, startY, endX, endY, currentArrow.angle, currentArrow.power)

      return () => {
        controls.stop()
      }
    }
  }, [currentArrow, featherColor, index])

  const animateArrow = (startX: number, startY: number, endX: number, endY: number, angle: number, power: PowerLevel): AnimationPlaybackControls => {
    const duration = power === 'light' ? 1.5 : power === 'medium' ? 1.2 : 0.9
    const midX = (startX + endX) / 2
    const peakHeight = Math.min(startY, endY) - 150

    const xKeyframes = [startX, midX, endX]
    const yKeyframes = [startY, peakHeight, endY]
    const rotateKeyframes = [-angle, 0, angle * 0.5]

    const controls = animate(arrowX, xKeyframes, {
      duration,
      ease: 'easeOut',
    })

    animate(arrowY, yKeyframes, {
      duration,
      ease: 'easeOut',
    })

    animate(arrowRotation, rotateKeyframes, {
      duration,
      ease: 'easeOut',
    })

    return controls
  }

  const handleImpact = useCallback(
    (hitResult: HitResult) => {
      if (!currentArrow) return

      const endX = currentArrow.endX
      const endY = currentArrow.endY

      if (hitResult === 'inner') {
        const particles = GameEngine.createFeatherParticles(endX, endY, featherColor)
        addParticles(particles)

        for (let i = 0; i < 3; i++) {
          addFallingFeather({
            id: uuidv4(),
            x: endX + (Math.random() - 0.5) * 30,
            y: endY,
            color: featherHex,
            rotation: Math.random() * 360,
          })
        }
      } else if (hitResult === 'miss') {
        const particles = GameEngine.createDustParticles(endX, endY)
        addParticles(particles)
      }
    },
    [currentArrow, featherColor, featherHex, addParticles, addFallingFeather]
  )

  if (isInQuiver) {
    return (
      <motion.div
        className="arrow-in-quiver"
        style={{
          position: 'absolute',
          bottom: index * 8,
          left: 15 + index * 3,
          transformOrigin: 'bottom center',
          cursor: onLaunch ? 'pointer' : 'default',
        }}
        animate={{
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.1,
        }}
        whileHover={{
          rotate: [-3, 3, -3],
          transition: { duration: 0.3, repeat: Infinity },
        }}
        onClick={onLaunch}
      >
        <svg width="8" height="120" viewBox="0 0 8 120">
          <rect x="3" y="15" width="2" height="90" fill="#c8a86e" rx="1" />

          <path d="M2 105 L4 100 L6 105 L4 115 Z" fill="#8b7355" />

          <g transform="translate(0, 5)">
            <polygon points="4,0 0,15 8,15" fill={featherHex} opacity="0.9" />
            <polygon points="4,0 1,12 7,12" fill={featherHex} opacity="0.7" />
            <line x1="4" y1="2" x2="4" y2="14" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          </g>
        </svg>
      </motion.div>
    )
  }

  if (!currentArrow || currentArrow.id !== `arrow-${featherColor}-${index}`) {
    return null
  }

  const bezierPath = GameEngine.getBezierPath(
    currentArrow.startX,
    currentArrow.startY,
    currentArrow.endX,
    currentArrow.endY,
    currentArrow.angle
  )

  return (
    <>
      <svg className="trajectory-path" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 70 }}>
        <defs>
          <linearGradient id={`trailGradient-${featherColor}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={featherHex} stopOpacity="0.8" />
            <stop offset="100%" stopColor={featherHex} stopOpacity="0" />
          </linearGradient>
          <filter id="glowTrail">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d={bezierPath}
          fill="none"
          stroke={`url(#trailGradient-${featherColor})`}
          strokeWidth="3"
          strokeDasharray="8 4"
          filter="url(#glowTrail)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: currentArrow.power === 'light' ? 1.5 : currentArrow.power === 'medium' ? 1.2 : 0.9 }}
          onAnimationComplete={() => handleImpact(currentArrow.hitResult)}
        />
      </svg>

      <motion.div
        className="arrow-flying"
        style={{
          x: arrowX,
          y: arrowY,
          rotate: arrowRotation,
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            width: 60,
            height: 6,
            background: `linear-gradient(90deg, transparent, ${featherHex}, transparent)`,
            filter: 'blur(3px)',
            opacity: trailOpacity,
            left: -50,
            top: 0,
          }}
        />

        <svg width="80" height="20" viewBox="0 0 80 20" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="shaftGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b7355" />
              <stop offset="20%" stopColor="#c8a86e" />
              <stop offset="100%" stopColor="#c8a86e" />
            </linearGradient>
          </defs>

          <rect x="15" y="9" width="50" height="3" fill="url(#shaftGradient)" rx="1.5" />

          <path d="M65 7.5 L75 10.5 L65 13.5 Z" fill="#8b7355" />
          <circle cx="72" cy="10.5" r="2" fill="#6b5344" />

          <g transform="translate(5, 0)">
            <polygon points="15,10 0,0 0,20" fill={featherHex} opacity="0.9" />
            <polygon points="12,10 3,3 3,17" fill={featherHex} opacity="0.7" />
            <polygon points="9,10 5,6 5,14" fill={featherHex} opacity="0.5" />
            <line x1="15" y1="10" x2="2" y2="10" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
          </g>
        </svg>
      </motion.div>
    </>
  )
}

export default Arrow
