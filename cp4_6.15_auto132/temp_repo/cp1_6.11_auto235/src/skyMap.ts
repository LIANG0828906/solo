const ZODIAC_NAMES = [
  '子·玄枵', '丑·星纪', '寅·析木', '卯·大火',
  '辰·寿星', '巳·鹑尾', '午·鹑火', '未·鹑首',
  '申·实沈', '酉·大梁', '戌·降娄', '亥·娵訾'
]

const PLANET_NAMES = ['日', '月', '火', '金', '木', '土', '水']
const PLANET_COLORS = ['#FFD700', '#E8E8D0', '#FF4500', '#FFDAB9', '#DAA520', '#CD853F', '#87CEEB']

interface Star {
  x: number
  y: number
  r: number
  brightness: number
}

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let bgCanvas: HTMLCanvasElement
let bgCtx: CanvasRenderingContext2D
let stars: Star[] = []
let currentLongitudes: number[] = [90, 180, 45, 270, 120, 300, 60]
let animFrameId: number = 0
let glowPhase: number = 0
let displayWidth: number = 0
let displayHeight: number = 600

function generateStars(width: number, height: number): Star[] {
  const result: Star[] = []
  const count = Math.floor((width * height) / 800)
  for (let i = 0; i < count; i++) {
    result.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.3,
      brightness: Math.random() * 0.6 + 0.4
    })
  }
  return result
}

function drawBackground(c: HTMLCanvasElement, context: CanvasRenderingContext2D, dw: number, dh: number): void {
  const cx = dw / 2
  const cy = dh / 2
  const radius = Math.min(cx, cy) - 40

  context.fillStyle = '#0B0C10'
  context.fillRect(0, 0, dw, dh)

  for (const star of stars) {
    context.beginPath()
    context.arc(star.x, star.y, star.r, 0, Math.PI * 2)
    context.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.8})`
    context.fill()
  }

  const innerR = radius * 0.75
  const outerR = radius * 0.95

  context.beginPath()
  context.arc(cx, cy, outerR, 0, Math.PI * 2)
  context.arc(cx, cy, innerR, 0, Math.PI * 2, true)
  context.fillStyle = 'rgba(30, 40, 80, 0.25)'
  context.fill()
  context.strokeStyle = 'rgba(100, 120, 180, 0.3)'
  context.lineWidth = 1
  context.stroke()

  context.beginPath()
  context.arc(cx, cy, radius, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(196, 168, 130, 0.4)'
  context.lineWidth = 2
  context.stroke()

  context.beginPath()
  context.arc(cx, cy, innerR - 10, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(196, 168, 130, 0.2)'
  context.lineWidth = 1
  context.stroke()

  for (let i = 0; i < 12; i++) {
    const angle1 = (i * 30 - 90) * Math.PI / 180
    const angle2 = ((i + 1) * 30 - 90) * Math.PI / 180
    const midAngle = ((i * 30 + 15) - 90) * Math.PI / 180

    context.beginPath()
    context.arc(cx, cy, outerR, angle1, angle2)
    context.strokeStyle = 'rgba(196, 168, 130, 0.5)'
    context.lineWidth = 1.5
    context.stroke()

    context.beginPath()
    context.arc(cx, cy, innerR, angle1, angle2)
    context.strokeStyle = 'rgba(196, 168, 130, 0.3)'
    context.lineWidth = 1
    context.stroke()

    const x1 = cx + Math.cos(angle1) * innerR
    const y1 = cy + Math.sin(angle1) * innerR
    const x2 = cx + Math.cos(angle1) * outerR
    const y2 = cy + Math.sin(angle1) * outerR
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.strokeStyle = 'rgba(196, 168, 130, 0.4)'
    context.lineWidth = 1
    context.stroke()

    const labelR = outerR + 18
    const lx = cx + Math.cos(midAngle) * labelR
    const ly = cy + Math.sin(midAngle) * labelR
    context.font = '12px KaiTi, 楷体, STKaiti, serif'
    context.fillStyle = 'rgba(196, 168, 130, 0.7)'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(ZODIAC_NAMES[i], lx, ly)
  }
}

function drawPlanets(longitudes: number[], phase: number): void {
  const cx = displayWidth / 2
  const cy = displayHeight / 2
  const radius = Math.min(cx, cy) - 40
  const orbitR = radius * 0.85

  for (let i = 0; i < longitudes.length; i++) {
    const lon = longitudes[i]
    const angle = (lon - 90) * Math.PI / 180
    const px = cx + Math.cos(angle) * orbitR
    const py = cy + Math.sin(angle) * orbitR

    const glowIntensity = 0.6 + 0.4 * Math.sin(phase + i * 0.8)

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    const outerGlow = ctx.createRadialGradient(px, py, 0, px, py, 20)
    outerGlow.addColorStop(0, `rgba(255, 215, 0, ${0.3 * glowIntensity})`)
    outerGlow.addColorStop(0.5, `rgba(255, 215, 0, ${0.1 * glowIntensity})`)
    outerGlow.addColorStop(1, 'rgba(255, 215, 0, 0)')
    ctx.beginPath()
    ctx.arc(px, py, 20, 0, Math.PI * 2)
    ctx.fillStyle = outerGlow
    ctx.fill()

    const midGlow = ctx.createRadialGradient(px, py, 0, px, py, 10)
    midGlow.addColorStop(0, `rgba(255, 215, 0, ${0.5 * glowIntensity})`)
    midGlow.addColorStop(1, 'rgba(255, 215, 0, 0)')
    ctx.beginPath()
    ctx.arc(px, py, 10, 0, Math.PI * 2)
    ctx.fillStyle = midGlow
    ctx.fill()

    ctx.globalCompositeOperation = 'source-over'

    const planetColor = PLANET_COLORS[i] || '#FFD700'
    const core = ctx.createRadialGradient(px, py, 0, px, py, 5)
    core.addColorStop(0, planetColor)
    core.addColorStop(0.6, planetColor)
    core.addColorStop(1, 'rgba(255, 215, 0, 0.3)')
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fillStyle = core
    ctx.fill()

    ctx.font = '11px KaiTi, 楷体, STKaiti, serif'
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(PLANET_NAMES[i], px, py - 8)

    ctx.restore()
  }
}

function render(): void {
  if (!ctx) return
  glowPhase += 0.05

  const dpr = window.devicePixelRatio || 1
  ctx.save()
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, displayWidth, displayHeight)
  ctx.drawImage(bgCanvas, 0, 0, displayWidth, displayHeight)
  drawPlanets(currentLongitudes, glowPhase)
  ctx.restore()

  animFrameId = requestAnimationFrame(render)
}

export function initSkyMap(c: HTMLCanvasElement): void {
  canvas = c
  const rect = c.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  displayWidth = rect.width
  displayHeight = 600

  c.width = displayWidth * dpr
  c.height = displayHeight * dpr
  c.style.width = displayWidth + 'px'
  c.style.height = displayHeight + 'px'

  ctx = c.getContext('2d')!

  stars = generateStars(displayWidth, displayHeight)

  bgCanvas = document.createElement('canvas')
  bgCanvas.width = displayWidth * dpr
  bgCanvas.height = displayHeight * dpr
  bgCtx = bgCanvas.getContext('2d')!
  bgCtx.scale(dpr, dpr)

  drawBackground(bgCanvas, bgCtx, displayWidth, displayHeight)
  render()
}

export function updatePlanets(longitudes: number[]): void {
  currentLongitudes = longitudes
}

export function resizeSkyMap(): void {
  if (!canvas) return
  cancelAnimationFrame(animFrameId)

  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  displayWidth = rect.width
  displayHeight = 600

  canvas.width = displayWidth * dpr
  canvas.height = displayHeight * dpr
  canvas.style.width = displayWidth + 'px'
  canvas.style.height = displayHeight + 'px'

  ctx = canvas.getContext('2d')!

  stars = generateStars(displayWidth, displayHeight)

  bgCanvas.width = displayWidth * dpr
  bgCanvas.height = displayHeight * dpr
  bgCtx = bgCanvas.getContext('2d')!
  bgCtx.scale(dpr, dpr)

  drawBackground(bgCanvas, bgCtx, displayWidth, displayHeight)
  render()
}
