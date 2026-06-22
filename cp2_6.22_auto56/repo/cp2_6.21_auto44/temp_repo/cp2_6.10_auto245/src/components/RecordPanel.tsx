import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, MoveRecord } from '../store/useGameStore'
import { coordinatesToLabel } from '../utils/exportUtils'

const RecordPanel: React.FC = () => {
  const { moveHistory, currentMoveNumber, undoMove, resetGame } = useGameStore()
  
  const recentMoves = moveHistory.slice(-10).reverse()

  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <motion.div
      className="record-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'linear-gradient(180deg, #faf7f0 0%, #f5f0e6 100%)',
        border: '1px solid #d4c8b8',
        borderRadius: '8px',
        padding: '20px',
        minWidth: '220px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      <h2 
        style={{
          fontSize: '1.4rem',
          color: '#2c2c2c',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #c0392b',
          fontFamily: "'Noto Serif SC', 'SimSun', serif",
          fontWeight: 600,
          letterSpacing: '2px'
        }}
      >
        落子记录
      </h2>

      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '12px',
          background: 'rgba(192, 57, 43, 0.08)',
          borderRadius: '6px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', color: '#7a7a7a' }}>当前手数</div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            color: '#c0392b',
            fontFamily: "'Noto Serif SC', serif"
          }}>
            {currentMoveNumber}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#7a7a7a' }}>下一步</div>
          <div 
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentMoveNumber % 2 === 0 
                ? 'radial-gradient(circle at 35% 35%, #4a4a4a, #1a1a1a)' 
                : 'radial-gradient(circle at 35% 35%, #ffffff, #d8d3c8)',
              border: currentMoveNumber % 2 === 0 ? 'none' : '1px solid #8b8b8b',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ minHeight: '300px' }}
      >
        {recentMoves.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9a9a9a',
              fontFamily: "'Noto Serif SC', serif",
              fontSize: '0.95rem'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🖋️</div>
            点击棋盘落子<br/>
            开启你的棋局
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {recentMoves.map((move: MoveRecord, index: number) => (
              <motion.div
                key={move.id}
                variants={itemVariants}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                layout
                transition={{ delay: index * 0.03 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  marginBottom: '6px',
                  background: index === 0 
                    ? 'rgba(192, 57, 43, 0.12)' 
                    : 'rgba(255,255,255,0.5)',
                  borderRadius: '6px',
                  borderLeft: index === 0 
                    ? `3px solid #c0392b` 
                    : `3px solid ${move.color === 'black' ? '#2c2c2c' : '#d4c8b8'}`,
                  transition: 'all 0.2s ease'
                }}
                whileHover={{ 
                  scale: 1.02,
                  background: 'rgba(192, 57, 43, 0.08)'
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: move.color === 'black' 
                      ? 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)'
                      : 'radial-gradient(circle at 30% 30%, #ffffff, #d8d3c8)',
                    border: move.color === 'black' ? 'none' : '1px solid #8b8b8b',
                    marginRight: '12px',
                    boxShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontWeight: 600,
                      color: '#2c2c2c',
                      fontFamily: "'Noto Serif SC', serif"
                    }}>
                      第 {move.moveNumber} 手
                    </span>
                    <span style={{
                      color: '#c0392b',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      fontSize: '0.95rem'
                    }}>
                      {coordinatesToLabel(move.x, move.y)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      <div style={{ 
        marginTop: '20px',
        display: 'flex',
        gap: '10px',
        borderTop: '1px solid #d4c8b8',
        paddingTop: '16px'
      }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={undoMove}
          disabled={moveHistory.length === 0}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: moveHistory.length === 0 
              ? '#e0e0e0' 
              : 'linear-gradient(135deg, #5a5a5a 0%, #3a3a3a 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: moveHistory.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '0.9rem',
            opacity: moveHistory.length === 0 ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          ↩ 悔棋
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resetGame}
          disabled={moveHistory.length === 0}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: moveHistory.length === 0 
              ? '#e0e0e0' 
              : 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: moveHistory.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '0.9rem',
            opacity: moveHistory.length === 0 ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          ↺ 重开
        </motion.button>
      </div>
    </motion.div>
  )
}

export default RecordPanel
