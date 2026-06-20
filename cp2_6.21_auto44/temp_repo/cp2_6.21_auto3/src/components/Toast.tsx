import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastView({
  toasts,
  onClose,
}: {
  toasts: ToastItem[]
  onClose: (id: string) => void
}) {
  const bgColor: Record<ToastType, string> = {
    success: 'linear-gradient(135deg, #2ecc71, #27ae60)',
    error: 'linear-gradient(135deg, #e74c3c, #c0392b)',
    info: 'linear-gradient(135deg, #3498db, #2980b9)',
    warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
  }
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onClose(toast.id)}
          style={{
            minWidth: 260,
            maxWidth: 380,
            padding: '12px 18px',
            background: bgColor[toast.type],
            color: 'white',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s ease-out',
            transition: 'all 0.2s ease-out',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            {icons[toast.type]}
          </span>
          <span style={{ flex: 1, lineHeight: 1.5 }}>{toast.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 2500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const toast: ToastItem = { id, message, type, duration }
      setToasts((prev) => [...prev, toast])
      const timer = window.setTimeout(() => {
        removeToast(id)
      }, duration)
      timersRef.current.set(id, timer)
    },
    [removeToast],
  )

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast],
  )
  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast],
  )
  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast],
  )
  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast],
  )

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <ToastView toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}
