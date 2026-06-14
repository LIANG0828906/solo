// 由 App 根组件统一管理，store 控制显示状态
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  show: boolean
  message: string
  type: 'success' | 'error'
  duration?: number
}

export default function Toast({ show, message, type, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (show) {
      setIsMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })

      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setIsMounted(false), 300)
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => setIsMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!isMounted) return null

  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
  }

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium',
        'transition-all duration-300 ease-out',
        typeStyles[type]
      )}
      style={{
        transform: isVisible
          ? 'translate(-50%, 0)'
          : 'translate(-50%, -100%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      {message}
    </div>
  )
}
