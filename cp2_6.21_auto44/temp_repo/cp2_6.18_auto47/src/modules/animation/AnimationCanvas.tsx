import React, { useRef, useEffect, useState } from 'react'
import { useTimelineStore, interpolateKeyframe, Scene } from '../../store/timelineStore'
import { drawShape, elasticEaseOut } from './shapes'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 500
const ANIMATION_DURATION = 100

interface AnimatedValue {
  startValue: number
  targetValue: number
  startTime: number
}

interface AnimatedScene {
  sceneId: string
  x: AnimatedValue
  y: AnimatedValue
  size: AnimatedValue
  opacity: AnimatedValue
  rotation: AnimatedValue
  color: { start: string; target: string; startTime: number }
}

export const AnimationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { scenes, currentFrame } = useTimelineStore()
  const [animatedScenes, setAnimatedScenes] = useState<Map<string, AnimatedScene>>(new Map())
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameRef = useRef<number>(currentFrame)

  useEffect(() => {
    if (lastFrameRef.current === currentFrame) return
    lastFrameRef.current = currentFrame

    const now = performance.now()
    const newAnimated = new Map<string, AnimatedScene>()

    scenes.forEach((scene) => {
      const current = interpolateKeyframe(scene.keyframes, currentFrame)
      const prev = animatedScenes.get(scene.id)

      if (prev) {
        newAnimated.set(scene.id, {
          sceneId: scene.id,
          x: { startValue: currentAnimatedValue(prev.x, now), targetValue: current.x, startTime: now },
          y: { startValue: currentAnimatedValue(prev.y, now), targetValue: current.y, startTime: now },
          size: { startValue: currentAnimatedValue(prev.size, now), targetValue: current.size, startTime: now },
          opacity: { startValue: currentAnimatedValue(prev.opacity, now), targetValue: current.opacity, startTime: now },
          rotation: { startValue: currentAnimatedValue(prev.rotation, now), targetValue: current.rotation, startTime: now },
          color: { start: currentColorValue(prev.color, now), target: current.color, startTime: now },
        })
      } else {
        newAnimated.set(scene.id, {
          sceneId: scene.id,
          x: { startValue: current.x, targetValue: current.x, startTime: now },
          y: { startValue: current.y, targetValue: current.y, startTime: now },
          size: { startValue: current.size, targetValue: current.size, startTime: now },
          opacity: { startValue: current.opacity, targetValue: current.opacity, startTime: now },
          rotation: { startValue: current.rotation, targetValue: current.rotation, startTime: now },
          color: { start: current.color, target: current.color, startTime: now },
        })
      }
    })

    setAnimatedScenes(newAnimated)
  }, [currentFrame, scenes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = (timestamp: number) => {
      ctx.fillStyle = '#0f3460'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      scenes.forEach((scene) => {
        const animated = animatedScenes.get(scene.id)
        if (animated) {
          const t = Math.min(1, (timestamp - animated.x.startTime) / ANIMATION_DURATION)
          const eased = elasticEaseOut(t)

          const x = lerp(animated.x.startValue, animated.x.targetValue, eased)
          const y = lerp(animated.y.startValue, animated.y.targetValue, eased)
          const size = lerp(animated.size.startValue, animated.size.targetValue, eased)
          const opacity = lerp(animated.opacity.startValue, animated.opacity.targetValue, eased)
          const rotation = lerp(animated.rotation.startValue, animated.rotation.targetValue, eased)
          const color = lerpColor(animated.color.start, animated.color.target, eased)

          drawShape(ctx, scene.shapeType, {
            x,
            y,
            size,
            opacity,
            rotation,
            color,
            cornerRadius: 8,
            shadowBlur: 10,
          })
        } else {
          const current = interpolateKeyframe(scene.keyframes, currentFrame)
          drawShape(ctx, scene.shapeType, {
            x: current.x,
            y: current.y,
            size: current.size,
            opacity: current.opacity,
            rotation: current.rotation,
            color: current.color,
            cornerRadius: 8,
            shadowBlur: 10,
          })
        }
      })

      animationFrameRef.current = requestAnimationFrame(render)
    }

    animationFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [scenes, animatedScenes, currentFrame])

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        padding: 20,
        overflow: 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  )
}

function currentAnimatedValue(av: AnimatedValue, now: number): number {
  const t = Math.min(1, (now - av.startTime) / ANIMATION_DURATION)
  const eased = elasticEaseOut(t)
  return lerp(av.startValue, av.targetValue, eased)
}

function currentColorValue(
  color: { start: string; target: string; startTime: number },
  now: number
): string {
  const t = Math.min(1, (now - color.startTime) / ANIMATION_DURATION)
  const eased = elasticEaseOut(t)
  return lerpColor(color.start, color.target, eased)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = parseColor(color1)
  const c2 = parseColor(color2)
  if (!c1 || !c2) return color1

  const r = Math.round(lerp(c1.r, c2.r, t))
  const g = Math.round(lerp(c1.g, c2.g, t))
  const b = Math.round(lerp(c1.b, c2.b, t))
  return `rgb(${r}, ${g}, ${b})`
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith('#')) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }
  if (color.startsWith('rgb')) {
    const result = color.match(/\d+/g)
    if (result && result.length >= 3) {
      return {
        r: parseInt(result[0]),
        g: parseInt(result[1]),
        b: parseInt(result[2]),
      }
    }
  }
  return null
}
