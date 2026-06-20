import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Timeline from './components/Timeline'
import EntryPanel from './components/EntryPanel'
import CapsuleScene from './components/CapsuleScene'

export default function App() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [capsuleOpen, setCapsuleOpen] = useState(false)

  useEffect(() => {
    const now = new Date()
    if (now.getDay() === 0 && now.getHours() >= 20) {
      // 周日晚上8点后显示胶囊提示（此处仅自动触发按钮上的高亮）
    }
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰光晕 */}
      <div
        style={{
          position: 'fixed',
          top: -200,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102,126,234,0.18), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: -200,
          right: -100,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(118,75,162,0.15), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 主容器 */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 768,
          margin: '0 auto',
          padding: '80px 20px 140px',
        }}
      >
        {/* 顶部标题 + 胶囊按钮 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 40,
            gap: 16,
          }}
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: 30,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
            >
              音乐心情日记
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}
            >
              每天一首歌，记录此刻心情
              <br />
              每周日晚上 8 点生成音乐胶囊 ✨
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCapsuleOpen(true)}
            style={{
              flexShrink: 0,
              padding: '12px 22px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 6px 24px rgba(102,126,234,0.35)',
            }}
          >
            <span style={{ fontSize: 16 }}>💊</span>
            本周胶囊
          </motion.button>
        </div>

        {/* 时间轴 */}
        <Timeline />
      </div>

      {/* 浮动加号按钮 */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1, boxShadow: '0 0 32px rgba(102,126,234,0.7)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setPanelOpen(true)}
        style={{
          position: 'fixed',
          right: 28,
          bottom: 28,
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: '#fff',
          fontSize: 32,
          fontWeight: 300,
          cursor: 'pointer',
          zIndex: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          boxShadow: '0 8px 28px rgba(102,126,234,0.45)',
          transition: 'box-shadow 0.3s',
          padding: 0,
        }}
        aria-label="添加日记"
      >
        +
      </motion.button>

      {/* 面板 & 胶囊 */}
      <EntryPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
      <CapsuleScene open={capsuleOpen} onClose={() => setCapsuleOpen(false)} />
    </div>
  )
}
