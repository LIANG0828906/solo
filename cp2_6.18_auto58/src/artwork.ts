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

export function generateArtworkCanvas(
  info: ArtworkInfo,
  size: number = LOW_TEX_SIZE
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
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
  return canvas
}

export function generateHighResDataUrl(info: ArtworkInfo): string {
  const canvas = generateArtworkCanvas(info, HIGH_TEX_SIZE)
  return canvas.toDataURL('image/png')
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function drawGeometry(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  const count = Math.round(45 * (size / LOW_TEX_SIZE))
  const lineW = Math.max(1, size / LOW_TEX_SIZE)
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#1a1a2e')
  bg.addColorStop(1, '#2d2d44')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
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

function drawParticles(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  const count = Math.round(600 * (size / LOW_TEX_SIZE) ** 2)
  const glowCount = Math.round(12 * (size / LOW_TEX_SIZE) ** 2)
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 1.4)
  bg.addColorStop(0, '#0f0f2e')
  bg.addColorStop(1, '#000000')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
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

function drawSpiral(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  const cx = w / 2, cy = h / 2
  const arms = 4
  const steps = Math.round(600 * (size / LOW_TEX_SIZE))
  ctx.fillStyle = '#1a0a2e'
  ctx.fillRect(0, 0, w, h)
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

function drawRadiation(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  const rays = 36
  const glowR = 60 * (size / LOW_TEX_SIZE)
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
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
  const center = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
  center.addColorStop(0, 'rgba(255,255,255,0.9)')
  center.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = center
  ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2)
}

function drawInk(ctx: CanvasRenderingContext2D, size: number) {
  const w = size, h = size
  const blobs = 7
  const dots = Math.round(40 * (size / LOW_TEX_SIZE) ** 2)
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, w, h)
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

  const baseR = 80, baseG = 48, baseB = 28

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const grainY = Math.sin(y * 0.08 + Math.sin(x * 0.02) * 4)
      const grainY2 = Math.sin(y * 0.25 + Math.sin(x * 0.015 + 3.2) * 2) * 0.5
      const knotNoise =
        Math.sin(x * 0.011 + y * 0.035) * Math.cos(y * 0.012 - x * 0.018)
      const noise = (Math.random() - 0.5) * 0.18
      const v = grainY * 0.45 + grainY2 * 0.3 + knotNoise * 0.25 + noise

      const r = Math.min(255, Math.max(0, baseR + v * 40))
      const g = Math.min(255, Math.max(0, baseG + v * 24))
      const b = Math.min(255, Math.max(0, baseB + v * 14))

      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`
      ctx.fillRect(x, y, 1, 1)

      const bumpVal = Math.min(255, Math.max(0, 128 + v * 110))
      bumpCtx.fillStyle = `rgb(${bumpVal | 0},${bumpVal | 0},${bumpVal | 0})`
      bumpCtx.fillRect(x, y, 1, 1)
    }
  }

  for (let i = 0; i < 18; i++) {
    const startX = rand(0, size * 0.3)
    const startY = rand(0, size)
    const len = rand(size * 0.3, size * 0.9)
    ctx.strokeStyle = `rgba(55,28,14,${rand(0.15, 0.35)})`
    bumpCtx.strokeStyle = `rgba(0,0,0,${rand(0.2, 0.45)})`
    ctx.lineWidth = rand(0.5, 2)
    bumpCtx.lineWidth = rand(0.5, 2)
    ctx.beginPath()
    bumpCtx.beginPath()
    ctx.moveTo(startX, startY)
    bumpCtx.moveTo(startX, startY)
    const steps = 30
    let px = startX, py = startY
    for (let s = 1; s <= steps; s++) {
      px += (len / steps) + rand(-4, 4)
      py += rand(-5, 5)
      ctx.lineTo(px, py)
      bumpCtx.lineTo(px, py)
    }
    ctx.stroke()
    bumpCtx.stroke()
  }

  const map = new THREE.CanvasTexture(canvas)
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.RepeatWrapping

  const bumpMap = new THREE.CanvasTexture(bumpCanvas)
  bumpMap.wrapS = THREE.RepeatWrapping
  bumpMap.wrapT = THREE.RepeatWrapping

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
    bumpScale: 0.04,
    roughness: 0.82,
    metalness: 0.02,
    aoMap: map,
    aoMapIntensity: 0.3,
  })
}

export function createArtworkMesh(
  info: ArtworkInfo
): { group: THREE.Group; pulsePeriod: number; pulsePhase: number } {
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

  return { group, pulsePeriod, pulsePhase }
}

export function applyPulse(
  group: THREE.Group,
  time: number,
  period: number,
  phase: number
): void {
  const t = (time / period + phase) * Math.PI * 2
  const sinVal = Math.sin(t)
  const clampedPulse = Math.max(-PULSE_AMPLITUDE, Math.min(PULSE_AMPLITUDE, sinVal * PULSE_AMPLITUDE))
  const scale = 1 + clampedPulse
  group.scale.setScalar(scale)
  if (group.userData.painting && group.userData.painting.material) {
    const mat = group.userData.painting.material as THREE.MeshStandardMaterial
    if (mat.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = 0.15 + Math.max(0, sinVal) * 0.12
    }
  }
}
