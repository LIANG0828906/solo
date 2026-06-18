import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose?: () => void
  children: ReactNode
  glassBackground?: boolean
  width?: number
  padding?: number
  closeOnOverlay?: boolean
}

const Modal = ({
  open,
  onClose,
  children,
  glassBackground = true,
  width = 480,
  padding = 28,
  closeOnOverlay = true,
}: Props) => {
  const [visible, setVisible] = useState(open)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      setTimeout(() => setAnimating(true), 10)
    } else {
      setAnimating(false)
      const t = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!visible) return null

  return (
    <div
      onClick={() => closeOnOverlay && onClose?.()}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00000080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        opacity: animating ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: glassBackground ? '#FFFFFF10' : '#1A1A2E',
          backdropFilter: glassBackground ? 'blur(20px)' : undefined,
          WebkitBackdropFilter: glassBackground ? 'blur(20px)' : undefined,
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          padding,
          maxWidth: '100%',
          width,
          maxHeight: '85vh',
          overflow: 'auto',
          transform: animating ? 'scale(1)' : 'scale(0.95)',
          opacity: animating ? 1 : 0,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default Modal
