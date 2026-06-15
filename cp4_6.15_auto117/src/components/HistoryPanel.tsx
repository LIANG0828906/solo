export default function HistoryPanel() {
  return (
    <div
      style={{
        position: 'fixed',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '300px',
        maxHeight: '60vh',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-glow)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 0 30px rgba(100, 150, 255, 0.2)',
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--accent)' }}>
        Mutation History
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(224, 224, 255, 0.6)' }}>
        Mutation history will appear here
      </div>
    </div>
  )
}
