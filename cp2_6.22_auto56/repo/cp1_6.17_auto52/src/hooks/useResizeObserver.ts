import { useState, useEffect, useRef } from 'react'

export function useResizeObserver<T extends HTMLElement>(
  elementRef: React.RefObject<T>,
  delay = 50
): number {
  const [width, setWidth] = useState<number>(0)
  const timeoutRef = useRef<number | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0]
      if (!entry) return

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        setWidth(entry.contentRect.width)
      }, delay)
    }

    observerRef.current = new ResizeObserver(handleResize)
    observerRef.current.observe(element)

    setWidth(element.getBoundingClientRect().width)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [elementRef, delay])

  return width
}
