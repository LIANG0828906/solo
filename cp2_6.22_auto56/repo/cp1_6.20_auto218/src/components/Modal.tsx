import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  visible: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  showClose?: boolean
  className?: string
  backdropClassName?: string
}

export default function Modal({
  visible,
  onClose,
  children,
  title,
  showClose = true,
  className,
  backdropClassName,
}: ModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''
      const timer = setTimeout(() => {
        setIsMounted(false)
      }, 300)
      return () => clearTimeout(timer)
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [visible])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [visible, onClose])

  if (!isMounted) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'transition-opacity duration-300 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className={cn(
          'absolute inset-0',
          'bg-black/50 backdrop-blur-sm',
          backdropClassName
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10',
          'bg-dark-surface rounded-xl shadow-2xl',
          'max-w-lg w-full mx-4 max-h-[90vh] overflow-auto',
          'transform transition-all duration-300 ease-out',
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between p-4 border-b border-dark-muted/20">
            {title && (
              <h3 className="text-lg font-semibold text-dark-text">
                {title}
              </h3>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-dark-muted/20 transition-colors"
              >
                <X className="w-5 h-5 text-dark-muted" />
              </button>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
