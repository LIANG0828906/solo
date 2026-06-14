import { useHeartStore } from '../store/useHeartStore'

export default function InfoPanel() {
  const { cycleNumber, avDelay, cardiacOutput } = useHeartStore()

  return (
    <div style={styles.panel}>
      <div style={styles.title}>心脏状态</div>
      
      <div style={styles.item}>
        <span style={styles.label}>心跳周期:</span>
        <span style={styles.value}>{cycleNumber}</span>
      </div>
      
      <div style={styles.item}>
        <span style={styles.label}>AV延迟:</span>
        <span style={styles.value}>{avDelay.toFixed(0)} ms</span>
      </div>
      
      <div style={styles.item}>
        <span style={styles.label}>心输出量:</span>
        <span style={styles.value}>{cardiacOutput.toFixed(1)} L/min</span>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '12px',
    padding: '16px',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
    minWidth: '180px',
    transition: 'opacity 0.2s ease',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: '12px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(148, 163, 184, 0.3)',
    paddingBottom: '8px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#e2e8f0',
  },
  label: {
    color: '#94a3b8',
  },
  value: {
    fontWeight: 500,
    color: '#fcd34d',
  },
}
