import React, { memo, useEffect, useRef } from 'react'
import { Trash2, Copy, RefreshCw } from 'lucide-react'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  danger?: boolean
  onClick: () => void
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export const ContextMenu = memo(function ContextMenu(props: ContextMenuProps) {
  const { x, y, items, onClose } = props
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleScroll = () => onClose()
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const posStyle: React.CSSProperties = {
    left: x,
    top: y,
  }

  return (
    <div className="context-menu" ref={menuRef} style={posStyle}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`context-menu-item ${item.danger ? 'danger' : ''}`}
          onClick={() => {
            item.onClick()
            onClose()
          }}
        >
          {item.icon ?? null}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
})

export function makeCardContextMenuItems(
  params: {
    onDelete: () => void
    onDuplicate?: () => void
    onReset?: () => void
  }
): ContextMenuItem[] {
  const items: ContextMenuItem[] = []
  if (params.onDuplicate) {
    items.push({ id: 'duplicate', label: '复制卡片', icon: <Copy size={14} />, onClick: params.onDuplicate })
  }
  if (params.onReset) {
    items.push({ id: 'reset', label: '重置布局', icon: <RefreshCw size={14} />, onClick: params.onReset })
  }
  items.push({ id: 'delete', label: '删除卡片', icon: <Trash2 size={14} />, danger: true, onClick: params.onDelete })
  return items
}
