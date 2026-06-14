import { useRef, useEffect, useState, useCallback } from 'react'
import axios from 'axios'

interface BarrageItem {
  id: string
  text: string
  color: string
  timestamp: number
}

interface DisplayBarrage {
  id: string
  text: string
  color: string
  x: number
  baseY: number
  phase: number
  speed: number
  alpha: number
  bitmap: HTMLCanvasElement | null
  width: number
  height: number
}

const BARRAGE_HEIGHT = 28
const BARRAGE_FONT = 'bold 18px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
const BARRAGE_SPEED_MIN = 80
const BARRAGE_SPEED_MAX = 150
const MAX_VISIBLE = 40

export default function BarrageWall() {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const barragesRef = useRef<DisplayBarrage[]>([])
  const seenIdsRef = useRef<Set<string>>(new Set())
  const animFrameRef = useRef(0)
  const lastTimeRef = useRef(0)
  const [inputText, setInputText] = useState('')
  const lanesRef = useRef<number[]>([])

  const createBarrageBitmap = useCallback((text: string, color: string): HTMLCanvasElement => {
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas')
    }
    const measureCanvas = offscreenRef.current
    const mCtx = measureCanvas.getContext('2d')!
    mCtx.font = BARRAGE_FONT
    const metrics = mCtx.measureText(text)
    const tw = Math.ceil(metrics.width) + 16
    const th = BARRAGE_HEIGHT + 8

    const bitmap = document.createElement('canvas')
    bitmap.width = tw * 2
    bitmap.height = th * 2
    const bCtx = bitmap.getContext('2d')!
    bCtx.scale(2, 2)
    bCtx.font = BARRAGE_FONT
    bCtx.fillStyle = color
    bCtx.shadowColor = 'rgba(0,0,0,0.6)'
    bCtx.shadowBlur = 3
    bCtx.shadowOffsetX = 1
    bCtx.shadowOffsetY = 1
    bCtx.textBaseline = 'middle'
    bCtx.fillText(text, 8, th / 2)

    const display: DisplayBarrage = {
      id: '',
      text,
      color,
      x: 0,
      baseY: 0,
      phase: 0,
      speed: 0,
      alpha: 1,
      bitmap,
      width: tw,
      height: th,
    }
    return bitmap
  }, [])

  const addBarrage = useCallback((item: BarrageItem, canvasW: number, canvasH: number) => {
    if (seenIdsRef.current.has(item.id)) return
    seenIdsRef.current.add(item.id)
    if (seenIdsRef.current.size > 200) {
      const ids = Array.from(seenIdsRef.current)
      seenIdsRef.current = new Set(ids.slice(-100))
    }

    if (!lanesRef.current.length) {
      const numLanes = Math.floor((canvasH * 0.4) / (BARRAGE_HEIGHT + 4))
      lanesRef.current = Array(numLanes).fill(0)
    }

    let bestLane = 0
    let bestX = Infinity
    for (let i = 0; i < lanesRef.current.length; i++) {
      if (lanesRef.current[i] < bestX) {
        bestX = lanesRef.current[i]
        bestLane = i
      }
    }

    const bitmap = createBarrageBitmap(item.text, item.color)
    const speed = BARRAGE_SPEED_MIN + Math.random() * (BARRAGE_SPEED_MAX - BARRAGE_SPEED_MIN)
    const baseY = 20 + bestLane * (BARRAGE_HEIGHT + 4)

    const display: DisplayBarrage = {
      id: item.id,
      text: item.text,
      color: item.color,
      x: canvasW + 10,
      baseY,
      phase: Math.random() * Math.PI * 2,
      speed,
      alpha: 1,
      bitmap,
      width: bitmap.width / 2,
      height: bitmap.height / 2,
    }

    lanesRef.current[bestLane] = canvasW + display.width + 20
    barragesRef.current.push(display)

    if (barragesRef.current.length > MAX_VISIBLE) {
      barragesRef.current = barragesRef.current.slice(-MAX_VISIBLE)
    }
  }, [createBarrageBitmap])

  useEffect(() => {
    const canvas = mainCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = canvas.parentElement!.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      lanesRef.current = []
    }
    resizeCanvas()
    const resizeObs = new ResizeObserver(resizeCanvas)
    resizeObs.observe(canvas.parentElement!)

    const animate = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016
      lastTimeRef.current = time
      const dpr = window.devicePixelRatio
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)

      for (let i = barragesRef.current.length - 1; i >= 0; i--) {
        const b = barragesRef.current[i]
        b.x -= b.speed * dt
        if (b.x + b.width < 0) {
          barragesRef.current.splice(i, 1)
          continue
        }

        const floatY = Math.sin(time / 1000 * 1.5 + b.phase) * 3
        const drawY = b.baseY + floatY

        if (b.bitmap) {
          ctx.drawImage(b.bitmap, b.x, drawY, b.width, b.height)
        }
      }

      ctx.restore()
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      resizeObs.disconnect()
    }
  }, [])

  useEffect(() => {
    const fetchBarrages = async () => {
      try {
        const res = await axios.get<BarrageItem[]>('/api/barrages')
        const canvas = mainCanvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio
        const w = canvas.width / dpr
        const h = canvas.height / dpr
        for (const item of res.data) {
          addBarrage(item, w, h)
        }
      } catch {}
    }
    fetchBarrages()
    const interval = setInterval(fetchBarrages, 2000)
    return () => clearInterval(interval)
  }, [addBarrage])

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text) return
    try {
      await axios.post('/api/barrages', { text })
      setInputText('')
    } catch {}
  }, [inputText])

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex-1 relative overflow-hidden pointer-events-none">
        <canvas ref={mainCanvasRef} className="w-full h-full block" />
      </div>
      <div className="flex gap-2 px-4 py-3 bg-deep-blue/80 backdrop-blur-sm border-t border-gold/10">
        <input
          className="flex-1 bg-white/10 rounded-lg px-4 py-2 text-sm text-white
                     placeholder:text-white/40 outline-none border border-gold/20
                     focus:border-gold/50 transition-colors"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="发送弹幕助威..."
          maxLength={50}
        />
        <button
          className="px-5 py-2 rounded-lg bg-bright-yellow text-deep-blue font-bold text-sm
                     hover:bg-bright-yellow-dark transition-colors shrink-0"
          onClick={handleSend}
        >
          发送
        </button>
      </div>
    </div>
  )
}
