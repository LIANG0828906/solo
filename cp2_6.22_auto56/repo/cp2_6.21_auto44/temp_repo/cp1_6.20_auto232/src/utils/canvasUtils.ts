export interface InkParticle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  life: number
  maxLife: number
}

export function createInkParticles(
  canvas: HTMLCanvasElement,
  count: number = 30
): InkParticle[] {
  const particles: InkParticle[] = []
  const w = canvas.width
  const h = canvas.height
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.3 + 0.1),
      r: Math.random() * 2.5 + 0.5,
      alpha: 0.1 + Math.random() * 0.1,
      life: 0,
      maxLife: 200 + Math.random() * 300
    })
  }
  return particles
}

export function drawInkParticles(
  ctx: CanvasRenderingContext2D,
  particles: InkParticle[]
): InkParticle[] {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  
  particles.forEach(p => {
    p.life++
    p.x += p.vx
    p.y += p.vy
    
    const lifeRatio = p.life / p.maxLife
    const currentAlpha = p.alpha * Math.sin(lifeRatio * Math.PI)
    
    ctx.beginPath()
    ctx.fillStyle = `rgba(93, 64, 55, ${currentAlpha})`
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  })
  
  ctx.restore()
  
  return particles.map(p => {
    if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > w + 10) {
      return {
        x: Math.random() * w,
        y: h + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.3 + 0.1),
        r: Math.random() * 2.5 + 0.5,
        alpha: 0.1 + Math.random() * 0.1,
        life: 0,
        maxLife: 200 + Math.random() * 300
      }
    }
    return p
  })
}

export interface WordCloudItem {
  text: string
  count: number
  color: string
}

export function drawRhymeWordCloud(
  canvas: HTMLCanvasElement,
  items: WordCloudItem[],
  centerX: number,
  centerY: number
) {
  const ctx = canvas.getContext('2d')
  if (!ctx || items.length === 0) return
  
  const maxCount = Math.max(...items.map(i => i.count))
  
  const positions = generateSpiralPositions(items.length, centerX, centerY)
  
  items.forEach((item, i) => {
    const pos = positions[i]
    if (!pos) return
    
    const sizeRatio = 0.5 + (item.count / maxCount) * 0.5
    const fontSize = 14 + Math.round(sizeRatio * 18)
    
    ctx.save()
    ctx.font = `600 ${fontSize}px 'Noto Serif SC', 'Songti SC', serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = item.color
    ctx.shadowBlur = 8
    ctx.fillStyle = item.color
    ctx.globalAlpha = 0.9
    ctx.fillText(item.text, pos.x, pos.y)
    ctx.restore()
  })
}

function generateSpiralPositions(
  count: number,
  cx: number,
  cy: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const angleStep = (Math.PI * 2) / 6
  let angle = 0
  let radius = 0
  
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      positions.push({ x: cx, y: cy })
      radius = 45
      continue
    }
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    positions.push({ x, y })
    
    angle += angleStep
    if (angle >= Math.PI * 2) {
      angle = 0
      radius += 40
    }
  }
  
  return positions
}

export function drawDecorativeInk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save()
  ctx.translate(x, y)
  
  ctx.fillStyle = 'rgba(93, 64, 55, 0.08)'
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const r = size * (0.8 + Math.sin(angle * 3) * 0.2)
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.quadraticCurveTo(
      Math.cos(angle - 0.2) * r * 1.1,
      Math.sin(angle - 0.2) * r * 1.1,
      px, py
    )
  }
  ctx.closePath()
  ctx.fill()
  
  ctx.restore()
}

export function resizeCanvas(canvas: HTMLCanvasElement): { width: number; height: number } {
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }
  
  return { width: rect.width, height: rect.height }
}
