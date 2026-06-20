import { useAppStore, type PlantId } from './store'
import { PLANTS, type PlantSpecies } from './PlantData'
import { useEffect, useRef } from 'react'

interface PlantCardProps {
  species: PlantSpecies
  isSelected: boolean
  onClick: () => void
}

const PlantThumbnail = ({ species }: { species: PlantSpecies }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const grad = ctx.createRadialGradient(w / 2, h * 0.7, 0, w / 2, h * 0.7, w * 0.65)
    grad.addColorStop(0, `${species.thumbnailColor}55`)
    grad.addColorStop(1, `${species.thumbnailColor}00`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    const drawStem = () => {
      const stemGrad = ctx.createLinearGradient(0, h * 0.85, 0, h * 0.3)
      stemGrad.addColorStop(0, '#2d5a1e')
      stemGrad.addColorStop(1, '#5a9b3a')
      ctx.strokeStyle = stemGrad
      ctx.lineWidth = species.id === 'cactus' ? w * 0.12 : w * 0.05
      ctx.lineCap = 'round'
      ctx.beginPath()
      if (species.id === 'cactus') {
        const sx = w / 2, sy = h * 0.85, ey = h * 0.3
        ctx.moveTo(sx, sy)
        ctx.bezierCurveTo(sx - w * 0.08, sy - (sy - ey) * 0.5, sx + w * 0.05, sy - (sy - ey) * 0.7, sx, ey)
      } else if (species.id === 'succulent') {
        ctx.moveTo(w / 2, h * 0.85)
        ctx.lineTo(w / 2, h * 0.6)
      } else {
        const sx = w / 2, sy = h * 0.85, ey = h * 0.25
        ctx.moveTo(sx, sy)
        ctx.quadraticCurveTo(sx + w * 0.04, (sy + ey) / 2, sx - w * 0.02, ey)
      }
      ctx.stroke()

      if (species.id === 'cactus') {
        ctx.lineWidth = w * 0.07
        ctx.strokeStyle = '#4a8b3a'
        const bx = w / 2
        const by1 = h * 0.65, by2 = h * 0.5
        const armY = h * 0.55
        ctx.beginPath()
        ctx.moveTo(bx - w * 0.08, by1)
        ctx.bezierCurveTo(bx - w * 0.22, by1 - 10, bx - w * 0.25, armY - 20, bx - w * 0.18, armY - 35)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(bx + w * 0.08, by2)
        ctx.bezierCurveTo(bx + w * 0.2, by2 - 5, bx + w * 0.23, armY - 30, bx + w * 0.16, armY - 45)
        ctx.stroke()
      }
    }

    const drawLeaf = (cx: number, cy: number, lw: number, ll: number, rot: number, color: string) => {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rot)
      const leafGrad = ctx.createRadialGradient(0, -ll * 0.3, 0, 0, 0, ll)
      leafGrad.addColorStop(0, color)
      leafGrad.addColorStop(1, '#2d5a1e')
      ctx.fillStyle = leafGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, lw, ll, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(0, -ll * 0.95)
      ctx.quadraticCurveTo(lw * 0.2, 0, 0, ll * 0.85)
      ctx.stroke()
      ctx.restore()
    }

    drawStem()

    if (species.id === 'sunflower') {
      for (let i = 0; i < 4; i++) {
        const t = i / 3
        const cy = h * 0.8 - t * h * 0.45
        const side = i % 2 === 0 ? -1 : 1
        drawLeaf(w / 2 + side * w * 0.05, cy, w * 0.1, w * 0.2, side * (0.4 - t * 0.3), '#4a8b3a')
      }
      const fx = w / 2, fy = h * 0.22
      const fR = w * 0.18
      for (let p = 0; p < 14; p++) {
        const a = (p / 14) * Math.PI * 2
        const px = fx + Math.cos(a) * fR * 0.55
        const py = fy + Math.sin(a) * fR * 0.55
        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(a + Math.PI / 2)
        const pg = ctx.createLinearGradient(0, -w * 0.12, 0, w * 0.02)
        pg.addColorStop(0, '#FFEB3B')
        pg.addColorStop(1, '#FF9800')
        ctx.fillStyle = pg
        ctx.beginPath()
        ctx.ellipse(0, 0, w * 0.035, w * 0.12, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      const cg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fR * 0.45)
      cg.addColorStop(0, '#6B4226')
      cg.addColorStop(1, '#3E2723')
      ctx.fillStyle = cg
      ctx.beginPath()
      ctx.arc(fx, fy, fR * 0.42, 0, Math.PI * 2)
      ctx.fill()
    } else if (species.id === 'fern') {
      for (let i = 0; i < 6; i++) {
        const t = i / 5
        const cy = h * 0.75 - t * h * 0.5
        const side = i % 2 === 0 ? -1 : 1
        const rot = side * (0.9 - t * 0.5)
        ctx.save()
        ctx.translate(w / 2, cy)
        ctx.rotate(rot)
        for (let l = 0; l < 7; l++) {
          const lt = l / 6
          const lx = -w * 0.02 - lt * w * 0.28
          const ly = (l % 2 === 0 ? -1 : 1) * w * 0.05 * (1 - lt * 0.5)
          const lg = ctx.createLinearGradient(lx, ly, lx + w * 0.08, ly)
          lg.addColorStop(0, '#3d7a2b')
          lg.addColorStop(1, '#6bcb57')
          ctx.fillStyle = lg
          ctx.beginPath()
          ctx.ellipse(lx, ly, w * 0.06, w * 0.02, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
    } else if (species.id === 'maple') {
      for (let i = 0; i < 5; i++) {
        const t = i / 4
        const cy = h * 0.8 - t * h * 0.5
        const side = i % 2 === 0 ? -1 : 1
        const cx = w / 2 + side * w * (0.06 + (1 - t) * 0.04)
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(side * 0.3)
        const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.22)
        lg.addColorStop(0, '#E57373')
        lg.addColorStop(0.6, '#C62828')
        lg.addColorStop(1, '#7a1414')
        ctx.fillStyle = lg
        for (let p = 0; p < 5; p++) {
          const pa = (p / 5) * Math.PI * 2 - Math.PI / 2
          const pl = w * (0.1 + (p === 0 || p === 4 ? 0.04 : 0.08))
          const pw = w * 0.08
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.quadraticCurveTo(
            Math.cos(pa - 0.3) * pl * 0.6 - Math.sin(pa - 0.3) * pw,
            Math.sin(pa - 0.3) * pl * 0.6 + Math.cos(pa - 0.3) * pw,
            Math.cos(pa) * pl,
            Math.sin(pa) * pl
          )
          ctx.quadraticCurveTo(
            Math.cos(pa + 0.3) * pl * 0.6 - Math.sin(pa + 0.3) * pw,
            Math.sin(pa + 0.3) * pl * 0.6 + Math.cos(pa + 0.3) * pw,
            0, 0
          )
          ctx.fill()
        }
        ctx.fillStyle = 'rgba(255,200,200,0.3)'
        ctx.beginPath()
        ctx.arc(0, 0, w * 0.03, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    } else if (species.id === 'succulent') {
      const cx = w / 2, cy = h * 0.58
      const layers = 3
      for (let lay = layers - 1; lay >= 0; lay--) {
        const lt = lay / (layers - 1)
        const lc = 10 - lay * 2
        const lr = w * (0.08 + (1 - lt) * 0.12)
        for (let l = 0; l < lc; l++) {
          const la = (l / lc) * Math.PI * 2 + lay * 0.3
          const lx = cx + Math.cos(la) * lr * 0.4
          const ly = cy + Math.sin(la) * lr * 0.25 - (1 - lt) * h * 0.04
          ctx.save()
          ctx.translate(lx, ly)
          ctx.rotate(la + Math.PI / 2)
          const lg = ctx.createLinearGradient(0, -w * 0.12, 0, w * 0.05)
          const base = species.leaves.baseColor
          const edge = species.leaves.edgeColor
          lg.addColorStop(0, `rgb(${Math.round(edge[0]*255)},${Math.round(edge[1]*255)},${Math.round(edge[2]*255)})`)
          lg.addColorStop(1, `rgb(${Math.round(base[0]*255)},${Math.round(base[1]*255)},${Math.round(base[2]*255)})`)
          ctx.fillStyle = lg
          ctx.beginPath()
          ctx.moveTo(0, w * 0.04)
          ctx.quadraticCurveTo(-w * 0.07, 0, -w * 0.04, -w * 0.11)
          ctx.quadraticCurveTo(0, -w * 0.14, w * 0.04, -w * 0.11)
          ctx.quadraticCurveTo(w * 0.07, 0, 0, w * 0.04)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255,255,255,0.25)'
          ctx.lineWidth = 0.8
          ctx.stroke()
          ctx.restore()
        }
      }
    } else if (species.id === 'cactus') {
      const cx = w / 2
      const spots: Array<[number, number, number]> = [
        [cx, h * 0.78, w * 0.11],
        [cx, h * 0.62, w * 0.11],
        [cx, h * 0.46, w * 0.1],
        [cx, h * 0.34, w * 0.08],
        [cx - w * 0.18, h * 0.62, w * 0.07],
        [cx - w * 0.22, h * 0.5, w * 0.065],
        [cx + w * 0.18, h * 0.56, w * 0.07],
        [cx + w * 0.22, h * 0.44, w * 0.06],
      ]
      spots.forEach(([sx, sy, sr]) => {
        for (let s = 0; s < 8; s++) {
          const a = (s / 8) * Math.PI * 2
          const spx = sx + Math.cos(a) * sr
          const spy = sy + Math.sin(a) * sr * 0.4
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(spx, spy)
          ctx.lineTo(spx + Math.cos(a) * w * 0.03, spy + Math.sin(a) * w * 0.015)
          ctx.stroke()
        }
      })
      const fx = w / 2, fy = h * 0.24
      for (let p = 0; p < 8; p++) {
        const a = (p / 8) * Math.PI * 2
        ctx.save()
        ctx.translate(fx + Math.cos(a) * w * 0.04, fy + Math.sin(a) * w * 0.02)
        ctx.rotate(a + Math.PI / 2)
        const pg = ctx.createLinearGradient(0, -w * 0.07, 0, w * 0.01)
        pg.addColorStop(0, '#F8BBD9')
        pg.addColorStop(1, '#EC407A')
        ctx.fillStyle = pg
        ctx.beginPath()
        ctx.ellipse(0, 0, w * 0.025, w * 0.07, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      const cg = ctx.createRadialGradient(fx, fy, 0, fx, fy, w * 0.035)
      cg.addColorStop(0, '#FFEB3B')
      cg.addColorStop(1, '#FFC107')
      ctx.fillStyle = cg
      ctx.beginPath()
      ctx.arc(fx, fy, w * 0.032, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [species])

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      style={{
        borderRadius: 8,
        background: 'rgba(0,0,0,0.25)',
        display: 'block',
      }}
    />
  )
}

const PlantCard = ({ species, isSelected, onClick }: PlantCardProps) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,170,0,0.1) 100%)'
          : 'rgba(255,255,255,0.05)',
        border: isSelected
          ? '2px solid transparent'
          : '1px solid rgba(255,255,255,0.1)',
        borderImage: isSelected
          ? 'linear-gradient(135deg, #ffd700, #ffaa00) 1'
          : undefined,
        boxShadow: isSelected
          ? '0 4px 20px rgba(255,215,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
        }
      }}
    >
      <PlantThumbnail species={species} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: isSelected ? '#ffd93d' : '#e8f5e8',
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span>{species.thumbnailEmoji}</span>
          <span>{species.name}</span>
        </div>
        <div style={{
          color: 'rgba(200,240,200,0.6)',
          fontSize: 11,
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {species.description}
        </div>
      </div>
    </div>
  )
}

const PlantPanel = () => {
  const selectedPlant = useAppStore((s) => s.selectedPlant)
  const selectPlant = useAppStore((s) => s.selectPlant)

  return (
    <div style={{
      width: 280,
      height: '100%',
      flexShrink: 0,
      padding: '20px 14px',
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(255,255,255,0.12)',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      overflowY: 'auto',
    }}>
      <div>
        <h2 style={{
          color: '#d4f5d4',
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 4,
          letterSpacing: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>🌱</span>
          <span>植物图鉴</span>
        </h2>
        <p style={{
          color: 'rgba(212,245,212,0.55)',
          fontSize: 12,
          lineHeight: 1.5,
        }}>选择一种植物，探索其形态变化</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PLANTS.map((species) => (
          <PlantCard
            key={species.id}
            species={species}
            isSelected={selectedPlant === species.id}
            onClick={() => selectPlant(species.id as PlantId)}
          />
        ))}
      </div>

      <div style={{
        marginTop: 'auto',
        padding: 12,
        borderRadius: 10,
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          color: 'rgba(212,245,212,0.65)',
          fontSize: 11,
          lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 600, color: '#b8f5b8', marginBottom: 6, fontSize: 12 }}>
            💡 操作提示
          </div>
          • 拖拽：旋转视角<br />
          • 滚轮：缩放场景<br />
          • 双击植物：重置视角<br />
          • 调节滑块：观察植物实时响应
        </div>
      </div>
    </div>
  )
}

export default PlantPanel
