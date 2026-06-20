import { useEffect, useRef } from 'react'

interface ContextMenuProps {
  x: number
  y: number
  onAddNode: () => void
  onClose: () => void
}

export default function ContextMenu({ x, y, onAddNode, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const menuItemStyle: React.CSSProperties = {
    height: '40px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    color: '#e2e8f0',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        border: '1px solid #334155',
        minWidth: '160px',
        padding: '4px',
        zIndex: 1000,
      }}
    >
      <div
        onClick={() => {
          onAddNode()
          onClose()
        }}
        style={menuItemStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#334155'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <span style={{ marginRight: '10px' }}>➕</span>
        添加节点
      </div>
    </div>
  )
}
