import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

interface MenuScreenProps {
  onStart: () => void
}

export const MenuScreen = ({ onStart }: MenuScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          fontFamily: 'monospace',
          fontSize: '36px',
          color: '#FFFFFF',
          textShadow: '3px 3px 0 #FF0000, 6px 6px 0 #00FF00',
          marginBottom: '20px',
          letterSpacing: '2px',
        }}
      >
        像素节奏跑酷
      </motion.div>

      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#888',
          marginBottom: '60px',
        }}
      >
        PIXEL RHYTHM RUNNER
      </motion.div>

      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#AAA',
          marginBottom: '30px',
          textAlign: 'center',
          lineHeight: '2',
        }}
      >
        <div>按 <span style={{ color: '#FFD700' }}>A</span> <span style={{ color: '#00FF00' }}>S</span> <span style={{ color: '#4A90D9' }}>D</span> 切换车道</div>
        <div>按 <span style={{ color: '#FF6B6B' }}>空格</span> 释放能量</div>
        <div>在节拍上切换车道获得高分！</div>
      </div>

      <motion.button
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        style={{
          width: '200px',
          height: '50px',
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#000000',
          backgroundColor: '#FFD700',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          boxShadow: '4px 4px 0 #FF8C00',
          letterSpacing: '2px',
        }}
      >
        开始游戏
      </motion.button>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#444',
        }}
      >
        BPM 120 • 8-bit style
      </div>
    </motion.div>
  )
}
