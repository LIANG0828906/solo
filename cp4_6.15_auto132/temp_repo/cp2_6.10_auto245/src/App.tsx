import React from 'react'
import { motion } from 'framer-motion'
import Board from './components/Board'
import RecordPanel from './components/RecordPanel'
import ExportPanel from './components/ExportPanel'

const App: React.FC = () => {
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f0e6 0%, #ebe4d4 50%, #e5dcc8 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}
      >
        <h1 
          style={{
            fontSize: '2.5rem',
            color: '#2c2c2c',
            fontFamily: "'Noto Serif SC', 'SimSun', serif",
            fontWeight: 700,
            letterSpacing: '8px',
            marginBottom: '8px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          墨染棋谱
        </h1>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: '#8b7355',
            fontSize: '0.95rem',
            fontFamily: "'Noto Serif SC', serif",
            letterSpacing: '2px'
          }}
        >
          <span style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, #c0392b)' }} />
          <span style={{ color: '#c0392b', fontSize: '1.1rem' }}>●</span>
          <span>水墨丹青 · 落子有声</span>
          <span style={{ color: '#d4c8b8', fontSize: '1.1rem' }}>○</span>
          <span style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, #c0392b, transparent)' }} />
        </div>
      </motion.header>

      <div 
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '1400px',
          width: '100%'
        }}
      >
        <RecordPanel />
        <Board />
        <ExportPanel />
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          marginTop: '24px',
          textAlign: 'center',
          color: '#9a9a9a',
          fontSize: '0.8rem',
          fontFamily: "'Noto Serif SC', serif"
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          点击棋盘交叉点落子 · 黑白交替 · 第1手为黑子
        </div>
        <div style={{ color: '#bababa', fontSize: '0.75rem' }}>
          响应式设计 · 支持鼠标悬停预览 · 60fps流畅动画
        </div>
      </motion.footer>
    </div>
  )
}

export default App
