import React, { Suspense, lazy, useEffect, useRef, useCallback } from 'react'
import { useGameStore, SceneType } from '../../store/gameStore'

const ForestScene = lazy(() => import('../../scenes/ForestScene'))
const DesertScene = lazy(() => import('../../scenes/DesertScene'))
const StarryScene = lazy(() => import('../../scenes/StarryScene'))

const SCENE_NAMES: Record<SceneType, string> = {
  forest: '🌲 神秘森林',
  desert: '🏜️ 无尽沙漠',
  starry: '✨ 星空幻境'
}

const PortalNavigator: React.FC = () => {
  const { currentScene, isTransitioning } = useGameStore()

  const renderScene = () => {
    const SceneComponent = (() => {
      switch (currentScene) {
        case 'forest':
          return ForestScene
        case 'desert':
          return DesertScene
        case 'starry':
          return StarryScene
        default:
          return ForestScene
      }
    })()

    return (
      <Suspense fallback={<div className="scene-loading">加载场景中...</div>}>
        <SceneComponent />
      </Suspense>
    )
  }

  return (
    <div className={`portal-navigator ${isTransitioning ? 'transitioning' : ''}`}>
      <div className={`scene-container blinds-out ${isTransitioning ? 'active' : ''}`}>
        <div className="scene-content">{renderScene()}</div>
      </div>
      <div className={`scene-reveal radial-in ${isTransitioning ? 'active' : ''}`}>
        <div className="scene-content">{renderScene()}</div>
      </div>
    </div>
  )
}

export const SceneHeader: React.FC = () => {
  const { currentScene, totalCombinations, successfulCombinations } = useGameStore()

  return (
    <header className="scene-header">
      <div className="header-left">
        <span className="scene-name">{SCENE_NAMES[currentScene]}</span>
      </div>
      <div className="header-right">
        <span className="stat-item">组合次数: {totalCombinations}</span>
        <span className="stat-divider">|</span>
        <span className="stat-item">成功次数: {successfulCombinations}</span>
      </div>
    </header>
  )
}

interface SceneParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  rotation: number
  rotationSpeed: number
  type: number
}

export const useParticleSystem = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  particleConfig: {
    count: number
    colors: string[]
    minSize: number
    maxSize: number
    minSpeedX: number
    maxSpeedX: number
    minSpeedY: number
    maxSpeedY: number
    gravity?: number
    shapes?: ('circle' | 'leaf' | 'star' | 'sand')[]
  }
) => {
  const particlesRef = useRef<SceneParticle[]>([])
  const animationRef = useRef<number>(0)

  const initParticles = useCallback((width: number, height: number) => {
    const particles: SceneParticle[] = []
    for (let i = 0; i < particleConfig.count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: particleConfig.minSpeedX + Math.random() * (particleConfig.maxSpeedX - particleConfig.minSpeedX),
        vy: particleConfig.minSpeedY + Math.random() * (particleConfig.maxSpeedY - particleConfig.minSpeedY),
        size: particleConfig.minSize + Math.random() * (particleConfig.maxSize - particleConfig.minSize),
        alpha: 0.3 + Math.random() * 0.7,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        type: Math.floor(Math.random() * particleConfig.colors.length)
      })
    }
    particlesRef.current = particles
  }, [particleConfig])

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, p: SceneParticle, colors: string[], shapes?: string[]) => {
      const shape = shapes?.[p.type % shapes.length] || 'circle'
      const color = colors[p.type % colors.length]

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = color

      if (shape === 'leaf') {
        ctx.beginPath()
        ctx.moveTo(0, -p.size)
        ctx.bezierCurveTo(p.size, -p.size / 2, p.size / 2, p.size, 0, p.size * 0.8)
        ctx.bezierCurveTo(-p.size / 2, p.size, -p.size, -p.size / 2, 0, -p.size)
        ctx.fill()
      } else if (shape === 'star') {
        const spikes = 5
        const outerRadius = p.size
        const innerRadius = p.size * 0.4
        ctx.beginPath()
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (i * Math.PI) / spikes - Math.PI / 2
          const sx = Math.cos(angle) * radius
          const sy = Math.sin(angle) * radius
          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        }
        ctx.closePath()
        ctx.fill()
      } else if (shape === 'sand') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    },
    []
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    const gravity = particleConfig.gravity || 0

    for (const p of particlesRef.current) {
      p.x += p.vx
      p.y += p.vy + gravity
      p.rotation += p.rotationSpeed

      if (particleConfig.gravity !== undefined) {
        p.vy += gravity * 0.01
      }

      if (p.x < -20) p.x = width + 20
      if (p.x > width + 20) p.x = -20
      if (p.y < -20) p.y = height + 20
      if (p.y > height + 20) {
        p.y = -20
        p.x = Math.random() * width
      }

      drawParticle(ctx, p, particleConfig.colors, particleConfig.shapes)
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [canvasRef, particleConfig, drawParticle])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles(canvas.width, canvas.height)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [canvasRef, initParticles, animate])
}

export default PortalNavigator
