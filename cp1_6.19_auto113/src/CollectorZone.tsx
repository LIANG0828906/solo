import { useDroppable } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { EmotionBlock, getEmotionConfig } from './types'

interface CollectorZoneProps {
  blocks: EmotionBlock[]
  onRemoveBlock: (id: string) => void
}

interface CollectedBlockProps {
  block: EmotionBlock
  onRemove: (id: string) => void
}

function CollectedBlock({ block, onRemove }: CollectedBlockProps) {
  const config = getEmotionConfig(block.type)

  return (
    <motion.div
      layout
      initial={{ scale: 0, y: -30 }}
      animate={{
        scale: [0, 1.15, 1],
        y: [-30, -10, 0],
      }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onRemove(block.id)}
      style={{
        width: '28px',
        height: '28px',
        background: config.color,
        borderRadius: '3px',
        boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        position: 'relative',
      }}
      title={`${config.labelCN} - 点击移除`}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '9px',
          height: '9px',
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '50%',
        }}
      />
    </motion.div>
  )
}

export default function CollectorZone({ blocks, onRemoveBlock }: CollectorZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'collector-zone',
  })

  return (
    <div
      ref={setNodeRef}
      style={{
    minHeight: '120px',
    width: '280px',
    maxWidth: '100%',
    border: `2px dashed ${isOver ? '#333333' : '#999999'}`,
    borderRadius: '8px',
    background: isOver ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.31)',
    padding: '12px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignContent: 'flex-start',
    transition: 'all 0.2s ease',
    position: 'relative',
  }}
>
  {blocks.length === 0 && (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <span style={{ fontSize: '20px' }}>📥</span>
      <span style={{ fontSize: '12px', color: '#666' }}>
        拖拽情绪积木到这里
      </span>
    </div>
  )}
  <AnimatePresence mode="popLayout">
    {blocks.map(block => (
      <CollectedBlock
        key={block.id}
        block={block}
        onRemove={onRemoveBlock}
      />
    ))}
  </AnimatePresence>
    </div>
  )
}
