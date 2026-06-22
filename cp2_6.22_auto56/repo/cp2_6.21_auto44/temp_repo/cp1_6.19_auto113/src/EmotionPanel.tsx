import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { EMOTIONS, EmotionType } from './types'

interface DraggableBlockProps {
  type: EmotionType
  color: string
  labelCN: string
}

function DraggableBlock({ type, color, labelCN }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: type,
  })

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: '32px',
        height: '32px',
        background: color,
        borderRadius: '4px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging
          ? '0 6px 12px rgba(0,0,0,0.25)'
          : 'inset 0 -3px 0 rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative',
        touchAction: 'none',
        zIndex: isDragging ? 999 : 'auto',
      }}
      title={labelCN}
    >
      <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '10px',
        height: '10px',
        background: 'rgba(255,255,255,0.35)',
        borderRadius: '50%',
        boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.15)',
      }}
    />
    </motion.div>
  )
}

export default function EmotionPanel() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '3px solid #333333',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#333333',
          textAlign: 'center',
          marginBottom: '4px',
        }}
      >
          情绪积木
        </h3>
      <p
        style={{
          fontSize: '11px',
          color: '#666',
          textAlign: 'center',
          marginTop: '-8px',
          marginBottom: '4px',
        }}
      >
          拖拽到收集区
        </p>
      {EMOTIONS.map(emotion => (
        <div
          key={emotion.type}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <DraggableBlock
            type={emotion.type}
            color={emotion.color}
            labelCN={emotion.labelCN}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#333333',
            }}
          >
            {emotion.labelCN}
          </span>
        </div>
      ))}
    </div>
  )
}
