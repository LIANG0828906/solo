import { motion } from 'framer-motion'
import { EMOTIONS, EmotionType } from './types'

interface BarChartProps {
  counts: Record<EmotionType, number>
  total: number
}

const MAX_BLOCKS_PER_BAR = 10
const BLOCK_SIZE = 12
const BLOCK_GAP = 2
const GAP_BETWEEN_BARS = 6

export default function BarChart({ counts, total }: BarChartProps) {
  const getBarHeight = (count: number): number => {
    if (total === 0) return 0
    const ratio = count / total
    return Math.max(0, Math.min(MAX_BLOCKS_PER_BAR, Math.round(ratio * MAX_BLOCKS_PER_BAR)))
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: `${GAP_BETWEEN_BARS}px`,
        height: `${(BLOCK_SIZE + BLOCK_GAP) * MAX_BLOCKS_PER_BAR}px`,
        paddingBottom: '4px',
      }}
    >
      {EMOTIONS.map((emotion, idx) => {
        const barBlocks = getBarHeight(counts[emotion.type])
        const blocks = Array.from({ length: barBlocks })

        return (
          <div
            key={emotion.type}
            style={{
              display: 'flex',
              flexDirection: 'column-reverse',
              alignItems: 'center',
              gap: `${BLOCK_GAP}px`,
            }}
          >
            {blocks.map((_, i) => (
              <motion.div
                key={`${emotion.type}-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: (idx * 0.03) + (i * 0.04),
                  duration: 0.4,
                  ease: 'easeOut',
                }}
                style={{
                  width: `${BLOCK_SIZE}px`,
                  height: `${BLOCK_SIZE}px`,
                  background: emotion.color,
                  borderRadius: '2px',
                  boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)',
                }}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
