import { useEffect, useRef, useState } from 'react'
import type { HSLColor, Recipe } from './GameEngine'
import { hslToString, getComplementaryColor, TOTAL_RECIPES } from './GameEngine'
import { useStore } from './store'

interface Bubble {
  x: number
  y: number
  radius: number
  vy: number
  alpha: number
  wobble: number
  wobbleSpeed: number
}

interface FountainParticle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: HSLColor
  alpha: number
  life: number
  maxLife: number
}

const CAULDRON_SIZE = 200
const CAULDRON_CENTER = CAULDRON_SIZE / 2
const LIQUID_RADIUS = 78
const FOUNTAIN_DURATION = 1500
const BUBBLE_SPAWN_RATE = 80

export default function AlchemyCauldron() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bubbleSpawnTimer = useRef(0)
  const lastFrameTime = useRef(performance.now())
  const bubblesRef = useRef<Bubble[]>([])
  const fountainRef = useRef<FountainParticle[]>([])
  const animationFrameRef = useRef<number>(0)
  const prevTriggerRef = useRef(0)

  const mixedColor = useStore((s) => s.cauldron.mixedColor)
  const isShaking = useStore((s) => s.cauldron.isShaking)
  const currentRecipe = useStore((s) => s.cauldron.currentRecipe)
  const triggerSuccess = useStore((s) => s.cauldron.triggerSuccess)
  const materialCount = useStore((s) => s.selectedMaterials.length)
  const finishSuccessAnimation = useStore((s) => s.finishSuccessAnimation)

  const [showRecipeCard, setShowRecipeCard] = useState(false)
  const [displayRecipe, setDisplayRecipe] = useState<Recipe | null>(null)
  const unlockedRecipes = useStore((s) => s.unlockedRecipes.length)

  useEffect(() => {
    if (triggerSuccess > prevTriggerRef.current && currentRecipe) {
      prevTriggerRef.current = triggerSuccess
      spawnFountainParticles(currentRecipe.themeColor)
      setDisplayRecipe(currentRecipe)
      setShowRecipeCard(true)
      setTimeout(() => {
        setShowRecipeCard(false)
        finishSuccessAnimation()
      }, FOUNTAIN_DURATION + 2000)
    }
  }, [triggerSuccess, currentRecipe, finishSuccessAnimation])

  function spawnFountainParticles(themeColor: HSLColor) {
    const particles: FountainParticle[] = []
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 40 + Math.random() * 120
      const vx = Math.cos(angle) * speed * 0.4
      const vy = -(60 + Math.random() * 140)
      particles.push({
        x: CAULDRON_CENTER + (Math.random() - 0.5) * 40,
        y: CAULDRON_CENTER - LIQUID_RADIUS * 0.5,
        vx,
        vy,
        radius: 2 + Math.random() * 5,
        color: {
          h: (themeColor.h + (Math.random() - 0.5) * 40 + 360) % 360,
          s: themeColor.s,
          l: Math.min(85, themeColor.l + (Math.random() - 0.2) * 30),
        },
        alpha: 1,
        life: 0,
        maxLife: FOUNTAIN_DURATION,
      })
    }
    fountainRef.current = [...fountainRef.current, ...particles]
  }

  function spawnBubble() {
    const bubbleColor = getComplementaryColor(mixedColor)
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * (LIQUID_RADIUS - 10)
    bubblesRef.current.push({
      x: CAULDRON_CENTER + Math.cos(angle) * dist,
      y: CAULDRON_CENTER + LIQUID_RADIUS * 0.3,
      radius: 2 + Math.random() * 4,
      vy: 20 + Math.random() * 20,
      alpha: 0.3,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 2 + Math.random() * 3,
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const ctx: CanvasRenderingContext2D = context

    const dpr = window.devicePixelRatio || 1
    canvas.width = CAULDRON_SIZE * dpr
    canvas.height = CAULDRON_SIZE * dpr
    canvas.style.width = `${CAULDRON_SIZE}px`
    canvas.style.height = `${CAULDRON_SIZE}px`
    ctx.scale(dpr, dpr)

    function animate(now: number) {
      const dt = Math.min(50, now - lastFrameTime.current) / 1000
      lastFrameTime.current = now

      ctx.clearRect(0, 0, CAULDRON_SIZE, CAULDRON_SIZE)

      drawLiquid(ctx)

      if (materialCount > 0) {
        bubbleSpawnTimer.current += dt * 1000
        const spawnInterval = Math.max(30, BUBBLE_SPAWN_RATE - materialCount * 8)
        while (bubbleSpawnTimer.current >= spawnInterval) {
          bubbleSpawnTimer.current -= spawnInterval
          if (bubblesRef.current.length < 60) {
            spawnBubble()
          }
        }
      }

      updateAndDrawBubbles(ctx, dt)
      updateAndDrawFountain(ctx, dt)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [materialCount, mixedColor])

  function drawLiquid(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(CAULDRON_CENTER, CAULDRON_CENTER + 8, LIQUID_RADIUS, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    const grad = ctx.createRadialGradient(
      CAULDRON_CENTER - 20,
      CAULDRON_CENTER - 10,
      10,
      CAULDRON_CENTER,
      CAULDRON_CENTER + 8,
      LIQUID_RADIUS,
    )
    grad.addColorStop(0, hslToString({
      h: mixedColor.h,
      s: Math.min(100, mixedColor.s + 10),
      l: Math.min(80, mixedColor.l + 15),
    }, 0.95))
    grad.addColorStop(1, hslToString(mixedColor, 0.98))

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CAULDRON_SIZE, CAULDRON_SIZE)

    ctx.beginPath()
    ctx.arc(CAULDRON_CENTER - 25, CAULDRON_CENTER - 5, 18, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,0.12)`
    ctx.fill()

    ctx.restore()
  }

  function updateAndDrawBubbles(ctx: CanvasRenderingContext2D, dt: number) {
    const bubbleColor = getComplementaryColor(mixedColor)
    const alive: Bubble[] = []

    for (const b of bubblesRef.current) {
      b.y -= b.vy * dt
      b.wobble += b.wobbleSpeed * dt
      const wobbleX = Math.sin(b.wobble) * 2.5

      const distFromCenter = Math.hypot(
        b.x + wobbleX - CAULDRON_CENTER,
        b.y - (CAULDRON_CENTER + 8),
      )

      if (b.y < CAULDRON_CENTER - LIQUID_RADIUS * 0.5 || b.alpha <= 0) continue
      if (distFromCenter > LIQUID_RADIUS - 4) continue

      b.alpha = Math.max(0, b.alpha - dt * 0.15)

      ctx.save()
      ctx.globalAlpha = b.alpha * 0.4
      ctx.beginPath()
      ctx.arc(b.x + wobbleX, b.y, b.radius, 0, Math.PI * 2)
      ctx.fillStyle = hslToString(bubbleColor, 1)
      ctx.fill()
      ctx.globalAlpha = b.alpha * 0.8
      ctx.beginPath()
      ctx.arc(b.x + wobbleX - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()

      alive.push(b)
    }

    bubblesRef.current = alive
  }

  function updateAndDrawFountain(ctx: CanvasRenderingContext2D, dt: number) {
    const gravity = 180
    const alive: FountainParticle[] = []

    for (const p of fountainRef.current) {
      p.life += dt * 1000
      if (p.life >= p.maxLife) continue

      p.vy += gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt

      const lifeRatio = p.life / p.maxLife
      p.alpha = 1 - easeOutCubic(lifeRatio)
      p.radius = Math.max(0.5, p.radius * (1 - lifeRatio * 0.4))

      if (p.alpha <= 0 || p.radius <= 0.5) continue

      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = hslToString(p.color, 1)
      ctx.shadowColor = hslToString(p.color, 0.8)
      ctx.shadowBlur = p.radius * 3
      ctx.fill()
      ctx.restore()

      alive.push(p)
    }

    fountainRef.current = alive
  }

  function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3)
  }

  const progress = (unlockedRecipes / TOTAL_RECIPES) * 100

  return (
    <div className="cauldron-wrapper">
      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span className="progress-text">
            {unlockedRecipes}/{TOTAL_RECIPES} 配方已解锁
          </span>
        </div>
      </div>

      <div className={`cauldron-container ${isShaking ? 'shaking' : ''}`}>
        <div className="cauldron-glow" />
        <div className="cauldron-outer">
          <div className="cauldron-inner">
            <div className="cauldron-liquid-mask">
              <canvas ref={canvasRef} className="cauldron-canvas" />
            </div>
            <div className="cauldron-shine" />
            <div className="cauldron-rim" />
          </div>
        </div>

        <div className="cauldron-stand-left" />
        <div className="cauldron-stand-right" />
        <div className="cauldron-stand-base" />

        {showRecipeCard && displayRecipe && (
          <div className="recipe-success-card">
            <div
              className="recipe-accent"
              style={{
                background: `linear-gradient(90deg, ${hslToString(displayRecipe.themeColor, 1)}, ${hslToString({ ...displayRecipe.themeColor, h: (displayRecipe.themeColor.h + 40) % 360 }, 1)})`,
              }}
            />
            <h2 className="recipe-name">{displayRecipe.name}</h2>
            <p className="recipe-desc">{displayRecipe.description}</p>
            <div className="recipe-materials">
              {displayRecipe.materials.map((mid) => {
                const mat = useStore.getState().selectedMaterials.find((m) => m.id === mid)
                return mat ? (
                  <span key={mid} className="recipe-mat">
                    {mat.icon} {mat.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>

      <div className="material-count-indicator">
        <span className="count-label">坩埚材料</span>
        <span className="count-value">{materialCount}</span>
      </div>
    </div>
  )
}
