import { useEffect, useRef } from 'react'

interface RippleOptions {
  duration?: number
  color?: string
}

export function useRipple<T extends HTMLElement>(options: RippleOptions = {}) {
  const ref = useRef<T>(null)
  const { duration = 600, color = 'rgba(255,255,255,0.3)' } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleClick = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      ripple.style.position = 'absolute'
      ripple.style.borderRadius = '50%'
      ripple.style.backgroundColor = color
      ripple.style.pointerEvents = 'none'
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      ripple.style.transform = 'scale(0)'
      ripple.style.opacity = '0.6'
      ripple.style.animation = `ripple ${duration}ms ease-out forwards`

      if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative'
      }
      element.style.overflow = 'hidden'

      element.appendChild(ripple)

      setTimeout(() => {
        ripple.remove()
      }, duration)
    }

    element.addEventListener('click', handleClick)
    return () => element.removeEventListener('click', handleClick)
  }, [duration, color])

  return ref
}
