import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  visible: boolean
  onClose?: () => void
  duration?: number
  className?: string
}

export default function Toast({
  message,
  visible,
  onClose,
  duration = 3000,
  className,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })

      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          setIsMounted(false)
          onClose?.()
        }, 500)
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setIsMounted(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  if (!isMounted) return null

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50',
        'px-6 py-3 rounded-lg',
        'bg-green-500 text-white font-medium',
        'shadow-lg',
        'transition-opacity duration-500 ease-in-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {message}
    </div>
  )
}
