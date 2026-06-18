import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 200)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const config = {
    success: { bg: 'bg-green-500', icon: <CheckCircle size={18} /> },
    error: { bg: 'bg-red-500', icon: <AlertCircle size={18} /> },
    info: { bg: 'bg-blue-500', icon: <AlertCircle size={18} /> },
  }[type]

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 text-white rounded-lg shadow-lg transition-all duration-200 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${config.bg}`}
    >
      {config.icon}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 200)
        }}
        className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors duration-200"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default Toast
