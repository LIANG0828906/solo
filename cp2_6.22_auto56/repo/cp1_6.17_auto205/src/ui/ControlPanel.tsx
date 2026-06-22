import React from 'react'
import { useAppStore } from '../store/useStore'

interface ControlPanelProps {
  onShare: () => void
  onReRecord: () => void
  shareCopied: boolean
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onShare, onReRecord, shareCopied }) => {
  const { particlesEnabled, trailsEnabled, toggleParticles, toggleTrails } = useAppStore()

  return (
    <div style={styles.panel}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>特效开关</h3>
        <div style={styles.toggleContainer}>
          <button
            onClick={toggleParticles}
            style={{
              ...styles.toggleButton,
              background: particlesEnabled
                ? 'linear-gradient(135deg, #BB86FC, #6200EE)'
                : '#3A3A4A',
              transition: 'background 0.2s ease'
            }}
          >
            <span style={styles.toggleIcon}>✦</span>
            <span style={styles.toggleLabel}>粒子</span>
          </button>
          
          <button
            onClick={toggleTrails}
            style={{
              ...styles.toggleButton,
              background: trailsEnabled
                ? 'linear-gradient(135deg, #BB86FC, #6200EE)'
                : '#3A3A4A',
              transition: 'background 0.2s ease'
            }}
          >
            <span style={styles.toggleIcon}>↝</span>
            <span style={styles.toggleLabel}>光线拖尾</span>
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <button
          onClick={onShare}
          style={{
            ...styles.primaryButton,
            transform: shareCopied ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.15s ease'
          }}
        >
          {shareCopied ? '链接已复制' : '分享链接'}
        </button>
      </div>

      <div style={styles.section}>
        <button
          onClick={onReRecord}
          style={styles.secondaryButton}
        >
          重新录制
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 280,
    background: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    boxSizing: 'border-box'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 12,
    opacity: 0.9
  },
  toggleContainer: {
    display: 'flex',
    gap: 12
  },
  toggleButton: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  toggleIcon: {
    fontSize: 20,
    color: '#ffffff'
  },
  toggleLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9
  },
  primaryButton: {
    width: '100%',
    height: 44,
    background: 'linear-gradient(135deg, #BB86FC, #6200EE)',
    borderRadius: 8,
    border: 'none',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer'
  },
  secondaryButton: {
    width: '100%',
    height: 44,
    background: '#3A3A4A',
    borderRadius: 8,
    border: 'none',
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer'
  }
}

export default ControlPanel
