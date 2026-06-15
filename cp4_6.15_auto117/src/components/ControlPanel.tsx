export default function ControlPanel() {
  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '280px',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-glow)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 0 30px rgba(100, 150, 255, 0.2)',
      }}
    >
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--accent)' }}>
        Control Panel
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(224, 224, 255, 0.6)' }}>
        Sequence controls will appear here
      </div>
    </div>
  )
}
