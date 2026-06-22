import { useEffect } from 'react'

interface ToastProps {
  message: string
  show: boolean
  onUndo?: () => void
  duration?: number
  onClose?: () => void
}

export default function Toast({
  message,
  show,
  onUndo,
  duration = 4000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!show) return
    if (onUndo) return
    const timer = setTimeout(() => {
      onClose?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [show, duration, onUndo, onClose])

  useEffect(() => {
    if (!show || !onUndo) return
    const timer = setTimeout(() => {
      onClose?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [show, duration, onUndo, onClose])

  if (!show) return null

  const handleUndo = () => {
    onUndo?.()
    onClose?.()
  }

  return (
    <div className="toast-container animate-fadeIn">
      <div
        style={{
          background: '#8B6914',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 20px',
          boxShadow: '0 4px 12px rgba(139, 105, 20, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>{message}</span>
        {onUndo && (
          <button
            onClick={handleUndo}
            style={{
              color: '#FF8C00',
              textDecoration: 'underline',
              paddingLeft: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'inherit',
            }}
          >
            撤销
          </button>
        )}
      </div>
    </div>
  )
}
