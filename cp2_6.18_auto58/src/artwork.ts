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

const TEX_SIZE = 512

export function generateArtworkCanvas(info: ArtworkInfo): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_SIZE
  canvas.height = TEX_SIZE
  const ctx = canvas.getContext('2d')!
  switch (info.style) {
    case 'geometry':
      drawGeometry(ctx)
      break
    case 'gradient':
      drawGradient(ctx)
      break
    case 'particles':
      drawParticles(ctx)
      break
    case 'spiral':
      drawSpiral(ctx)
      break
    case 'radiation':
      drawRadiation(ctx)
      break
    case 'ink':
      drawInk(ctx)
      break
  }
  return canvas
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function drawGeometry(ctx: CanvasRenderingContext2D) {
  const w = TEX_SIZE, h = TEX_SIZE
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#1a1a2e')
  bg.addColorStop(1, '#2d2d44')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da']
  for (let i = 0; i < 45; i++) {
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
    ctx.lineWidth = 1
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawGradient(ctx: CanvasRenderingContext2D) {
  const w = TEX_SIZE, h = TEX_SIZE
  const stripes = 10
  for (let i = 0; i < stripes; i++) {
    const y = (i / stripes) * h
    const grad = ctx.createLinearGradient(0, y, w, y + h / stripes)
    const hue1 = (i * 36 + Math.random() * 20) % 360
    const hue2 = (hue1 + 60) % 360
    grad.addColorStop(0, `hsla(${hue1}, 70%, 55%, 1)`)
    grad.addColorStop(0.5, `hsla(${hue2}, 70%, 60%, 1)`)
    grad.addColorStop(1, `hsla(${(hue1 + 180) % 360}, 70%, 50%, 1)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, y - 2, w, h / stripes + 4)
  }
  const over = ctx.createLinearGradient(0, 0, 0, h)
  over.addColorStop(0, 'rgba(0,0,0,0.3)')
  over.addColorStop(0.5, 'rgba(255,255,255,0.05)')
  over.addColorStop(1, 'rgba(0,0,0,0.3)')
  ctx.fillStyle = over
  ctx.fillRect(0, 0, w, h)
}

function drawParticles(ctx: CanvasRenderingContext2D) {
  const w = TEX_SIZE, h = TEX_SIZE
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 1.4)
  bg.addColorStop(0, '#0f0f2e')
  bg.addColorStop(1, '#000000')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 600; i++) {
    const x = rand(0, w), y = rand(0, h)
    const r = rand(0.5, 2.5)
    const hue = rand(200, 280)
    const alpha = rand(0.4, 1)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 80%, 80%, ${alpha})`
    ctx.fill()
  }
  for (let i = 0; i < 12; i++) {
    const x = rand(0, w), y = rand(0, h)
    const r = rand(15, 40)
    const hue = rand(180, 300)
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `hsla(${hue}, 90%, 80%, 0.6)`)
    grad.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
}

function drawSpiral(ctx: CanvasRenderingContext2D) {
  const w = TEX_SIZE, h = TEX_SIZE
  const cx = w / 2, cy = h / 2
  ctx.fillStyle = '#1a0a2e'
  ctx.fillRect(0, 0, w, h)
  const arms = 4
  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (arm / arms) * Math.PI * 2
    for (let t = 0; t < 600; t++) {
      const angle = t * 0.08 + armOffset
      const r = t * 0.55
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (x < 0 || x > w || y < 0 || y > h) continue
      const hue = (t * 0.5 + arm * 90) % 360
      const alpha = Math.min(1, t / 200) * 0.9
      ctx.beginPath()
      ctx.arc(x, y, 2 + (t / 600) * 3, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${alpha})`
      ctx.fill()
    }
  }
}

function drawRadiation(ctx: CanvasRenderingContext2D) {
  const w = TEX_SIZE, h = TEX_SIZE
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, w, h)
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
  const center = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60)
  center.addColorStop(0, 'rgba(255,255,255,0.9)')
  center.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = center
  ctx.fillRect(cx - 60, cy - 60, 120, 120)
}

function drawInk(ctx: CanvasRenderingContext2D) {
  const w = TEX_SIZE, h = TEX_SIZE
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, w, h)
  const blobs = 7
  for (let i = 0; i < blobs; i++) {
    const cx = rand(0, w), cy = rand(0, h)
    const r = rand(60, 180)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    const opacity = rand(0.6, 0.95)
    grad.addColorStop(0, `rgba(20,10,30,${opacity})`)
    grad.addColorStop(0.4, `rgba(20,10,30,${opacity * 0.5})`)
    grad.addColorStop(0.8, `rgba(40,30,60,${opacity * 0.15})`)
    grad.addColorStop(1, 'rgba(40,30,60,0)')
    ctx.fillStyle = grad
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
  for (let i = 0; i < 40; i++) {
    ctx.beginPath()
    const x = rand(0, w), y = rand(0, h)
    ctx.arc(x, y, rand(0.5, 3), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(20,10,30,${rand(0.3, 0.9)})`
    ctx.fill()
  }
}

export function createArtworkMesh(
  info: ArtworkInfo
): { group: THREE.Group; artworkDataUrl: string; pulsePeriod: number; pulsePhase: number } {
  const canvas = generateArtworkCanvas(info)
  const dataUrl = canvas.toDataURL('image/png')
  const texture = new THREE.CanvasTexture(canvas)
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
  })

  const paintingGeom = new THREE.PlaneGeometry(paintingW, paintingH)
  const painting = new THREE.Mesh(paintingGeom, textureMaterial)
  painting.position.z = depth / 2 + 0.001
  painting.userData = { isArtwork: true, info, dataUrl }

  const woodColor = 0x3e2723
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: woodColor,
    roughness: 0.7,
    metalness: 0.2,
  })

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
  group.userData = { painting, info, isArtwork: true, dataUrl }

  const pulsePeriod = rand(2, 4)
  const pulsePhase = rand(0, Math.PI * 2)

  return { group, artworkDataUrl: dataUrl, pulsePeriod, pulsePhase }
}
