import { useState, useEffect } from 'react'
import { useNeuralStore } from '../store/neuralStore'

const getSliderColor = (value: number, min: number, max: number): string => {
  const t = (value - min) / (max - min)
  if (t < 0.3) return '#FF6B6B'
  if (t < 0.7) return '#F1C40F'
  return '#2ECC71'
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

const Slider = ({ label, value, min, max, step, onChange }: SliderProps) => {
  const color = getSliderColor(value, min, max)
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: '#E0E0E0', fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span style={{ color, fontSize: 13, fontWeight: 600 }}>{value.toFixed(2)}</span>
      </div>
      <div style={{
        position: 'relative', height: 4, borderRadius: 2, background: '#333344', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%', width: `${percentage}%`, background: color, borderRadius: 2, transition: 'all 0.15s ease',
        }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
            left: 0,
            top: 0,
          }}
        />
      </div>
      <div style={{ position: 'relative', height: 20, marginTop: -10, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          left: `calc(${percentage}% - 8px)`,
          top: 4,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          border: '2px solid #1E1E2E',
        }} />
      </div>
    </div>
  )
}

interface ControlButtonProps {
  color: string
  label: string
  onClick: () => void
  children: React.ReactNode
}

const ControlButton = ({ color, label, onClick, children }: ControlButtonProps) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: '#1E1E2E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        boxShadow: hovered ? `0 0 12px ${color}` : 'none',
        transition: 'all 0.2s ease',
        border: `2px solid ${color}40`,
      }}>
        <div style={{ color, fontSize: 18, lineHeight: 1 }}>{children}</div>
      </div>
      <span style={{ color: '#E0E0E0', fontSize: 11, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

export const ControlPanel = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const connections = useNeuralStore((state) => state.connections)
  const selectedConnectionId = useNeuralStore((state) => state.selectedConnectionId)
  const playing = useNeuralStore((state) => state.playing)
  const startAnimation = useNeuralStore((state) => state.startAnimation)
  const pauseAnimation = useNeuralStore((state) => state.pauseAnimation)
  const resetAnimation = useNeuralStore((state) => state.resetAnimation)
  const updateConnection = useNeuralStore((state) => state.updateConnection)

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const panelContent = (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
      <div>
        <h2 style={{
          color: '#E0E0E0', fontSize: 18, fontWeight: 600, marginBottom: 4,
        }}>
          突触信使
        </h2>
        <p style={{ color: '#888', fontSize: 12 }}>神经信号可视化系统</p>
      </div>

      <div style={{
        background: '#1E1E2E', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-around',
      }}>
        <ControlButton
          color="#2ECC71"
          label="播放"
          onClick={startAnimation}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
        </ControlButton>
        <ControlButton
          color="#F1C40F"
          label="暂停"
          onClick={pauseAnimation}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="3" width="4" height="18" />
              <rect x="14" y="3" width="4" height="18" />
            </svg>
        </ControlButton>
        <ControlButton
          color="#E74C3C"
          label="重置"
          onClick={resetAnimation}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
        </ControlButton>
      </div>

      {selectedConnection ? (
        <div style={{ background: '#1E1E2E', borderRadius: 12, padding: 16 }}>
          <h3 style={{ color: '#E0E0E0', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            突触连接参数
          </h3>
          <Slider
            label="突触权重"
            value={selectedConnection.weight}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateConnection(selectedConnection.id, { weight: v })}
          />
          <Slider
            label="信号强度"
            value={selectedConnection.signalStrength}
            min={1}
            max={10}
            step={0.1}
            onChange={(v) => updateConnection(selectedConnection.id, { signalStrength: v })}
          />
          <Slider
            label="信号频率 (Hz)"
            value={selectedConnection.frequency}
            min={0.1}
            max={2.0}
            step={0.05}
            onChange={(v) => updateConnection(selectedConnection.id, { frequency: v })}
          />
          <div style={{ marginTop: 12, padding: 12, background: '#2a2a3e', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#888', fontSize: 12 }}>粒子数量</span>
              <span style={{ color: '#F1C40F', fontSize: 12, fontWeight: 600 }}>
                {Math.floor(30 + selectedConnection.weight * 20)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888', fontSize: 12 }}>粒子大小</span>
              <span style={{ color: '#4ECDC4', fontSize: 12, fontWeight: 600 }}>
                {(0.01 + selectedConnection.signalStrength * 0.002).toFixed(4)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ color: '#888', fontSize: 12 }}>生成间隔</span>
              <span style={{ color: '#9B59B6', fontSize: 12, fontWeight: 600 }}>
                {(1 / selectedConnection.frequency).toFixed(2)}s
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: '#1E1E2E', borderRadius: 12, padding: 16, textAlign: 'center',
        }}>
          <div style={{ color: '#888', fontSize: 13 }}>
            点击场景中的突触连接<br />查看并调整参数
          </div>
        </div>
      )}

      <div style={{ background: '#1E1E2E', borderRadius: 12, padding: 16, marginTop: 'auto' }}>
        <h3 style={{ color: '#E0E0E0', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          状态信息
        </h3>
        <div style={{ color: '#888', fontSize: 11, lineHeight: 1.8 }}>
          <div>神经元: {connections.length > 0 ? '已加载' : '加载中...'}</div>
          <div>突触连接: {connections.length}</div>
          <div>动画状态: {playing ? '▶ 运行中' : '⏸ 已暂停'}</div>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 998,
            }}
          />
        )}
        <div
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: drawerOpen ? 'auto' : 48,
            maxHeight: drawerOpen ? 300 : 48,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            zIndex: 999,
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
          }}
        >
          <div style={{
            width: 40, height: 4, background: '#888', borderRadius: 2, margin: '8px auto',
          }} />
          <div style={{ overflowY: 'auto', maxHeight: drawerOpen ? 252 : 0 }}>
            {drawerOpen && panelContent}
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: 300,
      height: '100%',
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderLeft: '1px solid rgba(255,255,255,0.1)',
      zIndex: 100,
    }}>
      {panelContent}
    </div>
  )
}
