import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface WaveformThumbProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  backgroundColor?: string
}

export function WaveformThumb({
  data,
  width = 120,
  height = 40,
  color = '#6C63FF',
  backgroundColor = '#3A3A5C'
}: WaveformThumbProps) {
  const barCount = data.length
  const barWidth = (width - 4) / barCount
  const maxHeight = height - 8

  const bars = useMemo(() => {
    return data.map((value, index) => {
      const barHeight = Math.max(2, value * maxHeight)
      const x = 2 + index * barWidth
      const y = (height - barHeight) / 2
      return { x, y, width: Math.max(1, barWidth - 1), height: barHeight }
    })
  }, [data, barWidth, maxHeight, height])

  return (
    <svg width={width} height={height} style={{ backgroundColor, borderRadius: 4 }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      {bars.map((bar, index) => (
        <motion.rect
          key={index}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx={1}
          fill={`url(#grad-${color})`}
          initial={{ height: 0, y: height / 2 }}
          animate={{ height: bar.height, y: bar.y }}
          transition={{ duration: 0.3, delay: index * 0.01 }}
        />
      ))}
    </svg>
  )
}
