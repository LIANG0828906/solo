import { motion } from 'framer-motion'
import { AnimationType } from '@/types'

interface AnimationWheelProps {
  blockId: string
  currentAnimation: AnimationType
  onSelect: (animation: AnimationType) => void
  onClose?: () => void
}

const animations: { type: Exclude<AnimationType, null>; name: string; icon: string }[] = [
  { type: 'pulse', name: '脉动', icon: '◉' },
  { type: 'float', name: '漂浮', icon: '↕' },
  { type: 'breathe', name: '呼吸', icon: '◐' },
  { type: 'flow', name: '流动', icon: '⇢' },
]

const springConfig = { stiffness: 200, damping: 20 }

export const AnimationWheel = ({ blockId, currentAnimation, onSelect }: AnimationWheelProps) => {
  const radius = 60
  const itemRadius = 28

  const handleWheelClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <motion.div
      className="absolute z-50"
      style={{
        left: '100%',
        top: '100%',
        transform: 'translate(50%, 50%)',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', ...springConfig }}
      onClick={handleWheelClick}
      data-block-id={blockId}
    >
      <div
        className="relative"
        style={{
          width: radius * 2,
          height: radius * 2,
        }}
      >
        <svg
          width={radius * 2}
          height={radius * 2}
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        >
          {animations.map((_, index) => {
            const angle = (index * 90 - 45) * (Math.PI / 180)
            const x1 = radius + Math.cos(angle) * (radius - itemRadius - 4)
            const y1 = radius + Math.sin(angle) * (radius - itemRadius - 4)
            const x2 = radius + Math.cos(angle + Math.PI / 2.2) * (radius - itemRadius - 4)
            const y2 = radius + Math.sin(angle + Math.PI / 2.2) * (radius - itemRadius - 4)
            const largeArc = 0
            return (
              <path
                key={index}
                d={`M ${radius} ${radius} L ${x1} ${y1} A ${radius - itemRadius - 4} ${radius - itemRadius - 4} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill="rgba(27, 40, 56, 0.6)"
                stroke="rgba(139, 157, 195, 0.3)"
                strokeWidth="1"
                style={{
                  backdropFilter: 'blur(8px)',
                }}
              />
            )
          })}
        </svg>

        {animations.map((anim, index) => {
          const angle = (index * 90) * (Math.PI / 180)
          const itemX = radius + Math.cos(angle - Math.PI / 4) * (radius - itemRadius)
          const itemY = radius + Math.sin(angle - Math.PI / 4) * (radius - itemRadius)
          const isActive = currentAnimation === anim.type

          return (
            <motion.button
              key={anim.type}
              className="absolute flex flex-col items-center justify-center rounded-full cursor-pointer"
              style={{
                width: itemRadius * 2,
                height: itemRadius * 2,
                left: itemX - itemRadius,
                top: itemY - itemRadius,
                background: isActive
                  ? 'rgba(201, 169, 110, 0.9)'
                  : 'rgba(27, 40, 56, 0.85)',
                backdropFilter: 'blur(8px)',
                border: `2px solid ${isActive ? '#C9A96E' : 'rgba(139, 157, 195, 0.5)'}`,
                boxShadow: isActive ? '0 0 20px rgba(201, 169, 110, 0.5)' : 'none',
              }}
              whileHover={{
                scale: 1.15,
                background: 'rgba(201, 169, 110, 0.9)',
                borderColor: '#C9A96E',
                boxShadow: '0 0 20px rgba(201, 169, 110, 0.5)',
              }}
              transition={{ type: 'spring', ...springConfig }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(anim.type)
              }}
              title={anim.name}
            >
              <span
                className="text-lg"
                style={{ color: isActive ? '#1B2838' : '#8B9DC3' }}
              >
                {anim.icon}
              </span>
              <span
                className="text-xs mt-0.5"
                style={{ color: isActive ? '#1B2838' : '#A5B1C2' }}
              >
                {anim.name}
              </span>
            </motion.button>
          )
        })}

        <motion.button
          className="absolute flex items-center justify-center rounded-full cursor-pointer"
          style={{
            width: 32,
            height: 32,
            left: radius - 16,
            top: radius - 16,
            background: 'rgba(27, 40, 56, 0.9)',
            border: '2px solid rgba(139, 157, 195, 0.5)',
            backdropFilter: 'blur(8px)',
          }}
          whileHover={{ scale: 1.1, borderColor: '#F3A683' }}
          transition={{ type: 'spring', ...springConfig }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(null)
          }}
          title="关闭动画"
        >
          <span className="text-sm" style={{ color: '#F3A683' }}>✕</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
