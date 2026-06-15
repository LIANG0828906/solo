import React from 'react'
import { motion } from 'framer-motion'
import { useLockStore } from '../store/useLockStore'
import { PIECE_CONFIGS, PIECE_NAMES } from '../utils/constants'

export const BambooPanel: React.FC = () => {
  const activePieceId = useLockStore(state => state.activePieceId)
  const pieces = useLockStore(state => state.pieces)

  const getStatusText = (pieceId: number) => {
    const piece = pieces.find(p => p.id === pieceId)
    if (!piece) return ''
    if (piece.isDragging) return '拖拽中'
    if (piece.isDetached) return '已脱离'
    if (piece.isInSlot) return '已归位'
    return '移动中'
  }

  return (
    <div style={{
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '120px',
      background: 'linear-gradient(180deg, #d4c294 0%, #c4b284 50%, #d4c294 100%)',
      borderRadius: '4px',
      padding: '15px 10px',
      boxShadow: 'inset 0 0 20px rgba(139, 90, 43, 0.3), 0 4px 15px rgba(0,0,0,0.3)',
      border: '2px solid #8b5a2b',
      fontFamily: "'ZCOOL XiaoWei', serif",
      zIndex: 100
    }}>
      <div style={{
        textAlign: 'center',
        color: '#4a3520',
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '2px solid #8b5a2b',
        letterSpacing: '2px'
      }}>
        孔明锁
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {PIECE_NAMES.map((name, index) => {
          const config = PIECE_CONFIGS[index]
          const isActive = activePieceId === index
          const status = getStatusText(index)

          return (
            <motion.div
              key={name}
              animate={isActive ? {
                scale: [1, 1.08, 1],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              } : {}}
              style={{
                padding: '8px 6px',
                borderRadius: '3px',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(255,215,0,0.3), rgba(255,193,7,0.1))'
                  : 'rgba(139, 90, 43, 0.1)',
                borderLeft: `4px solid ${config.color}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                color: isActive ? '#ffd700' : '#3d2817',
                fontSize: '14px',
                fontWeight: isActive ? 'bold' : 'normal',
                textShadow: isActive ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
                marginBottom: '2px'
              }}>
                {name}
              </div>
              <div style={{
                color: isActive ? '#e6a800' : '#6b5040',
                fontSize: '10px',
                opacity: 0.8
              }}>
                {status}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div style={{
        marginTop: '12px',
        paddingTop: '8px',
        borderTop: '2px solid #8b5a2b',
        textAlign: 'center',
        fontSize: '10px',
        color: '#6b5040',
        lineHeight: '1.5'
      }}>
        <div>永乐十八年</div>
        <div style={{ fontSize: '8px', opacity: 0.7 }}>拖拽木条体验拆解</div>
      </div>
    </div>
  )
}
