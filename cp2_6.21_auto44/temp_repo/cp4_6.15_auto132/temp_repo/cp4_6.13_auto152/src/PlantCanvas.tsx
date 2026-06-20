import { useEffect, useRef, useCallback } from 'react'
import {
  type PlantStage,
  type PlantParams,
  type PlantState,
  stageNames,
  stageDurations,
  getFlowerColor,
  getLeafColor,
  getStemColor,
  generateRandomStemHeight,
  generatePetalCount,
  lerp,
  easeOutCubic
} from './utils/plantGenetics'

interface PlantCanvasProps {
  params: PlantParams
  isPlanted: boolean
  onStageChange: (stage: PlantStage) => void
  onPlantComplete: () => void
}

export default function PlantCanvas({ params, isPlanted, onStageChange, onPlantComplete }: PlantCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement>(null)
  const plantStateRef = useRef<PlantState>({
    stage: 'seed',
    stageProgress: 0,
    stemHeight: 0,
    leafSize: 0,
    flowerSize: 0
  })
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const stageStartTimeRef = useRef<number>(0)
  const transitionRef = useRef<{
    active: boolean
    startParams: PlantParams
    endParams: PlantParams
    startTime: number
  }>({
    active: false,
    startParams: { light: 50, water: 50, soil: 50 },
    endParams: { light: 50, water: 50, soil: 50 },
    startTime: 0
  })
  const notificationRef = useRef<{ text: string; startTime: number } | null>(null)
  const petalCountRef = useRef<number>(5)
  const stemHeightRef = useRef<number>(100)
  const swayOffsetRef = useRef<number>(0)

  const drawPot = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const potX = (width - 600) / 2
    const potY = height - 400

    const gradient = ctx.createLinearGradient(potX, potY, potX + 600, potY + 400)
    gradient.addColorStop(0, '#8B5A2B')
    gradient.addColorStop(0.5, '#A0522D')
    gradient.addColorStop(1, '#8B5A2B')

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    ctx.beginPath()
    ctx.roundRect(potX, potY, 600, 400, 20)
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.strokeStyle = '#6B4423'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.restore()
  }, [])

  const drawSoil = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const soilX = (width - 400) / 2
    const soilY = height - 400 - 300
    const soilWidth = 400
    const soilHeight = 60

    const gradient = ctx.createLinearGradient(soilX, soilY, soilX, soilY + soilHeight)
    gradient.addColorStop(0, '#3D2817')
    gradient.addColorStop(1, '#2D1F12')

    ctx.beginPath()
    ctx.roundRect(soilX, soilY, soilWidth, soilHeight, [0, 0, 10, 10])
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.fillStyle = '#4A3520'
    for (let i = 0; i < 50; i++) {
      const x = soilX + Math.random() * soilWidth
      const y = soilY + Math.random() * soilHeight
      const size = 2 + Math.random() * 4
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  const drawSeed = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const seedX = width / 2
    const seedY = height - 400 - 55

    ctx.save()
    ctx.beginPath()
    ctx.ellipse(seedX, seedY, 8, 12, 0, 0, Math.PI * 2)
    const gradient = ctx.createRadialGradient(seedX - 2, seedY - 2, 0, seedX, seedY, 12)
    gradient.addColorStop(0, '#D2B48C')
    gradient.addColorStop(1, '#8B7355')
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()
  }, [])

  const drawGermination = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
    const seedX = width / 2
    const seedY = height - 400 - 55

    ctx.save()
    ctx.beginPath()
    ctx.ellipse(seedX, seedY + progress * 5, 8, 12 - progress * 4, 0, 0, Math.PI * 2)
    const gradient = ctx.createRadialGradient(seedX - 2, seedY - 2, 0, seedX, seedY, 12)
    gradient.addColorStop(0, '#D2B48C')
    gradient.addColorStop(1, '#8B7355')
    ctx.fillStyle = gradient
    ctx.fill()

    const shootHeight = progress * 20
    if (shootHeight > 0) {
      ctx.beginPath()
      ctx.moveTo(seedX, seedY - 12)
      ctx.lineTo(seedX + progress * 5, seedY - 12 - shootHeight)
      ctx.strokeStyle = '#7CFC00'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    ctx.restore()
  }, [])

  const drawCotyledon = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, sway: number) => {
    const baseY = height - 400 - 80
    const stemHeight = 30 + progress * 20

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(width / 2, baseY)
    ctx.lineTo(width / 2, baseY - stemHeight)
    ctx.strokeStyle = '#7CFC00'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()

    const leafSize = progress * 15
    const leafAngle = Math.PI / 6

    const leftX = width / 2 + Math.cos(Math.PI - leafAngle + sway) * leafSize
    const leftY = baseY - stemHeight + Math.sin(Math.PI - leafAngle + sway) * leafSize
    ctx.beginPath()
    ctx.ellipse(leftX, leftY, leafSize * 0.6, leafSize, Math.PI - leafAngle + sway, 0, Math.PI * 2)
    ctx.fillStyle = '#7CFC00'
    ctx.fill()

    const rightX = width / 2 + Math.cos(leafAngle + sway) * leafSize
    const rightY = baseY - stemHeight + Math.sin(leafAngle + sway) * leafSize
    ctx.beginPath()
    ctx.ellipse(rightX, rightY, leafSize * 0.6, leafSize, leafAngle + sway, 0, Math.PI * 2)
    ctx.fillStyle = '#7CFC00'
    ctx.fill()
    ctx.restore()
  }, [])

  const drawTrueLeaf = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, sway: number, leafColor: string) => {
    const baseY = height - 400 - 100
    const stemHeight = 50 + progress * 30

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(width / 2, baseY)
    ctx.lineTo(width / 2, baseY - stemHeight)
    ctx.strokeStyle = '#90EE90'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.beginPath()
    ctx.ellipse(width / 2 - 25 + sway * 3, baseY - stemHeight + 10, 12, 20, -Math.PI / 6 + sway * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = leafColor
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(width / 2 + 25 + sway * 3, baseY - stemHeight + 10, 12, 20, Math.PI / 6 - sway * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = leafColor
    ctx.fill()

    const cotyledonSize = 15 * (1 - progress * 0.3)
    ctx.beginPath()
    ctx.ellipse(width / 2 - 15 + sway * 2, baseY - 20, cotyledonSize * 0.6, cotyledonSize, -Math.PI / 4, 0, Math.PI * 2)
    ctx.fillStyle = '#7CFC00'
    ctx.globalAlpha = 0.8 - progress * 0.3
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(width / 2 + 15 + sway * 2, baseY - 20, cotyledonSize * 0.6, cotyledonSize, Math.PI / 4, 0, Math.PI * 2)
    ctx.fillStyle = '#7CFC00'
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.restore()
  }, [])

  const drawStem = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, sway: number, stemColor: string, leafColor: string) => {
    const baseY = height - 400 - 100
    const targetHeight = stemHeightRef.current
    const stemHeight = 80 + progress * (targetHeight - 80)

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(width / 2, baseY)
    const controlX = width / 2 + sway * 20
    ctx.quadraticCurveTo(controlX, baseY - stemHeight / 2, width / 2 + sway * 10, baseY - stemHeight)
    ctx.strokeStyle = stemColor
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()

    const leafCount = 2
    for (let i = 0; i < leafCount; i++) {
      const leafY = baseY - 30 - i * 40 * progress
      const leafX = width / 2 + sway * 15 + (i % 2 === 0 ? -25 : 25)
      ctx.beginPath()
      ctx.moveTo(width / 2 + sway * 10 * ((i % 2 === 0 ? -1 : 1) * 0.5), leafY)
      ctx.bezierCurveTo(
        leafX, leafY - 10,
        leafX + (i % 2 === 0 ? 15 : -15), leafY - 5,
        leafX, leafY + 15
      )
      ctx.bezierCurveTo(
        leafX + (i % 2 === 0 ? 15 : -15), leafY - 5,
        leafX, leafY - 10,
        width / 2 + sway * 10 * ((i % 2 === 0 ? -1 : 1) * 0.5), leafY
      )
      ctx.fillStyle = leafColor
      ctx.fill()
    }
    ctx.restore()
  }, [])

  const drawFlower = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, sway: number, flowerColor: string, petalCount: number) => {
    const baseY = height - 400 - 100
    const stemHeight = stemHeightRef.current
    const flowerX = width / 2 + sway * 10
    const flowerY = baseY - stemHeight

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(width / 2, baseY)
    const controlX = width / 2 + sway * 20
    ctx.quadraticCurveTo(controlX, baseY - stemHeight / 2, flowerX, flowerY)
    ctx.strokeStyle = '#90EE90'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()

    const scale = progress + (1 + Math.sin(Date.now() / 1500) * 0.02) * progress
    ctx.translate(flowerX, flowerY)
    ctx.rotate(sway * 0.3)

    for (let i = 0; i < petalCount; i++) {
      ctx.save()
      ctx.rotate((i * 360 / petalCount + 10) * Math.PI / 180)
      
      const petalScale = scale * (0.9 + Math.random() * 0.2)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(
        8 * petalScale, -5 * petalScale,
        15 * petalScale, -10 * petalScale,
        12 * petalScale, -20 * petalScale
      )
      ctx.bezierCurveTo(
        9 * petalScale, -10 * petalScale,
        5 * petalScale, -5 * petalScale,
        0, 0
      )
      ctx.fillStyle = flowerColor
      ctx.fill()
      ctx.restore()
    }

    ctx.beginPath()
    ctx.arc(0, 0, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#FFD700'
    ctx.fill()

    ctx.restore()
  }, [])

  const drawNotification = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const notification = notificationRef.current
    if (!notification) return

    const elapsed = Date.now() - notification.startTime
    const duration = 1500
    const fadeDuration = 300

    if (elapsed > duration) {
      notificationRef.current = null
      return
    }

    let alpha = 1
    if (elapsed > duration - fadeDuration) {
      alpha = 1 - (elapsed - (duration - fadeDuration)) / fadeDuration
    }

    const text = notification.text
    ctx.save()
    ctx.font = '16px Arial'
    const textWidth = ctx.measureText(text).width
    const padding = 12
    const boxWidth = textWidth + padding * 2
    const boxHeight = 36

    const x = (width - boxWidth) / 2
    const y = height - 400 - 320

    ctx.globalAlpha = 0.7 * alpha
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.roundRect(x, y, boxWidth, boxHeight, 8)
    ctx.fill()

    ctx.globalAlpha = alpha
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x + boxWidth / 2, y + boxHeight / 2)
    ctx.restore()
  }, [])

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, currentParams: PlantParams) => {
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas')
      offscreenRef.current.width = width
      offscreenRef.current.height = height
    }
    const offscreenCtx = offscreenRef.current.getContext('2d')!
    
    offscreenCtx.clearRect(0, 0, width, height)
    
    drawPot(offscreenCtx, width, height)
    drawSoil(offscreenCtx, width, height)

    const plantState = plantStateRef.current
    const time = Date.now()
    swayOffsetRef.current = Math.sin(time / 2000) * 0.3

    if (!isPlanted) {
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(offscreenRef.current, 0, 0)
      drawNotification(ctx, width, height)
      return
    }

    const sway = swayOffsetRef.current

    switch (plantState.stage) {
      case 'seed':
        drawSeed(offscreenCtx, width, height)
        break
      case 'germination':
        drawGermination(offscreenCtx, width, height, plantState.stageProgress)
        break
      case 'cotyledon':
        drawCotyledon(offscreenCtx, width, height, plantState.stageProgress, sway)
        break
      case 'trueLeaf':
        drawTrueLeaf(offscreenCtx, width, height, plantState.stageProgress, sway, getLeafColor(currentParams.light))
        break
      case 'stem':
        drawStem(offscreenCtx, width, height, plantState.stageProgress, sway, getStemColor(currentParams.soil), getLeafColor(currentParams.light))
        break
      case 'flower':
        drawFlower(offscreenCtx, width, height, plantState.stageProgress, sway, getFlowerColor(currentParams.light, currentParams.water), petalCountRef.current)
        break
    }

    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(offscreenRef.current, 0, 0)
    drawNotification(ctx, width, height)
  }, [isPlanted, drawPot, drawSoil, drawSeed, drawGermination, drawCotyledon, drawTrueLeaf, drawStem, drawFlower, drawNotification])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    
    const resize = () => {
      const maxWidth = 1200
      const maxHeight = 675
      const minWidth = 320
      const minHeight = 180
      const ratio = 16 / 9

      let width = window.innerWidth
      let height = window.innerHeight

      if (width / height > ratio) {
        width = Math.min(Math.max(height * ratio, minWidth), maxWidth)
      } else {
        height = Math.min(Math.max(width / ratio, minHeight), maxHeight)
      }

      canvas.width = width
      canvas.height = height

      if (offscreenRef.current) {
        offscreenRef.current.width = width
        offscreenRef.current.height = height
      }
    }

    resize()
    window.addEventListener('resize', resize)

    let currentParams = { ...params }

    const animate = (time: number) => {
      if (transitionRef.current.active) {
        const elapsed = time - transitionRef.current.startTime
        const duration = 1000
        if (elapsed < duration) {
          const t = easeOutCubic(elapsed / duration)
          currentParams = {
            light: lerp(transitionRef.current.startParams.light, transitionRef.current.endParams.light, t),
            water: lerp(transitionRef.current.startParams.water, transitionRef.current.endParams.water, t),
            soil: lerp(transitionRef.current.startParams.soil, transitionRef.current.endParams.soil, t)
          }
        } else {
          currentParams = { ...transitionRef.current.endParams }
          transitionRef.current.active = false
        }
      }

      if (isPlanted && plantStateRef.current.stage !== 'flower') {
        const stage = plantStateRef.current.stage
        const duration = stageDurations[stage]
        
        if (time - stageStartTimeRef.current > duration) {
          const stages: PlantStage[] = ['seed', 'germination', 'cotyledon', 'trueLeaf', 'stem', 'flower']
          const currentIndex = stages.indexOf(stage)
          if (currentIndex < stages.length - 1) {
            const nextStage = stages[currentIndex + 1]
            plantStateRef.current = {
              stage: nextStage,
              stageProgress: 0,
              stemHeight: plantStateRef.current.stemHeight,
              leafSize: plantStateRef.current.leafSize,
              flowerSize: plantStateRef.current.flowerSize
            }
            stageStartTimeRef.current = time
            
            if (nextStage === 'stem') {
              stemHeightRef.current = generateRandomStemHeight()
            }
            if (nextStage === 'flower') {
              petalCountRef.current = generatePetalCount()
            }
            
            notificationRef.current = { text: stageNames[nextStage], startTime: time }
            onStageChange(nextStage)
            
            if (nextStage === 'flower') {
              setTimeout(onPlantComplete, 5000)
            }
          }
        } else {
          plantStateRef.current.stageProgress = (time - stageStartTimeRef.current) / duration
        }
      }

      draw(ctx, canvas.width, canvas.height, currentParams)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [isPlanted, draw, onStageChange, onPlantComplete])

  useEffect(() => {
    if (transitionRef.current.active) {
      transitionRef.current.endParams = params
    } else {
      transitionRef.current = {
        active: true,
        startParams: { ...transitionRef.current.endParams },
        endParams: params,
        startTime: Date.now()
      }
    }
  }, [params])

  useEffect(() => {
    if (isPlanted) {
      plantStateRef.current = {
        stage: 'seed',
        stageProgress: 0,
        stemHeight: 0,
        leafSize: 0,
        flowerSize: 0
      }
      stageStartTimeRef.current = Date.now()
      notificationRef.current = { text: stageNames.seed, startTime: Date.now() }
      onStageChange('seed')
      
      setTimeout(() => {
        plantStateRef.current.stage = 'germination'
        plantStateRef.current.stageProgress = 0
        stageStartTimeRef.current = Date.now()
        notificationRef.current = { text: stageNames.germination, startTime: Date.now() }
        onStageChange('germination')
      }, 1000)
    }
  }, [isPlanted, onStageChange])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        margin: '0 auto',
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  )
}