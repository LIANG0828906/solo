import { useState, useRef, useEffect, memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  position?: TooltipPosition
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[#16213e]',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#16213e]',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[#16213e]',
  right: 'inline border-r-[#16213e]',
}

function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [adjustedPosition, setAdjustedPosition] = useState<TooltipPosition>(position)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isVisible || !containerRef.current || !tooltipRef.current) return

    const adjustPosition = () => {
      const container = containerRef.current
      const tooltip = tooltipRef.current
      if (!container || !tooltip) return

      const containerRect = container.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let newPosition: TooltipPosition = position

      if (position === 'top' && containerRect.top < tooltipRect.height + 10) {
        newPosition = 'bottom'
      } else if (position === 'bottom' && containerRect.bottom + tooltipRect.height + 10 > viewportHeight) {
        newPosition = 'top'
      } else if (position === 'left' && containerRect.left < tooltipRect.width + 10) {
        newPosition = 'right'
      } else if (position === 'right' && containerRect.right + tooltipRect.width + 10 > viewportWidth) {
        newPosition = 'left'
      }

      if (newPosition === 'top' || newPosition === 'bottom') {
        const tooltipHalfWidth = tooltipRect.width / 2
        if (containerRect.left - tooltipHalfWidth < 10) {
          tooltip.style.left = `${tooltipHalfWidth - containerRect.left + 10}px`
        } else if (containerRect.right + tooltipHalfWidth > viewportWidth - 10) {
          tooltip.style.left = `${viewportWidth - containerRect.right - tooltipHalfWidth - 10}px`
        } else {
          tooltip.style.left = ''
        }
      }

      setAdjustedPosition(newPosition)
    }

    const timeoutId = setTimeout(adjustPosition, 0)
    window.addEventListener('resize', adjustPosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', adjustPosition)
    }
  }, [isVisible, position])

  const handleMouseEnter = () => setIsVisible(true)
  const handleMouseLeave = () => setIsVisible(false)

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        ref={tooltipRef}
        className={cn(
          'absolute z-50 px-3 py-2 text-sm whitespace-nowrap rounded-md border pointer-events-none',
          positionStyles[adjustedPosition],
          isVisible ? 'opacity-100' : 'opacity-0',
          'transition-opacity duration-200 ease-in-out',
        )}
        style={{
          backgroundColor: '#16213e',
          borderColor: '#0f3460',
          color: '#eaeaea',
        }}
      >
        {content}
        <div
          className={cn(
            'absolute w-0 h-0 border-4 border-transparent',
            arrowStyles[adjustedPosition],
          )}
          style={{
            borderTopColor: adjustedPosition === 'top' ? '#16213e' : 'transparent',
            borderBottomColor: adjustedPosition === 'bottom' ? '#16213e' : 'transparent',
            borderLeftColor: adjustedPosition === 'left' ? '#16213e' : 'transparent',
            borderRightColor: adjustedPosition === 'right' ? '#16213e' : 'transparent',
          }}
        />
      </div>
    </div>
  )
}

export default memo(Tooltip)
