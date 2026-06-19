import { useEffect, useRef } from 'react'
import { useCrystalStore, CrystalAttributes } from './store'

const LABELS = ['对称性', '透明度', '硬度', '解理', '光泽']

function drawRadar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  attrs: CrystalAttributes
) {
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) / 2 - 28
  const count = 5

  ctx.clearRect(0, 0, width, height)

  ctx.beginPath()
  ctx.arc(cx, cy, radius + 14, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(13, 17, 23, 0.6)'
  ctx.fill()

  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath()
    const r = (radius * ring) / 4
    for (let i = 0; i <= count; i++) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = 'rgba(139, 148, 158, 0.25)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(139, 148, 158, 0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  const values = [attrs.symmetry, attrs.transparency, attrs.hardness, attrs.cleavage, attrs.luster]
  ctx.beginPath()
  for (let i = 0; i <= count; i++) {
    const idx = i % count
    const angle = (Math.PI * 2 * idx) / count - Math.PI / 2
    const r = (radius * Math.max(0, Math.min(100, values[idx]))) / 100
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(79, 195, 247, 0.27)'
  ctx.fill()
  ctx.strokeStyle = '#4FC3F7'
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2
    const r = (radius * Math.max(0, Math.min(100, values[i]))) / 100
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#4FC3F7'
    ctx.fill()
  }

  ctx.font = '12px "Segoe UI", sans-serif'
  ctx.fillStyle = '#8B949E'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2
    const lr = radius + 18
    const x = cx + Math.cos(angle) * lr
    const y = cy + Math.sin(angle) * lr
    ctx.fillText(LABELS[i], x, y)
  }
}

function RadarChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const attributes = useCrystalStore((s) => s.attributes)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    drawRadar(ctx, rect.width, rect.height, attributes)

    let frame = 0
    let running = true
    const loop = () => {
      if (!running) return
      frame++
      if (frame % 6 === 0) {
        const r2 = canvas.getBoundingClientRect()
        drawRadar(ctx, r2.width, r2.height, attributes)
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
    return () => {
      running = false
    }
  }, [attributes])

  return (
    <div className="radar-container">
      <div className="radar-title">晶体属性分析</div>
      <canvas ref={canvasRef} className="radar-canvas" />
    </div>
  )
}

export default RadarChart
