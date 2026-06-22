import { motion } from 'framer-motion'
import type { ColorScheme } from '../types'
import { formatDate } from '../utils/colorUtils'

interface GalleryCardProps {
  scheme: ColorScheme
  index: number
  onClick: () => void
}

export default function GalleryCard({ scheme, index, onClick }: GalleryCardProps) {
  const primaryColor = scheme.colors[0]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      style={{
        width: 160,
        height: 160,
        borderRadius: 12,
        backgroundColor: 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
      onClick={onClick}
    >
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: primaryColor
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          right: 8,
          display: 'flex',
          gap: 4
        }}>
          {scheme.colors.slice(1).map((color, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 20,
                borderRadius: 4,
                backgroundColor: color
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {scheme.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {formatDate(scheme.createdAt)}
        </div>
      </div>
    </motion.div>
  )
}
