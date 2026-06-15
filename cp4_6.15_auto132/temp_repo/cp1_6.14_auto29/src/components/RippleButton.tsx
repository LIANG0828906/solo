// 被 Dashboard 和 Exchange 页面使用
import { useState, useRef, useEffect, type MouseEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RippleButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'outline' | 'glass'
}

interface Ripple {
  x: number
  y: number
  id: number
}

export default function RippleButton({
  children,
  onClick,
  disabled = false,
  className = '',
  variant = 'primary',
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const nextId = useRef(0)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    const button = buttonRef.current
    if (button) {
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = nextId.current++

      setRipples(prev => [...prev, { x, y, id }])
    }

    onClick?.()
  }

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples(prev => prev.slice(1))
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [ripples])

  const baseStyles = 'relative overflow-hidden px-6 py-3 rounded-lg font-medium transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantStyles = {
    primary: cn(
      'bg-primary text-white hover:bg-primary/90',
      'focus:ring-primary/50',
      disabled && 'bg-gray-400 cursor-not-allowed hover:bg-gray-400'
    ),
    outline: cn(
      'border-2 border-primary text-primary bg-transparent hover:bg-primary/10',
      'focus:ring-primary/30',
      disabled && 'border-gray-400 text-gray-400 cursor-not-allowed hover:bg-transparent'
    ),
    glass: cn(
      'bg-white/50 backdrop-blur-sm text-primary border border-white/30 hover:bg-white/70',
      'focus:ring-primary/30',
      disabled && 'bg-gray-200/50 text-gray-400 cursor-not-allowed hover:bg-gray-200/50'
    ),
  }

  return (
    <button
      ref={buttonRef}
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={handleClick}
      disabled={disabled}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/40 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%) scale(0)',
            animation: 'ripple-expand 0.6s ease-out forwards',
            width: '200px',
            height: '200px',
          }}
        />
      ))}
      <style>{`
        @keyframes ripple-expand {
          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
      <span className="relative z-10">{children}</span>
    </button>
  )
}
