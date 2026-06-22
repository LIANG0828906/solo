import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParticleStore } from '@/store/useParticleStore'

export default function ControlPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const {
    particleCount,
    flowSpeed,
    colorSchemeIndex,
    colorSchemes,
    isPaused,
    setParticleCount,
    setFlowSpeed,
    setColorSchemeIndex,
    togglePause,
    triggerReset,
  } = useParticleStore()

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(136, 136, 136, 0.3)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
              width: 280,
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 13,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <span>粒子数量</span>
                <span style={{ color: '#fff' }}>{particleCount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={2000}
                max={15000}
                step={500}
                value={particleCount}
                onChange={(e) => setParticleCount(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.2)',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <span>流速</span>
                <span style={{ color: '#fff' }}>{flowSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={3.0}
                step={0.1}
                value={flowSpeed}
                onChange={(e) => setFlowSpeed(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.2)',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  marginBottom: 8,
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                颜色方案
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {colorSchemes.map((scheme, index) => (
                  <button
                    key={scheme.name}
                    onClick={() => setColorSchemeIndex(index)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: colorSchemeIndex === index ? '1px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: colorSchemeIndex === index ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      transition: 'all 0.2s',
                    }}
                  >
                    {scheme.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={triggerReset}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'monospace',
                marginBottom: 12,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              重置粒子
            </button>

            <button
              onClick={togglePause}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: isPaused ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'monospace',
                marginBottom: 16,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isPaused ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isPaused ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)'
              }}
            >
              {isPaused ? '▶ 继续' : '⏸ 暂停'}
            </button>

            <div
              style={{
                paddingTop: 12,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.5)',
                lineHeight: 1.8,
              }}
            >
              <div>快捷键：</div>
              <div>R - 重置粒子</div>
              <div>C - 切换颜色方案</div>
              <div>空格 - 暂停/继续</div>
              <div>右键拖拽 - 旋转视角</div>
              <div>滚轮 - 缩放</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          width: isExpanded ? 40 : 40,
          height: isExpanded ? 40 : 40,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#333',
          fontSize: 18,
          fontWeight: 'bold',
        }}
      >
        {isExpanded ? '×' : '☰'}
      </motion.div>
    </div>
  )
}
