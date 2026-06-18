import { motion, AnimatePresence } from 'framer-motion'
import { EmotionType } from './types'

interface MiniFigureProps {
  dominantEmotion: EmotionType | 'equal' | 'empty'
}

function Eyes({ type }: { type: EmotionType | 'equal' | 'empty' }) {
  const eyeColor = type === 'anger' ? '#C0392B' : '#2C3E50'

  if (type === 'anger') {
    return (
      <>
        <svg width="80" height="30" viewBox="0 0 80 30" style={{ position: 'absolute', top: 50, left: 40 }}>
          <polygon
          points="10,25 20,5 30,25"
          fill="none"
          stroke={eyeColor}
          strokeWidth="3"
          strokeLinejoin="round"
        />
          <polygon
          points="50,25 60,5 70,25"
          fill="none"
          stroke={eyeColor}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        </svg>
      </>
    )
  }

  if (type === 'calm') {
    return (
      <>
        <svg width="80" height="30" viewBox="0 0 80 30" style={{ position: 'absolute', top: 50, left: 40 }}>
          <path
            d="M 5,20 Q 20,5 35,20"
            fill="none"
            stroke={eyeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 45,20 Q 60,5 75,20"
            fill="none"
            stroke={eyeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </>
    )
  }

  return (
    <>
      <svg width="80" height="30" viewBox="0 0 80 30" style={{ position: 'absolute', top: 50, left: 40 }}>
        <circle cx="20" cy="15" r="10" fill="#2C3E50" />
        <circle cx="60" cy="15" r="10" fill="#2C3E50" />
      </svg>
    </>
  )
}

function Mouth({ type }: { type: EmotionType | 'equal' | 'empty' }) {
  if (type === 'anger') {
    return (
      <svg width="80" height="30" viewBox="0 0 80 30" style={{ position: 'absolute', top: 100, left: 40 }}>
        <path
          d="M 15,5 Q 40,25 65,5"
          fill="none"
          stroke="#2C3E50"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'calm') {
    return (
      <svg width="80" height="30" viewBox="0 0 80 30" style={{ position: 'absolute', top: 100, left: 40 }}>
        <line
          x1="15"
          y1="15"
          x2="65"
          y2="15"
          stroke="#2C3E50"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg width="80" height="30" viewBox="0 0 80 30" style={{ position: 'absolute', top: 100, left: 40 }}>
      <ellipse cx="40" cy="15" rx="18" ry="12" fill="none" stroke="#2C3E50" strokeWidth="3" />
    </svg>
  )
}

function Head({ emotion }: { emotion: EmotionType | 'equal' | 'empty' }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '160px',
        height: '160px',
      }}
    >
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
      >
        <defs>
          <radialGradient id="headGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFE95C" />
            <stop offset="100%" stopColor="#FFD700" />
          </radialGradient>
          <pattern id="studs" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.25)" />
          </pattern>
        </defs>
        <rect
          x="10"
          y="10"
          width="140"
          height="140"
          rx="24"
          fill="url(#headGrad)"
          stroke="#333333"
          strokeWidth="4"
        />
        <rect
          x="10"
          y="10"
          width="140"
          height="140"
          rx="24"
          fill="url(#studs)"
        />
      </svg>
      <Eyes type={emotion} />
      <Mouth type={emotion} />
    </div>
  )
}

export default function MiniFigure({ dominantEmotion }: MiniFigureProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dominantEmotion}
        initial={{ filter: 'grayscale(100%)' }}
        animate={{ filter: 'grayscale(0%)' }}
        exit={{ filter: 'grayscale(100%)' }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <Head emotion={dominantEmotion} />
      </motion.div>
    </AnimatePresence>
  )
}
