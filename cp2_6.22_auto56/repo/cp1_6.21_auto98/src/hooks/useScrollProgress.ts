import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseScrollProgressOptions {
  totalScenes?: number
  throttleMs?: number
}

export interface UseScrollProgressReturn {
  scrollProgress: number
  currentScene: number
  viewportHeight: number
  totalScrollHeight: number
}

export function useScrollProgress(
  options: UseScrollProgressOptions = {}
): UseScrollProgressReturn {
  const { totalScenes = 6, throttleMs = 16 } = options

  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentScene, setCurrentScene] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  )
  const [totalScrollHeight, setTotalScrollHeight] = useState(0)

  const lastScrollY = useRef(0)
  const lastUpdateTime = useRef(0)
  const ticking = useRef(false)
  const rafId = useRef<number | null>(null)

  const updateScroll = useCallback(() => {
    const now = performance.now()
    if (now - lastUpdateTime.current < throttleMs) {
      ticking.current = false
      return
    }
    lastUpdateTime.current = now

    const scrollY = window.scrollY
    const docHeight = document.documentElement.scrollHeight
    const vh = window.innerHeight
    const scrollable = docHeight - vh

    const progress = scrollable > 0 ? scrollY / scrollable : 0
    const clampedProgress = Math.max(0, Math.min(1, progress))

    const heroSection = vh
    const scenesHeight = totalScenes * vh

    const sceneProgress = scrollY > heroSection
      ? (scrollY - heroSection) / scenesHeight
      : 0

    const scene = scrollY < heroSection
      ? 0
      : Math.min(totalScenes, Math.max(1, Math.floor(sceneProgress * totalScenes) + 1))

    setScrollProgress(clampedProgress)
    setCurrentScene(scene)
    setViewportHeight(vh)
    setTotalScrollHeight(heroSection + scenesHeight + 80)

    lastScrollY.current = scrollY
    ticking.current = false
  }, [totalScenes, throttleMs])

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      rafId.current = requestAnimationFrame(updateScroll)
      ticking.current = true
    }
  }, [updateScroll])

  const onResize = useCallback(() => {
    setViewportHeight(window.innerHeight)
    updateScroll()
  }, [updateScroll])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    updateScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [onScroll, onResize, updateScroll])

  return {
    scrollProgress,
    currentScene,
    viewportHeight,
    totalScrollHeight,
  }
}
