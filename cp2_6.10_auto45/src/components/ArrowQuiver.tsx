import React from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { GameEngine } from '@/game/GameEngine'
import Arrow from './Arrow'

interface ArrowQuiverProps {
  onArrowSelect: (featherColor: string) => void
}

const ArrowQuiver: React.FC<ArrowQuiverProps> = ({ onArrowSelect }) => {
  const { arrowsRemaining, animating } = useGameStore()

  const arrows = Array.from({ length: arrowsRemaining }, (_, i) => ({
    id: i,
    color: GameEngine.drawArrow(),
  }))

  return (
    <div className="arrow-quiver" style={{ position: 'relative' }}>
      <svg width="80" height="150" viewBox="0 0 80 150">
        <defs>
          <linearGradient id="bambooGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c4a574" />
            <stop offset="50%" stopColor="#d2b48c" />
            <stop offset="100%" stopColor="#b8996c" />
          </linearGradient>
          <pattern id="bambooWeave" patternUnits="userSpaceOnUse" width="8" height="8">
            <path d="M0 4 L8 4 M4 0 L4 8" stroke="#a08050" strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>

        <ellipse cx="40" cy="140" rx="30" ry="8" fill="rgba(0,0,0,0.3)" />

        <path
          d="M12 20 Q8 40 10 100 L15 135 Q20 145 40 145 Q60 145 65 135 L70 100 Q72 40 68 20 Z"
          fill="url(#bambooGradient)"
          stroke="#8b7355"
          strokeWidth="2"
        />

        <path
          d="M12 20 Q8 40 10 100 L15 135 Q20 145 40 145 Q60 145 65 135 L70 100 Q72 40 68 20 Z"
          fill="url(#bambooWeave)"
          opacity="0.4"
        />

        <ellipse cx="40" cy="20" rx="28" ry="6" fill="#8b7355" />
        <ellipse cx="40" cy="18" rx="25" ry="4" fill="#a08050" />

        <rect x="10" y="25" width="3" height="110" fill="#8b7355" opacity="0.5" />
        <rect x="38" y="25" width="3" height="110" fill="#8b7355" opacity="0.5" />
        <rect x="67" y="25" width="3" height="110" fill="#8b7355" opacity="0.5" />

        <rect x="12" y="35" width="56" height="2" fill="#d4af37" />
        <rect x="12" y="110" width="56" height="2" fill="#d4af37" />

        <text x="40" y="80" textAnchor="middle" fill="#6b4e2e" fontSize="12" fontFamily="KaiTi">
          箭筒
        </text>
      </svg>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {arrows.map((arrow, index) => (
          <Arrow
            key={arrow.id}
            featherColor={arrow.color}
            isInQuiver={true}
            index={index}
            onLaunch={!animating ? () => onArrowSelect(arrow.color) : undefined}
          />
        ))}
      </div>

      {arrowsRemaining === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#f5deb3',
            fontSize: '14px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          箭已用完
        </motion.div>
      )}
    </div>
  )
}

export default ArrowQuiver
