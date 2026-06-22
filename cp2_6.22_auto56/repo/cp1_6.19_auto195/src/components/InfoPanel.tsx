import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

const InfoPanel = () => {
  const fps = useAppStore((state) => state.fps)
  const mode = useAppStore((state) => state.mode)
  const particles = useAppStore((state) => state.particles)
  const history = useAppStore((state) => state.history)

  const modeNames: Record<string, string> = {
    focus: '聚焦',
    diverge: '发散',
    default: '默认',
  }

  const avgSpeed = history.length > 0
    ? (history.slice(-30).reduce((sum, h) => sum + h.transition, 0) / Math.min(30, history.length) * 100).toFixed(1)
    : '0.0'

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '200px',
        backgroundColor: 'rgba(26, 26, 46, 0.73)',
        borderRadius: '12px',
        padding: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: '13px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 0 20px rgba(100, 150, 255, 0.1)',
        zIndex: 100,
      }}
    >
      <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4FC3F7', textShadow: '0 0 10px rgba(79, 195, 247, 0.5)' }}>
        状态信息
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#AAAAAA' }}>帧率</span>
        <span style={{
          color: fps > 50 ? '#81C784' : '#FF5252',
          fontWeight: 'bold',
          textShadow: fps <= 50 ? '0 0 8px rgba(255, 82, 82, 0.5)' : 'none',
        }}>
          {fps} FPS
        </span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#AAAAAA' }}>主题</span>
        <span style={{
          color: mode === 'focus' ? '#4FC3F7' : mode === 'diverge' ? '#FF7043' : '#FFFFFF',
          fontWeight: 'bold',
          textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
        }}>
          {modeNames[mode]}
        </span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#AAAAAA' }}>粒子数</span>
        <span style={{ fontWeight: 'bold' }}>{particles.length}</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#AAAAAA' }}>平均速度</span>
        <span style={{ fontWeight: 'bold' }}>{avgSpeed}%</span>
      </div>
    </motion.div>
  )
}

export default InfoPanel
