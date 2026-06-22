import * as THREE from 'three'

export type ArtworkStyle =
  | 'geometry'
  | 'gradient'
  | 'particles'
  | 'spiral'
  | 'radiation'
  | 'ink'

export interface ArtworkInfo {
  title: string
  description: string
  style: ArtworkStyle
}

export const ARTWORKS: ArtworkInfo[] = [
  { title: '混沌几何', description: '随机三角形拼贴', style: 'geometry' },
  { title: '流光渐变', description: '水平渐变带动态偏移', style: 'gradient' },
  { title: '星尘粒子', description: '随机点阵模拟星空', style: 'particles' },
  { title: '螺旋梦境', description: '阿基米德螺旋颜色渐变', style: 'spiral' },
  { title: '色彩爆炸', description: '放射状彩色条纹', style: 'radiation' },
  { title: '水墨晕染', description: '黑色渐变随机扩散', style: 'ink' },
]

const LOW_TEX_SIZE = 512
const HIGH_TEX_SIZE = 2048
const PULSE_AMPLITUDE = 0.05
const PULSE_SAFETY = 0.99

export function generateArtworkCanvas(
  info: ArtworkInfo,
  size: number = LOW_TEX_SIZE
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  drawArtwork(ctx, info, size)
  return canvas
}

function drawArtwork(ctx: CanvasRenderingContext2D, info: ArtworkInfo, size: number) {
  switch (info.style) {
    case 'geometry':
      drawGeometry(ctx, size)
      break
    case 'gradient':
      drawGradient(ctx, size)
      break
    case 'particles':
      drawParticles(ctx, size)
      break
    case 'spiral':
      drawSpiral(ctx, size)
      break
    case 'radiation':
      drawRadiation(ctx, size)
      break
    case 'ink':
      drawInk(ctx, size)
      break
  }
}

export async function generateHighResDataUrlAsync(
  info: ArtworkInfo
): Promise<{ dataUrl: string; duration: number }> {
  const start = performance.now()
  const canvas = document.createElement('canvas')
  canvas.width = HIGH_TEX_SIZE
  canvas.height = HIGH_TEX_SIZE
  const ctx = canvas.getContext('2d')!

  await drawArtworkAsync(ctx, info, HIGH_TEX_SIZE)

  const dataUrl = canvas.toDataURL('image/png')
  const duration = performance.now() - start
  if (typeof console !== 'undefined' && console.log) {
    console.log(`[VortexGallery] High-res texture generated: ${info.title}, ${duration.toFixed(1)}ms`)
  }
  return { dataUrl, duration }
}

async function drawArtworkAsync(
  ctx: CanvasRenderingContext2D,
  info: ArtworkInfo,
  size: number
): Promise<void> {
  return new Promise((resolve) => {
    const chunks = 4
    let chunkIdx = 0
    const rowsPerChunk = Math.ceil(size / chunks)

    function processChunk() {
      const startRow = chunkIdx * rowsPerChunk
      const endRow = Math.min(size, startRow + rowsPerChunk)

      switch (info.style) {
        case 'geometry':
          if (chunkIdx === 0) drawGeometryBackground(ctx, size)
          drawGeometryChunk(ctx, size, startRow, endRow)
          if (chunkIdx === chunks - 1) drawGeometryOverlay(ctx, size)
          break
        case 'gradient':
          drawGradientChunk(ctx, size, startRow, endRow)
          if (chunkIdx === chunks - 1) drawGradientOverlay(ctx, size)
          break
        case 'particles':
          if (chunkIdx === 0) drawParticlesBackground(ctx, size)
          drawParticlesChunk(ctx, size, startRow, endRow, chunkIdx, chunks)
          break
        case 'spiral':
          if (chunkIdx === 0) drawSpiralBackground(ctx, size)
          drawSpiralChunk(ctx, size, startRow, endRow)
          break
        case 'radiation':
          if (chunkIdx === 0) drawRadiationBackground(ctx, size)
          drawRadiationChunk(ctx, size, startRow, endRow)
          if (chunkIdx === chunks - 1) drawRadiationCenter(ctx, size)
          break
        case 'ink':
          if (chunkIdx === 0) drawInkBackground(ctx, size)
          drawInkChunk(ctx, size, startRow, endRow)
          break
      }

      chunkIdx++
      if (chunkIdx < chunks) {
        requestAnimationFrame(processChunk)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(processChunk)
  })
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function drawGeometry(ctx: CanvasRenderingContext2D, size: number) {
  drawGeometryBackground(ctx, size)
  const w = size, h = size
  const count = Math.round(45 * (size / LOW_TEX_SIZE))
  const lineW = Math.max(1, size / LOW_TEX_SIZE)
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da']
  for (let i = 0; i < count; i++) {
    ctx.beginPath()
    const x1 = rand(0, w), y1 = rand(0, h)
    const x2 = rand(0, w), y2 = rand(0, h)
    const x3 = rand(0, w), y3 = rand(0, h)
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x3, y3)
    ctx.closePath()
    const c = colors[Math.floor(Math.random() * colors.length)]
    ctx.fillStyle = c
    ctx.globalAlpha = rand(0.5, 0.85)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = lineW
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawGeometryBackground(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#1a1a2e')
  bg.addColorStop(1, '#2d2d44')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
}

function drawGeometryChunk(ctx: CanvasRenderingContext2D, size: number, startRow: number, endRow: number) {
  const w = size, h = size
  const count = Math.round(12 * (size / LOW_TEX_SIZE))
  const lineW = Math.max(1, size / LOW_TEX_SIZE)
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da']
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, startRow, w, endRow - startRow)
  ctx.clip()
  for (let i = 0; i < count; i++) {
    ctx.beginPath()
    const x1 = rand(0, w), y1 = rand(0, h)
    const x2 = rand(0, w), y2 = rand(0, h)
    const x3 = rand(0, w), y3 = rand(0, h)
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x3, y3)
    ctx.closePath()
    const c = colors[Math.floor(Math.random() * colors.length)]
    ctx.fillStyle = c
    ctx.globalAlpha = rand(0.5, 0.85)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = lineW
    ctx.stroke()
  }
  ctx.restore()
  ctx.globalAlpha = 1
}

function drawGeometryOverlay(_ctx: CanvasRenderingContext2D, _size: number) {}

function drawGradient(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  const stripes = 10
  const pad = Math.round(2 * (size / LOW_TEX_SIZE))
  for (let i = 0; i < stripes; i++) {
    const y = (i / stripes) * h
    const grad = ctx.createLinearGradient(0, y, w, y + h / stripes)
    const hue1 = (i * 36 + Math.random() * 20) % 360
    const hue2 = (hue1 + 60) % 360
    grad.addColorStop(0, `hsla(${hue1}, 70%, 55%, 1)`)
    grad.addColorStop(0.5, `hsla(${hue2}, 70%, 60%, 1)`)
    grad.addColorStop(1, `hsla(${(hue1 + 180) % 360}, 70%, 50%, 1)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, y - pad, w, h / stripes + pad * 2)
  }
  const over = ctx.createLinearGradient(0, 0, 0, h)
  over.addColorStop(0, 'rgba(0,0,0,0.3)')
  over.addColorStop(0.5, 'rgba(255,255,255,0.05)')
  over.addColorStop(1, 'rgba(0,0,0,0.3)')
  ctx.fillStyle = over
  ctx.fillRect(0, 0, w, h)
}

function drawGradientChunk(ctx: CanvasRenderingContext2D, size: number, startRow: number, endRow: number) {
  const w = size
  const stripes = 10
  const pad = Math.round(2 * (size / LOW_TEX_SIZE))
  const stripeH = size / stripes
  const startStripe = Math.max(0, Math.floor((startRow - pad) / stripeH) - 1)
  const endStripe = Math.min(stripes, Math.ceil((endRow + pad) / stripeH) + 1)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, startRow, w, endRow - startRow)
  ctx.clip()
  for (let i = startStripe; i < endStripe; i++) {
    const y = (i / stripes) * size
    const grad = ctx.createLinearGradient(0, y, w, y + size / stripes)
    const hue1 = (i * 36 + (Math.sin(i * 1.3) * 10 + 10)) % 360
    const hue2 = (hue1 + 60) % 360
    grad.addColorStop(0, `hsla(${hue1}, 70%, 55%, 1)`)
    grad.addColorStop(0.5, `hsla(${hue2}, 70%, 60%, 1)`)
    grad.addColorStop(1, `hsla(${(hue1 + 180) % 360}, 70%, 50%, 1)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, y - pad, w, size / stripes + pad * 2)
  }
  ctx.restore()
}

function drawGradientOverlay(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  const over = ctx.createLinearGradient(0, 0, 0, h)
  over.addColorStop(0, 'rgba(0,0,0,0.3)')
  over.addColorStop(0.5, 'rgba(255,255,255,0.05)')
  over.addColorStop(1, 'rgba(0,0,0,0.3)')
  ctx.fillStyle = over
  ctx.fillRect(0, 0, w, h)
}

function drawParticles(ctx: CanvasRenderingContext2D, size: number) {
  drawParticlesBackground(ctx, size)
  const w = size, h = size
  const count = Math.round(600 * (size / LOW_TEX_SIZE) ** 2)
  const glowCount = Math.round(12 * (size / LOW_TEX_SIZE) ** 2)
  for (let i = 0; i < count; i++) {
    const x = rand(0, w), y = rand(0, h)
    const r = rand(0.5, 2.5) * (size / LOW_TEX_SIZE)
    const hue = rand(200, 280)
    const alpha = rand(0.4, 1)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 80%, 80%, ${alpha})`
    ctx.fill()
  }
  for (let i = 0; i < glowCount; i++) {
    const x = rand(0, w), y = rand(0, h)
    const r = rand(15, 40) * (size / LOW_TEX_SIZE)
    const hue = rand(180, 300)
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `hsla(${hue}, 90%, 80%, 0.6)`)
    grad.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
}

function drawParticlesBackground(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 1.4)
  bg.addColorStop(0, '#0f0f2e')
  bg.addColorStop(1, '#000000')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
}

function drawParticlesChunk(
  ctx: CanvasRenderingContext2D,
  size: number,
  startRow: number,
  endRow: number,
  chunkIdx: number,
  totalChunks: number
) {
  const w = size
  const totalCount = Math.round(600 * (size / LOW_TEX_SIZE) ** 2)
  const chunkCount = Math.ceil(totalCount / totalChunks)
  const totalGlow = Math.round(12 * (size / LOW_TEX_SIZE) ** 2)
  const glowPerChunk = Math.ceil(totalGlow / totalChunks)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, startRow, w, endRow - startRow)
  ctx.clip()

  for (let i = 0; i < chunkCount; i++) {
    const x = rand(0, w)
    const y = rand(0, size)
    const r = rand(0.5, 2.5) * (size / LOW_TEX_SIZE)
    const hue = rand(200, 280)
    const alpha = rand(0.4, 1)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 80%, 80%, ${alpha})`
    ctx.fill()
  }

  for (let i = 0; i < glowPerChunk; i++) {
    const x = rand(0, w)
    const y = rand(0, size)
    const r = rand(15, 40) * (size / LOW_TEX_SIZE)
    const hue = rand(180, 300)
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `hsla(${hue}, 90%, 80%, 0.6)`)
    grad.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  ctx.restore()
}

function drawSpiral(ctx: CanvasRenderingContext2D, size: number) {
  drawSpiralBackground(ctx, size)
  const w = size, h = size
  const cx = w / 2, cy = h / 2
  const arms = 4
  const steps = Math.round(600 * (size / LOW_TEX_SIZE))
  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (arm / arms) * Math.PI * 2
    for (let t = 0; t < steps; t++) {
      const angle = t * 0.08 + armOffset
      const r = t * 0.55 * (size / LOW_TEX_SIZE)
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (x < 0 || x > w || y < 0 || y > h) continue
      const hue = (t * 0.5 + arm * 90) % 360
      const alpha = Math.min(1, t / 200) * 0.9
      ctx.beginPath()
      ctx.arc(x, y, (2 + (t / 600) * 3) * (size / LOW_TEX_SIZE), 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${alpha})`
      ctx.fill()
    }
  }
}

function drawSpiralBackground(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  ctx.fillStyle = '#1a0a2e'
  ctx.fillRect(0, 0, w, h)
}

function drawSpiralChunk(ctx: CanvasRenderingContext2D, size: number, startRow: number, endRow: number) {
  const w = size
  const cx = w / 2, cy = size / 2
  const arms = 4
  const steps = Math.round(600 * (size / LOW_TEX_SIZE))

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, startRow, w, endRow - startRow)
  ctx.clip()

  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (arm / arms) * Math.PI * 2
    for (let t = 0; t < steps; t++) {
      const angle = t * 0.08 + armOffset
      const r = t * 0.55 * (size / LOW_TEX_SIZE)
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (y < startRow - 10 || y > endRow + 10) continue
      if (x < 0 || x > w || y < 0 || y > size) continue
      const hue = (t * 0.5 + arm * 90) % 360
      const alpha = Math.min(1, t / 200) * 0.9
      ctx.beginPath()
      ctx.arc(x, y, (2 + (t / 600) * 3) * (size / LOW_TEX_SIZE), 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${alpha})`
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawRadiation(ctx: CanvasRenderingContext2D, size: number) {
  drawRadiationBackground(ctx, size)
  const w = size, h = size
  const cx = w / 2, cy = h / 2
  const rays = 36
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2
    const hue = (i * 10 + 180) % 360
    const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * w, cy + Math.sin(angle) * w)
    grad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.9)`)
    grad.addColorStop(0.3, `hsla(${(hue + 40) % 360}, 100%, 60%, 0.7)`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    const width = (Math.PI * 2 / rays) * 0.9
    ctx.lineTo(cx + Math.cos(angle - width / 2) * w, cy + Math.sin(angle - width / 2) * w)
    ctx.lineTo(cx + Math.cos(angle + width / 2) * w, cy + Math.sin(angle + width / 2) * w)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
  }
  const glowR = 60 * (size / LOW_TEX_SIZE)
  const center = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
  center.addColorStop(0, 'rgba(255,255,255,0.9)')
  center.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = center
  ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2)
}

function drawRadiationBackground(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, w, h)
}

function drawRadiationChunk(ctx: CanvasRenderingContext2D, size: number, startRow: number, endRow: number) {
  const w = size
  const cx = w / 2, cy = size / 2
  const rays = 36

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, startRow, w, endRow - startRow)
  ctx.clip()

  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2
    const hue = (i * 10 + 180) % 360
    const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * w, cy + Math.sin(angle) * size)
    grad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.9)`)
    grad.addColorStop(0.3, `hsla(${(hue + 40) % 360}, 100%, 60%, 0.7)`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    const width = (Math.PI * 2 / rays) * 0.9
    ctx.lineTo(cx + Math.cos(angle - width / 2) * w, cy + Math.sin(angle - width / 2) * size)
    ctx.lineTo(cx + Math.cos(angle + width / 2) * w, cy + Math.sin(angle + width / 2) * size)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
  }
  ctx.restore()
}

function drawRadiationCenter(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2, cy = size / 2
  const glowR = 60 * (size / LOW_TEX_SIZE)
  const center = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
  center.addColorStop(0, 'rgba(255,255,255,0.9)')
  center.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = center
  ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2)
}

function drawInk(ctx: CanvasRenderingContext2D, size: number) {
  drawInkBackground(ctx, size)
  const w = size, h = size
  const blobs = 7
  const dots = Math.round(40 * (size / LOW_TEX_SIZE) ** 2)
  for (let i = 0; i < blobs; i++) {
    const cx = rand(0, w), cy = rand(0, h)
    const r = rand(60, 180) * (size / LOW_TEX_SIZE)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    const opacity = rand(0.6, 0.95)
    grad.addColorStop(0, `rgba(20,10,30,${opacity})`)
    grad.addColorStop(0.4, `rgba(20,10,30,${opacity * 0.5})`)
    grad.addColorStop(0.8, `rgba(40,30,60,${opacity * 0.15})`)
    grad.addColorStop(1, 'rgba(40,30,60,0)')
    ctx.fillStyle = grad
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
  for (let i = 0; i < dots; i++) {
    ctx.beginPath()
    const x = rand(0, w), y = rand(0, h)
    ctx.arc(x, y, rand(0.5, 3) * (size / LOW_TEX_SIZE), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(20,10,30,${rand(0.3, 0.9)})`
    ctx.fill()
  }
}

function drawInkBackground(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, w, h)
}

function drawInkChunk(ctx: CanvasRenderingContext2D, size: number, startRow: number, endRow: number) {
  const w = size
  const blobsPerChunk = 2
  const dotsPerChunk = Math.round(10 * (size / LOW_TEX_SIZE) ** 2)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, startRow, w, endRow - startRow)
  ctx.clip()

  for (let i = 0; i < blobsPerChunk; i++) {
    const cx = rand(0, w), cy = rand(0, size)
    const r = rand(60, 180) * (size / LOW_TEX_SIZE)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    const opacity = rand(0.6, 0.95)
    grad.addColorStop(0, `rgba(20,10,30,${opacity})`)
    grad.addColorStop(0.4, `rgba(20,10,30,${opacity * 0.5})`)
    grad.addColorStop(0.8, `rgba(40,30,60,${opacity * 0.15})`)
    grad.addColorStop(1, 'rgba(40,30,60,0)')
    ctx.fillStyle = grad
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }

  for (let i = 0; i < dotsPerChunk; i++) {
    ctx.beginPath()
    const x = rand(0, w), y = rand(0, size)
    ctx.arc(x, y, rand(0.5, 3) * (size / LOW_TEX_SIZE), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(20,10,30,${rand(0.3, 0.9)})`
    ctx.fill()
  }

  ctx.restore()
}

function perlinNoise1D(x: number, y: number, seed: number = 0): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const n00 = perlinNoise1D(x0, y0, seed)
  const n10 = perlinNoise1D(x0 + 1, y0, seed)
  const n01 = perlinNoise1D(x0, y0 + 1, seed)
  const n11 = perlinNoise1D(x0 + 1, y0 + 1, seed)
  const nx0 = n00 * (1 - sx) + n10 * sx
  const nx1 = n01 * (1 - sx) + n11 * sx
  return nx0 * (1 - sy) + nx1 * sy
}

function fbm(x: number, y: number, octaves: number, seed: number): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  let maxValue = 0
  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * frequency, y * frequency, seed + i * 17.3) * amplitude
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }
  return value / maxValue
}

function makeWoodTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = size
  bumpCanvas.height = size
  const bumpCtx = bumpCanvas.getContext('2d')!

  const seed = Math.random() * 1000

  const imgData = ctx.createImageData(size, size)
  const bumpData = bumpCtx.createImageData(size, size)
  const pixels = imgData.data
  const bumpPixels = bumpData.data

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4

      const nx = x / size
      const ny = y / size

      const ringNoise = fbm(ny * 8 + fbm(nx * 2, ny * 4, 3, seed) * 0.8, 0, 3, seed + 100)
      const rings = Math.sin((ny + ringNoise * 0.12) * 22 + fbm(nx * 1.5, ny * 6, 2, seed + 50) * 0.4)

      const fineGrain = fbm(nx * 80, ny * 120, 3, seed + 200) - 0.5
      const medGrain = fbm(nx * 20, ny * 30, 3, seed + 300) - 0.5

      const rayOffset = Math.sin(nx * 3 + ny * 0.7 + seed * 0.01) * 0.02
      const radialVar = Math.sin((ny + rayOffset) * 55) * 0.15

      const knotDistortion = fbm(nx * 2.5 + 0.5, ny * 2.5 + 0.3, 3, seed + 400) - 0.5
      const knotBump = Math.max(0, fbm(nx * 3.5, ny * 2.8, 2, seed + 500) - 0.55) * 2.2

      const v =
        rings * 0.38 +
        fineGrain * 0.12 +
        medGrain * 0.2 +
        radialVar * 0.08 +
        knotDistortion * 0.25 +
        knotBump * 0.3

      const baseR = 95
      const baseG = 58
      const baseB = 32

      const ringMod = rings * 0.5 + 0.5
      const r = Math.min(255, Math.max(0, baseR + v * 55 + ringMod * 10))
      const g = Math.min(255, Math.max(0, baseG + v * 32 + ringMod * 6))
      const b = Math.min(255, Math.max(0, baseB + v * 18 + ringMod * 3))

      pixels[idx] = r | 0
      pixels[idx + 1] = g | 0
      pixels[idx + 2] = b | 0
      pixels[idx + 3] = 255

      const bumpVal = 128 + (rings * 25 + fineGrain * 40 + knotBump * 80 + medGrain * 20) * 1.2
      bumpPixels[idx] = Math.min(255, Math.max(0, bumpVal | 0))
      bumpPixels[idx + 1] = Math.min(255, Math.max(0, bumpVal | 0))
      bumpPixels[idx + 2] = Math.min(255, Math.max(0, bumpVal | 0))
      bumpPixels[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  bumpCtx.putImageData(bumpData, 0, 0)

  const vesselCount = 28
  for (let i = 0; i < vesselCount; i++) {
    const startX = rand(0, size * 0.4)
    const startY = rand(0, size)
    const length = rand(size * 0.4, size * 1.1)
    const baseThickness = rand(0.3, 1.8)
    const steps = Math.floor(length / 4)

    ctx.strokeStyle = `rgba(35,20,10,${rand(0.12, 0.28)})`
    ctx.lineWidth = baseThickness
    ctx.lineCap = 'round'
    bumpCtx.strokeStyle = `rgba(0,0,0,${rand(0.15, 0.35)})`
    bumpCtx.lineWidth = baseThickness * 1.2

    ctx.beginPath()
    bumpCtx.beginPath()
    let px = startX
    let py = startY
    ctx.moveTo(px, py)
    bumpCtx.moveTo(px, py)

    for (let s = 1; s <= steps; s++) {
      const progress = s / steps
      const wander = Math.sin(progress * Math.PI * 3 + i) * size * 0.02
      px += length / steps * 0.95
      py += wander
      ctx.lineTo(px, py)
      bumpCtx.lineTo(px, py)
    }
    ctx.stroke()
    bumpCtx.stroke()
  }

  const speckleCount = 200
  for (let i = 0; i < speckleCount; i++) {
    const x = rand(0, size)
    const y = rand(0, size)
    const r = rand(0.3, 1.5)
    const alpha = rand(0.05, 0.2)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(25,12,6,${alpha})`
    ctx.fill()
  }

  const map = new THREE.CanvasTexture(canvas)
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.RepeatWrapping
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 4

  const bumpMap = new THREE.CanvasTexture(bumpCanvas)
  bumpMap.wrapS = THREE.RepeatWrapping
  bumpMap.wrapT = THREE.RepeatWrapping
  bumpMap.anisotropy = 4

  return { map, bumpMap }
}

let woodCache: { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } | null = null

function getWoodMaterial(): THREE.MeshStandardMaterial {
  if (!woodCache) {
    woodCache = makeWoodTexture()
  }
  const { map, bumpMap } = woodCache
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    bumpMap,
    bumpScale: 0.035,
    roughness: 0.78,
    metalness: 0.03,
    aoMap: map,
    aoMapIntensity: 0.25,
  })
}

let artworkVersion = 0

export function bumpArtworkVersion(): void {
  artworkVersion++
}

export function getArtworkVersion(): number {
  return artworkVersion
}

export function createArtworkMesh(
  info: ArtworkInfo
): {
  group: THREE.Group
  pulsePeriod: number
  pulsePhase: number
  version: number
} {
  const canvas = generateArtworkCanvas(info, LOW_TEX_SIZE)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true

  const frameThickness = 0.1
  const paintingW = 3
  const paintingH = 2
  const depth = 0.08

  const textureMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.0,
    emissive: 0xffffff,
    emissiveIntensity: 0.15,
    emissiveMap: texture,
  })

  const paintingGeom = new THREE.PlaneGeometry(paintingW, paintingH)
  const painting = new THREE.Mesh(paintingGeom, textureMaterial)
  painting.position.z = depth / 2 + 0.001
  painting.userData = { isArtwork: true, info }

  const frameMaterial = getWoodMaterial()

  const group = new THREE.Group()

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(paintingW + frameThickness * 2, paintingH + frameThickness * 2, depth),
    frameMaterial
  )
  group.add(back)

  const topBar = new THREE.Mesh(
    new THREE.BoxGeometry(paintingW + frameThickness * 2, frameThickness, frameThickness),
    frameMaterial
  )
  topBar.position.set(0, paintingH / 2 + frameThickness / 2, depth / 2 + frameThickness / 2)
  group.add(topBar)

  const bottomBar = topBar.clone()
  bottomBar.position.set(0, -paintingH / 2 - frameThickness / 2, depth / 2 + frameThickness / 2)
  group.add(bottomBar)

  const leftBar = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness, paintingH, frameThickness),
    frameMaterial
  )
  leftBar.position.set(-paintingW / 2 - frameThickness / 2, 0, depth / 2 + frameThickness / 2)
  group.add(leftBar)

  const rightBar = leftBar.clone()
  rightBar.position.set(paintingW / 2 + frameThickness / 2, 0, depth / 2 + frameThickness / 2)
  group.add(rightBar)

  group.add(painting)
  group.userData = { painting, info, isArtwork: true }

  const pulsePeriod = rand(2, 4)
  const pulsePhase = rand(0, Math.PI * 2)

  return { group, pulsePeriod, pulsePhase, version: artworkVersion }
}

export function applyPulse(
  group: THREE.Group,
  time: number,
  period: number,
  phase: number
): void {
  const t = (time / period + phase) * Math.PI * 2
  const sinVal = Math.sin(t)
  const rawPulse = sinVal * PULSE_AMPLITUDE * PULSE_SAFETY
  const clampedPulse = Math.max(
    -PULSE_AMPLITUDE * PULSE_SAFETY,
    Math.min(PULSE_AMPLITUDE * PULSE_SAFETY, rawPulse)
  )
  const scale = 1 + clampedPulse
  group.scale.setScalar(scale)
  if (group.userData.painting && group.userData.painting.material) {
    const mat = group.userData.painting.material as THREE.MeshStandardMaterial
    if (mat.emissiveIntensity !== undefined) {
      const emissiveOffset = Math.max(0, sinVal) * 0.12
      mat.emissiveIntensity = 0.15 + emissiveOffset
    }
  }
}
