import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import type { HitZones } from '@/game/GameEngine'

interface PitcherProps {
  onHitZonesReady?: (zones: HitZones) => void
}

const Pitcher: React.FC<PitcherProps> = ({ onHitZonesReady }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isShaking, setIsShaking] = useState(false)
  const { pitcherHovered, setPitcherHovered } = useGameStore()

  useEffect(() => {
    if (containerRef.current && onHitZonesReady) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const hitZones: HitZones = {
        inner: {
          x: centerX,
          y: centerY - 80,
          width: 40,
          height: 40,
        },
        leftEar: {
          x: centerX - 55,
          y: centerY - 80,
          width: 25,
          height: 25,
        },
        rightEar: {
          x: centerX + 55,
          y: centerY - 80,
          width: 25,
          height: 25,
        },
      }
      onHitZonesReady(hitZones)
    }
  }, [onHitZonesReady])

  const playSound = useCallback((type: 'inner' | 'ear') => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)

    if (type === 'inner') {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } else {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2)
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    }
  }, [])

  useEffect(() => {
    const handlePitcherHit = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: 'inner' | 'ear' }>
      playSound(customEvent.detail.type)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('pitcherHit', handlePitcherHit as EventListener)
    }

    return () => {
      if (container) {
        container.removeEventListener('pitcherHit', handlePitcherHit as EventListener)
      }
    }
  }, [playSound])

  return (
    <div
      ref={containerRef}
      className="pitcher-wrapper"
      onMouseEnter={() => setPitcherHovered(true)}
      onMouseLeave={() => setPitcherHovered(false)}
    >
      <motion.div
        animate={isShaking ? { x: [-3, 3, -3, 3, 0], rotate: [-1, 1, -1, 1, 0] } : {}}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ position: 'relative', width: 120, height: 200 }}
      >
        <svg width="120" height="200" viewBox="0 0 120 200">
          <defs>
            <linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c8a050" />
              <stop offset="50%" stopColor="#a07840" />
              <stop offset="100%" stopColor="#6b4e2e" />
            </linearGradient>
            <linearGradient id="brassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
            <pattern id="taotiePattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <path d="M10 0 L15 5 L10 10 L5 5 Z M0 10 L5 15 L10 10 L5 5 Z M20 10 L15 15 L10 10 L15 5 Z" fill="none" stroke="#4a3728" strokeWidth="0.5" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse cx="60" cy="185" rx="45" ry="8" fill="#4a3728" opacity="0.5" />

          <path
            d="M25 180 Q20 150 25 120 L30 80 Q35 50 45 45 L45 35 Q40 30 40 25 L40 15 Q40 5 60 5 Q80 5 80 15 L80 25 Q80 30 75 35 L75 45 Q85 50 90 80 L95 120 Q100 150 95 180 Z"
            fill="url(#bronzeGradient)"
            stroke="#4a3728"
            strokeWidth="2"
          />

          <path
            d="M25 180 Q20 150 25 120 L30 80 Q35 50 45 45 L45 35 Q40 30 40 25 L40 15 Q40 5 60 5 Q80 5 80 15 L80 25 Q80 30 75 35 L75 45 Q85 50 90 80 L95 120 Q100 150 95 180 Z"
            fill="url(#taotiePattern)"
            opacity="0.3"
          />

          <ellipse cx="60" cy="5" rx="20" ry="5" fill="#5a4028" />
          <ellipse cx="60" cy="8" rx="18" ry="4" fill="#6b4e2e" />
          
          <AnimatePresence>
            {pitcherHovered && (
              <motion.ellipse
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                cx="60"
                cy="8"
                rx="22"
                ry="6"
                fill="rgba(255, 215, 0, 0.4)"
                filter="url(#glow)"
              />
            )}
          </AnimatePresence>

          <rect x="38" y="12" width="44" height="3" fill="url(#brassGradient)" />

          <g filter={pitcherHovered ? 'url(#glow)' : undefined}>
            <path
              d="M15 35 Q0 35 0 50 Q0 65 15 65 L25 65 L25 35 Z"
              fill="url(#bronzeGradient)"
              stroke="#d4af37"
              strokeWidth="1.5"
            />
            <rect x="8" y="42" width="12" height="16" fill="rgba(0,0,0,0.3)" rx="2" />

            <path
              d="M105 35 Q120 35 120 50 Q120 65 105 65 L95 65 L95 35 Z"
              fill="url(#bronzeGradient)"
              stroke="#d4af37"
              strokeWidth="1.5"
            />
            <rect x="100" y="42" width="12" height="16" fill="rgba(0,0,0,0.3)" rx="2" />
          </g>

          <ellipse cx="60" cy="180" rx="35" ry="8" fill="#5a4028" />
          <ellipse cx="60" cy="178" rx="30" ry="6" fill="#6b4e2e" />

          <path
            d="M30 75 L90 75"
            stroke="url(#brassGradient)"
            strokeWidth="2"
          />
          <path
            d="M32 120 L88 120"
            stroke="url(#brassGradient)"
            strokeWidth="1.5"
          />
          <path
            d="M35 160 L85 160"
            stroke="url(#brassGradient)"
            strokeWidth="1.5"
          />

          <text x="60" y="110" textAnchor="middle" fill="#4a3728" fontSize="12" fontFamily="KaiTi">
            投壶
          </text>
        </svg>

        <div
          className="hit-zone-inner"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 40,
            height: 15,
            cursor: 'pointer',
          }}
          data-hit-zone="inner"
        />

        <div
          className="hit-zone-left-ear"
          style={{
            position: 'absolute',
            top: 25,
            left: 0,
            width: 25,
            height: 35,
            cursor: 'pointer',
          }}
          data-hit-zone="left-ear"
        />

        <div
          className="hit-zone-right-ear"
          style={{
            position: 'absolute',
            top: 25,
            right: 0,
            width: 25,
            height: 35,
            cursor: 'pointer',
          }}
          data-hit-zone="right-ear"
        />
      </motion.div>
    </div>
  )
}

export default Pitcher
