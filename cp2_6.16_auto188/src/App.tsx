import { useEffect } from 'react'
import SimulationCanvas from './components/SimulationCanvas'
import ControlPanel from './components/ControlPanel'
import { useGameStore } from './store/gameStore'

export default function App() {
  const { showSuccessMessage, triggerThrust, phase, mode, resetSimulation } = useGameStore()

  useEffect(() => {
    resetSimulation()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && mode === 'transfer') {
        e.preventDefault()
        triggerThrust()
      }
      if (e.code === 'KeyR') {
        resetSimulation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerThrust, mode, resetSimulation])

  return (
    <div style={styles.app}>
      <div style={styles.canvasContainer}>
        <SimulationCanvas />

        {showSuccessMessage && (
          <div style={styles.successMessage}>
            <div style={styles.successIcon}>✓</div>
            <div style={styles.successText}>入轨成功</div>
          </div>
        )}

        {phase === 'failed' && (
          <div style={{ ...styles.successMessage, backgroundColor: 'rgba(255, 60, 0, 0.2)', borderColor: '#FF3C00' }}>
            <div style={{ ...styles.successIcon, color: '#FF3C00' }}>✕</div>
            <div style={{ ...styles.successText, color: '#FF3C00' }}>任务失败</div>
          </div>
        )}

        <div style={styles.topLeftPanel}>
          <div style={styles.panelRow}>
            <span style={styles.panelLabel}>得分</span>
            <span style={styles.panelValue}>
              {useGameStore.getState().score}
            </span>
          </div>
          <div style={styles.panelRow}>
            <span style={styles.panelLabel}>模式</span>
            <span style={styles.panelValue}>{mode === 'single' ? '单星' : '转移'}</span>
          </div>
        </div>
      </div>

      <ControlPanel />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#0B0E14',
    overflow: 'hidden',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  successMessage: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    transform: 'translateX(-50%) scale(1)',
    animation: 'successBounce 0.5s ease-out',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    border: '1px solid #00FF88',
    boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)',
    padding: '16px 40px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(10px)',
    zIndex: 100,
  },
  successIcon: {
    fontSize: 28,
    color: '#00FF88',
    fontWeight: 700,
  },
  successText: {
    fontSize: 22,
    color: '#00FF88',
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 2,
    textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
  },
  topLeftPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(11, 14, 20, 0.8)',
    border: '1px solid #00F0FF40',
    boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)',
    padding: '12px 16px',
    backdropFilter: 'blur(10px)',
    zIndex: 50,
    minWidth: 120,
  },
  panelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    padding: '4px 0',
  },
  panelLabel: {
    fontSize: 11,
    color: '#00F0FF80',
    fontFamily: "'JetBrains Mono', monospace",
  },
  panelValue: {
    fontSize: 12,
    color: '#FFD700',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
  },
}
