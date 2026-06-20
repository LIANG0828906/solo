import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

type ViewMode = 'original' | 'highlight' | 'corrosion'

interface UIPanelProps {
  siteName: string
  discoveryYear: number
  totalPoints: number
  detectedAreas: number
  currentMode: ViewMode
  onModeChange: (mode: ViewMode) => void
  isLoading: boolean
  loadProgress: number
  loadedPoints: number
  totalPointsCount: number
  estimatedTime: number
}

const modeButtons: { key: ViewMode; label: string; icon: string }[] = [
  { key: 'original', label: '原始点云', icon: '◉' },
  { key: 'highlight', label: '人工区域', icon: '◈' },
  { key: 'corrosion', label: '腐蚀模拟', icon: '◎' },
]

function RippleButton({ children, onClick, active, label }: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  label: string
}) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600)
    onClick()
  }

  return (
    <motion.button
      onClick={handleClick}
      title={label}
      whileHover={{ scale: 52 / 48, boxShadow: '0 0 0 2px rgba(255,255,255,0.5)' }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.2 }}
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 'none',
        background: active
          ? 'rgba(126, 200, 184, 0.35)'
          : 'rgba(10, 58, 71, 0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        color: active ? '#7EC8B8' : '#7EC8B880',
        fontSize: 18,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        border: active ? '1px solid rgba(126, 200, 184, 0.4)' : '1px solid rgba(126, 200, 184, 0.1)',
      }}
    >
      {ripples.map(r => (
        <motion.span
          key={r.id}
          initial={{ width: 0, height: 0, opacity: 0.3 }}
          animate={{ width: 60, height: 60, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: r.x - 30,
            top: r.y - 30,
            borderRadius: '50%',
            background: 'rgba(126, 200, 184, 0.4)',
            pointerEvents: 'none',
          }}
        />
      ))}
      {children}
    </motion.button>
  )
}

export function UIPanel(props: UIPanelProps) {
  const {
    siteName, discoveryYear, totalPoints, detectedAreas,
    currentMode, onModeChange,
    isLoading, loadProgress, loadedPoints, totalPointsCount, estimatedTime,
  } = props

  return (
    <>
      <motion.div
        initial={{ x: -280, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: 260,
          padding: '20px 22px',
          background: 'rgba(10, 58, 71, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 12,
          border: '1px solid rgba(126, 200, 184, 0.15)',
          zIndex: 10,
          fontFamily: 'Roboto, sans-serif',
          color: '#7EC8B8',
        }}
      >
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          margin: '0 0 4px 0',
          color: '#E0F2F1',
          letterSpacing: 0.5,
        }}>{siteName}</h2>

        <div style={{ fontSize: 12, color: '#7EC8B890', marginBottom: 16, fontWeight: 300 }}>
          发现于 {discoveryYear} 年
        </div>

        <div style={{
          width: '100%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(126,200,184,0.2), transparent)',
          marginBottom: 14,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#7EC8B890', fontWeight: 400 }}>总点数</span>
            <motion.span
              key={totalPoints}
              initial={{ scale: 1.2, color: '#FFD700' }}
              animate={{ scale: 1, color: '#7EC8B8' }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Roboto, monospace' }}
            >
              {totalPoints.toLocaleString()}
            </motion.span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#7EC8B890', fontWeight: 400 }}>疑似人工区域</span>
            <motion.span
              key={detectedAreas}
              initial={{ scale: 1.3, color: '#FF6347' }}
              animate={{ scale: 1, color: '#7EC8B8' }}
              transition={{ duration: 0.4, type: 'spring' }}
              style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Roboto, monospace' }}
            >
              {detectedAreas}
            </motion.span>
          </div>
        </div>

        <div style={{
          width: '100%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(126,200,184,0.2), transparent)',
          margin: '14px 0',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#7EC8B870' }}>当前模式</span>
            <span style={{ fontSize: 11, color: '#7EC8B8', fontWeight: 500 }}>
              {currentMode === 'original' ? '原始点云+标签' : currentMode === 'highlight' ? '人工区域高亮' : '腐蚀模拟'}
            </span>
          </div>
        </div>
      </motion.div>

      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        gap: 12,
        zIndex: 10,
      }}>
        {modeButtons.map(m => (
          <RippleButton
            key={m.key}
            active={currentMode === m.key}
            onClick={() => onModeChange(m.key)}
            label={m.label}
          >
            {m.icon}
          </RippleButton>
        ))}
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: '35%',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              zIndex: 20,
              fontFamily: 'Roboto, sans-serif',
            }}
          >
            <div style={{
              width: 400,
              height: 6,
              borderRadius: 3,
              background: '#0F4C5C',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <motion.div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #7EC8B8, #ffffff, #7EC8B8)',
                  backgroundSize: '200% 100%',
                  width: `${loadProgress}%`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div style={{
              color: '#7EC8B8',
              fontSize: 13,
              fontWeight: 300,
              letterSpacing: 0.5,
            }}>
              {loadedPoints.toLocaleString()} / {totalPointsCount.toLocaleString()}
              {estimatedTime > 0 && (
                <span style={{ color: '#7EC8B870', marginLeft: 12 }}>
                  预计剩余 {estimatedTime}s
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
