import { type ButtonHTMLAttributes, type MouseEvent, useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface RippleItem {
  x: number
  y: number
  id: number
}

interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const variantClasses: Record<string, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
}

const rippleColor: Record<string, string> = {
  primary: 'rgba(255,255,255,0.4)',
  secondary: 'rgba(0,0,0,0.1)',
}

export default function RippleButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  ...rest
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<RippleItem[]>([])
  const counterRef = useRef(0)

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = counterRef.current++
      setRipples((prev) => [...prev, { x, y, id }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)
      onClick?.(e)
    },
    [onClick]
  )

  return (
    <button
      className={cn(
        'relative overflow-hidden rounded-md font-medium transition-colors duration-300',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={handleClick}
      {...rest}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-[ripple_0.6s_ease-out_forwards] pointer-events-none"
          style={{
            left: ripple.x - 5,
            top: ripple.y - 5,
            width: 10,
            height: 10,
            backgroundColor: rippleColor[variant],
          }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </button>
  )
}
