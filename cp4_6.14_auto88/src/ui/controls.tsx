import { useHeartStore } from '../store/useHeartStore'
import { useEffect, useRef } from 'react'

interface ControlsProps {
  onHeartRateChange?: (rate: number) => void
}

export default function Controls({ onHeartRateChange }: ControlsProps) {
  const { heartRate, isPaused, conductionVisible, setHeartRate, togglePause, toggleConduction } = useHeartStore()
  const prevRateRef = useRef(heartRate)

  useEffect(() => {
    if (prevRateRef.current !== heartRate && onHeartRateChange) {
      onHeartRateChange(heartRate)
      prevRateRef.current = heartRate
    }
  }, [heartRate, onHeartRateChange])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setHeartRate(value)
  }

  return (
    <div style={styles.panel}>
      <div style={styles.title}>心脏模拟控制</div>
      
      <div style={styles.controlGroup}>
        <label style={styles.label}>
          心跳速度: {heartRate.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={heartRate}
          onChange={handleSliderChange}
          style={styles.slider}
        />
        <div style={styles.sliderLabels}>
          <span>0.5x</span>
          <span>3.0x</span>
        </div>
      </div>

      <div style={styles.controlGroup}>
        <button
          onClick={togglePause}
          style={{
            ...styles.button,
            ...(isPaused ? styles.playButton : styles.pauseButton),
          }}
        >
          <span style={styles.buttonIcon}>{isPaused ? '▶' : '⏸'}</span>
          <span>{isPaused ? '继续' : '暂停'}</span>
        </button>
      </div>

      <div style={styles.controlGroup}>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={conductionVisible}
            onChange={toggleConduction}
            style={styles.checkbox}
          />
          <span style={styles.toggleText}>电传导可视化</span>
        </label>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    width: '280px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    zIndex: 100,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    opacity: 0.95,
    transition: 'opacity 0.2s ease',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: '16px',
    textAlign: 'center',
    borderBottom: '1px solid #334155',
    paddingBottom: '12px',
  },
  controlGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#f8fafc',
    marginBottom: '8px',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#334155',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  button: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.1s ease, opacity 0.2s ease',
  },
  pauseButton: {
    backgroundColor: '#475569',
  },
  playButton: {
    backgroundColor: '#3b82f6',
  },
  buttonIcon: {
    fontSize: '16px',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#f8fafc',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#3b82f6',
  },
  toggleText: {
    userSelect: 'none',
  },
}
