type ToolbarProps = {
  onScreenshot: () => void
  onToggleRecord: () => void
}

export default function Toolbar({ onScreenshot, onToggleRecord }: ToolbarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-glow)',
        borderRadius: '12px',
        padding: '12px 20px',
        boxShadow: '0 0 30px rgba(100, 150, 255, 0.2)',
        zIndex: 100,
      }}
    >
      <button
        onClick={onScreenshot}
        style={{
          background: 'transparent',
          border: '1px solid var(--border-glow)',
          color: '#e0e0ff',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(100, 150, 255, 0.2)'
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'var(--border-glow)'
        }}
      >
        📷 Screenshot
      </button>
      <button
        onClick={onToggleRecord}
        style={{
          background: 'transparent',
          border: '1px solid var(--border-glow)',
          color: '#e0e0ff',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(100, 150, 255, 0.2)'
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'var(--border-glow)'
        }}
      >
        ⏺ Record
      </button>
    </div>
  )
}
