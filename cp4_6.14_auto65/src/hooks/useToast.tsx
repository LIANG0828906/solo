import { useState, useCallback, useRef, useEffect } from 'react'
import type { ToastMessage } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface ToastItem extends ToastMessage {
  leaving: boolean
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, { hide: NodeJS.Timeout; remove: NodeJS.Timeout }>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t =>
      t.id === id ? { ...t, leaving: true } : t
    ))

    const removeTimer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      timersRef.current.delete(id)
    }, 300)

    const timers = timersRef.current.get(id)
    if (timers) {
      timers.remove = removeTimer
    }
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = uuidv4()
    const newToast: ToastItem = { id, message, type, leaving: false }

    const hideTimer = setTimeout(() => {
      removeToast(id)
    }, 3000)

    timersRef.current.set(id, {
      hide: hideTimer,
      remove: null as unknown as NodeJS.Timeout
    })

    setToasts(prev => [...prev, newToast])

    return id
  }, [removeToast])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timers => {
        if (timers.hide) clearTimeout(timers.hide)
        if (timers.remove) clearTimeout(timers.remove)
      })
      timersRef.current.clear()
    }
  }, [])

  const ToastContainer = useCallback(() => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          style={{
            transform: toast.leaving ? 'translateX(100%)' : 'translateX(0)',
            opacity: toast.leaving ? 0 : 1,
            transition: 'transform 0.3s ease, opacity 0.3s ease'
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  ), [toasts])

  return { showToast, ToastContainer }
}
