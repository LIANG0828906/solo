import type { AnimationOptions } from '@/types'

interface AnimationState {
  animationId: number | null
  startTime: number | null
}

const animationStates = new Map<string, AnimationState>()

export function animateLines(
  container: HTMLElement,
  options: AnimationOptions = {}
): () => void {
  const { delay = 0, duration = 800, stagger = 50 } = options
  const stateKey = `lines-${container.dataset.animationId || Math.random().toString(36)}`
  
  const lines = container.querySelectorAll('.poem-line')
  const allChars: HTMLElement[] = []

  lines.forEach((line, lineIndex) => {
    const text = line.textContent || ''
    line.innerHTML = ''
    line.style.opacity = '1'
    
    text.split('').forEach((char, charIndex) => {
      const span = document.createElement('span')
      span.className = 'poem-char'
      span.textContent = char === ' ' ? '\u00A0' : char
      span.style.opacity = '0'
      span.style.transform = 'translateY(10px)'
      span.style.display = 'inline-block'
      span.style.transition = 'none'
      line.appendChild(span)
      allChars.push(span)
    })
  })

  let animationId: number | null = null
  let startTime: number | null = null

  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime - delay

    if (elapsed < 0) {
      animationId = requestAnimationFrame(animate)
      return
    }

    allChars.forEach((char, index) => {
      const charDelay = index * stagger
      const charElapsed = elapsed - charDelay

      if (charElapsed >= 0) {
        const progress = Math.min(charElapsed / duration, 1)
        const easeProgress = easeOutCubic(progress)
        char.style.opacity = String(easeProgress)
        char.style.transform = `translateY(${10 * (1 - easeProgress)}px)`
      }
    })

    const totalDuration = delay + allChars.length * stagger + duration
    if (elapsed < totalDuration) {
      animationId = requestAnimationFrame(animate)
    } else {
      animationStates.delete(stateKey)
    }
  }

  animationId = requestAnimationFrame(animate)
  animationStates.set(stateKey, { animationId, startTime: null })

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    animationStates.delete(stateKey)
  }
}

export function animateHeart(
  element: HTMLElement,
  count: number
): () => void {
  const stateKey = `heart-${element.dataset.animationId || Math.random().toString(36)}`
  let animationId: number | null = null
  let startTime: number | null = null
  const duration = 600

  const counter = document.createElement('span')
  counter.className = 'heart-counter'
  counter.textContent = `+${count}`
  counter.style.cssText = `
    position: absolute;
    font-size: 16px;
    font-weight: bold;
    color: #E74C3C;
    pointer-events: none;
    opacity: 0;
    transform: translateY(0) scale(0.5);
  `
  element.style.position = 'relative'
  element.appendChild(counter)

  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)

    const scaleProgress = easeOutBack(progress)
    element.style.transform = `scale(${1 + 0.3 * Math.sin(progress * Math.PI)})`

    counter.style.opacity = String(1 - progress)
    counter.style.transform = `translateY(${-30 * progress}px) scale(${0.5 + scaleProgress * 0.5})`

    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      element.style.transform = 'scale(1)'
      setTimeout(() => counter.remove(), 100)
      animationStates.delete(stateKey)
    }
  }

  animationId = requestAnimationFrame(animate)
  animationStates.set(stateKey, { animationId, startTime: null })

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    counter.remove()
    element.style.transform = 'scale(1)'
    animationStates.delete(stateKey)
  }
}

export function animateBackgroundTransition(
  element: HTMLElement,
  fromColor: string,
  toColor: string,
  duration: number = 500
): () => void {
  const stateKey = `bg-${element.dataset.animationId || Math.random().toString(36)}`
  let animationId: number | null = null
  let startTime: number | null = null

  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = easeInOutCubic(progress)

    const interpolatedColor = interpolateColor(fromColor, toColor, easeProgress)
    element.style.backgroundColor = interpolatedColor

    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      animationStates.delete(stateKey)
    }
  }

  animationId = requestAnimationFrame(animate)
  animationStates.set(stateKey, { animationId, startTime: null })

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    animationStates.delete(stateKey)
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function parseColor(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16)
    ]
  }
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g)
    if (match) {
      return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])]
    }
  }
  return [0, 0, 0]
}

function interpolateColor(from: string, to: string, t: number): string {
  const [r1, g1, b1] = parseColor(from)
  const [r2, g2, b2] = parseColor(to)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}

export function clearAllAnimations(): void {
  animationStates.forEach((state) => {
    if (state.animationId) {
      cancelAnimationFrame(state.animationId)
    }
  })
  animationStates.clear()
}
