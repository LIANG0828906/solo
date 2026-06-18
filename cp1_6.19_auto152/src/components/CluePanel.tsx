import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clue } from '../hooks/useGameState'

interface CluePanelProps {
  clues: Clue[]
  onClueClick?: (clue: Clue) => void
}

export default function CluePanel({ clues, onClueClick }: CluePanelProps) {
  const [expandedClue, setExpandedClue] = useState<string | null>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const collectedClues = clues.filter(c => c.collected)

  const panelContent = (
    <div
      style={{
        width: 220,
        background: '#2C1E14',
        borderRadius: 8,
        padding: 12,
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <h3 style={{
        color: '#FFD700',
        fontSize: 16,
        marginBottom: 12,
        borderBottom: '1px solid #5D4037',
        paddingBottom: 8
      }}>
        📜 线索收集
      </h3>

      {collectedClues.length === 0 ? (
        <p style={{
          color: '#8B7355',
          fontSize: 13,
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '20px 0'
        }}>
          尚未发现线索...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {collectedClues.map(clue => (
            <div key={clue.id}>
              <motion.div
                whileHover={{ scale: 1.02, boxShadow: '0 0 10px rgba(255, 193, 7, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setExpandedClue(expandedClue === clue.id ? null : clue.id)
                  onClueClick?.(clue)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px',
                  background: expandedClue === clue.id ? 'rgba(255, 215, 0, 0.1)' : 'rgba(93, 64, 55, 0.3)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: clue.used ? '1px solid #27AE60' : '1px solid #5D4037',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: 20 }}>{clue.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: '#E8D5B7',
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {clue.title}
                  </p>
                  {clue.used && (
                    <span style={{
                      fontSize: 11,
                      color: '#27AE60'
                    }}>
                      ✓ 已使用
                    </span>
                  )}
                </div>
              </motion.div>

              <AnimatePresence>
                {expandedClue === clue.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      overflow: 'hidden',
                      marginLeft: 30
                    }}
                  >
                    <div style={{
                      padding: '10px',
                      fontSize: 12,
                      color: '#B8A88A',
                      lineHeight: 1.5,
                      borderLeft: '2px solid #FFD700',
                      margin: '4px 0 8px 10px'
                    }}>
                      {clue.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          padding: '60px 16px 16px 0',
          zIndex: 10,
          pointerEvents: 'none'
        }}
        className="clue-panel-desktop"
      >
        <div style={{ pointerEvents: 'auto', height: '100%' }}>
          {panelContent}
        </div>
      </div>

      <div
        className="clue-panel-mobile"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50
        }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileOpen(true)}
          style={{
            width: '100%',
            padding: '12px',
            background: '#2C1E14',
            border: 'none',
            borderTop: '2px solid #5D4037',
            color: '#FFD700',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          📜 线索 ({collectedClues.length}/{clues.length})
        </motion.button>

        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '60vh',
                background: '#2C1E14',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                overflow: 'hidden'
              }}
            >
              <div
                onClick={() => setIsMobileOpen(false)}
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: '#8B7355',
                  fontSize: 20
                }}
              >
                ▾
              </div>
              <div style={{ padding: '0 12px 12px' }}>
                {panelContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .clue-panel-desktop {
            display: none !important;
          }
          .clue-panel-mobile {
            display: block !important;
          }
        }
      `}</style>
    </>
  )
}
