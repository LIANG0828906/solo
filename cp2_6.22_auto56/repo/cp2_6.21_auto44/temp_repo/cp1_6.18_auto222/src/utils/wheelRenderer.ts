import type { Spell, CooldownInfo, SpellElement } from '@/types'
import { hexToRgb, lerpColor } from '@/utils/particlePool'

const SECTOR_ANGLE = Math.PI / 4
const ICON_DISTANCE_RATIO = 0.55
const INNER_RADIUS_RATIO = 0.15
const SLOT_SNAP_THRESHOLD = 7 * Math.PI / 180

const ELEMENT_COLORS: Record<SpellElement, { bg1: string; bg2: string }> = {
  fire: { bg1: '#FF4500', bg2: '#FF6347' },
  ice: { bg1: '#00BFFF', bg2: '#87CEFA' },
  lightning: { bg1: '#FFD700', bg2: '#FFA500' },
  dark: { bg1: '#8B008B', bg2: '#9400D3' },
}

export function drawWheelBackground(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fill()
  ctx.restore()
}

export function drawSectors(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  rotation: number,
  spells: readonly Spell[],
  selectedSlot: number,
  highlightProgress: number,
) {
  const innerRadius = radius * INNER_RADIUS_RATIO
  for (let i = 0; i < 8; i++) {
    const startAngle = rotation + i * SECTOR_ANGLE
    const endAngle = startAngle + SECTOR_ANGLE
    const spell = spells[i]
    if (!spell) continue

    const colors = ELEMENT_COLORS[spell.element]
    const grad = ctx.createConicGradient(startAngle, cx, cy)
    const [r1, g1, b1] = hexToRgb(colors.bg1)
    const [r2, g2, b2] = hexToRgb(colors.bg2)

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(
      cx + innerRadius * Math.cos(startAngle),
      cy + innerRadius * Math.sin(startAngle),
    )
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true)
    ctx.closePath()

    const midAngle = startAngle + SECTOR_ANGLE / 2
    const grd = ctx.createLinearGradient(
      cx + radius * 0.3 * Math.cos(midAngle),
      cy + radius * 0.3 * Math.sin(midAngle),
      cx + radius * Math.cos(midAngle),
      cy + radius * Math.sin(midAngle),
    )
    grd.addColorStop(0, `rgba(${r1},${g1},${b1},0.25)`)
    grd.addColorStop(1, `rgba(${r2},${g2},${b2},0.45)`)
    ctx.fillStyle = grd
    ctx.fill()

    if (i === selectedSlot && highlightProgress > 0) {
      const hlGrad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, radius)
      const alpha = 0.3 * highlightProgress
      hlGrad.addColorStop(0, `rgba(${r1},${g1},${b1},${alpha})`)
      hlGrad.addColorStop(1, `rgba(${r2},${g2},${b2},${alpha * 1.5})`)
      ctx.fillStyle = hlGrad
      ctx.fill()
    }

    ctx.strokeStyle = 'rgba(255,215,0,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
  }
}

export function drawSpellIcons(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  rotation: number,
  spells: readonly Spell[],
  selectedSlot: number,
  iconScale: number,
) {
  const iconDist = radius * ICON_DISTANCE_RATIO
  const iconSize = 32 * iconScale

  for (let i = 0; i < 8; i++) {
    const spell = spells[i]
    if (!spell) continue

    const midAngle = rotation + i * SECTOR_ANGLE + SECTOR_ANGLE / 2
    const ix = cx + iconDist * Math.cos(midAngle)
    const iy = cy + iconDist * Math.sin(midAngle)

    const scale = i === selectedSlot ? 0.78 : 1
    const sz = iconSize * scale

    ctx.save()
    ctx.translate(ix, iy)
    ctx.scale(scale, scale)
    drawElementIcon(ctx, spell.element, sz)
    ctx.restore()

    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = `bold ${Math.round(10 * iconScale)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(spell.name, ix, iy + 26 * scale * iconScale)
    ctx.restore()
  }
}

function drawElementIcon(ctx: CanvasRenderingContext2D, element: SpellElement, size: number) {
  ctx.save()
  switch (element) {
    case 'fire':
      ctx.fillStyle = '#FF4500'
      ctx.beginPath()
      ctx.moveTo(0, -size * 0.6)
      ctx.bezierCurveTo(size * 0.3, -size * 0.2, size * 0.25, size * 0.3, 0, size * 0.5)
      ctx.bezierCurveTo(-size * 0.25, size * 0.3, -size * 0.3, -size * 0.2, 0, -size * 0.6)
      ctx.fill()
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.moveTo(0, -size * 0.3)
      ctx.bezierCurveTo(size * 0.12, -size * 0.05, size * 0.1, size * 0.15, 0, size * 0.25)
      ctx.bezierCurveTo(-size * 0.1, size * 0.15, -size * 0.12, -size * 0.05, 0, -size * 0.3)
      ctx.fill()
      break
    case 'ice':
      ctx.strokeStyle = '#87CEFA'
      ctx.lineWidth = 2
      ctx.fillStyle = '#00BFFF'
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(size * 0.5 * Math.cos(a), size * 0.5 * Math.sin(a))
        ctx.stroke()
        const bx = size * 0.35 * Math.cos(a)
        const by = size * 0.35 * Math.sin(a)
        ctx.beginPath()
        ctx.moveTo(bx + size * 0.12 * Math.cos(a + Math.PI / 3), by + size * 0.12 * Math.sin(a + Math.PI / 3))
        ctx.lineTo(bx, by)
        ctx.lineTo(bx + size * 0.12 * Math.cos(a - Math.PI / 3), by + size * 0.12 * Math.sin(a - Math.PI / 3))
        ctx.stroke()
      }
      break
    case 'lightning':
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.moveTo(-size * 0.1, -size * 0.55)
      ctx.lineTo(size * 0.15, -size * 0.1)
      ctx.lineTo(-size * 0.05, -size * 0.05)
      ctx.lineTo(size * 0.1, size * 0.55)
      ctx.lineTo(-size * 0.15, size * 0.1)
      ctx.lineTo(size * 0.05, size * 0.05)
      ctx.closePath()
      ctx.fill()
      break
    case 'dark':
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.45)
      grd.addColorStop(0, '#9400D3')
      grd.addColorStop(0.6, '#8B008B')
      grd.addColorStop(1, 'rgba(139,0,139,0)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#DDA0DD'
      ctx.beginPath()
      ctx.arc(-size * 0.08, -size * 0.08, size * 0.1, 0, Math.PI * 2)
      ctx.fill()
      break
  }
  ctx.restore()
}

export function drawCooldownOverlay(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  rotation: number,
  spells: readonly Spell[],
  cooldowns: Record<string, CooldownInfo>,
) {
  const innerRadius = radius * INNER_RADIUS_RATIO
  for (let i = 0; i < 8; i++) {
    const spell = spells[i]
    if (!spell) continue
    const cd = cooldowns[spell.id]
    if (!cd || cd.remainingMs <= 0) continue

    const progress = cd.remainingMs / cd.totalMs
    const startAngle = rotation + i * SECTOR_ANGLE
    const sweepAngle = SECTOR_ANGLE * progress

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(
      cx + innerRadius * Math.cos(startAngle),
      cy + innerRadius * Math.sin(startAngle),
    )
    ctx.arc(cx, cy, radius, startAngle, startAngle + sweepAngle)
    ctx.arc(cx, cy, innerRadius, startAngle + sweepAngle, startAngle, true)
    ctx.closePath()

    const [r1, g1, b1] = hexToRgb('#FF6B6B')
    const [r2, g2, b2] = hexToRgb('#4FC3F7')
    const [r, g, b] = lerpColor(r1, g1, b1, r2, g2, b2, 1 - progress)
    ctx.fillStyle = `rgba(${r},${g},${b},0.5)`
    ctx.fill()
    ctx.restore()
  }
}

export function drawGoldenRing(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  sweepAngle: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 3
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 8
  ctx.stroke()
  ctx.restore()

  ctx.save()
  const sweepGrad = ctx.createConicGradient(sweepAngle, cx, cy)
  sweepGrad.addColorStop(0, 'rgba(255,215,0,0)')
  sweepGrad.addColorStop(0.05, 'rgba(255,215,0,0.8)')
  sweepGrad.addColorStop(0.1, 'rgba(255,215,0,0)')
  sweepGrad.addColorStop(1, 'rgba(255,215,0,0)')
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = sweepGrad
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.restore()
}

export function drawComboIndicator(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  comboCount: number,
  scale: number,
) {
  if (comboCount < 3) return
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 20
  ctx.fillText(`X${comboCount}`, 0, 0)
  ctx.restore()
}

export function getSlotFromAngle(angle: number): number {
  let normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  return Math.floor(normalized / SECTOR_ANGLE) % 8
}

export function getSnapAngle(rotation: number): number {
  let normalized = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const slotIndex = Math.round(normalized / SECTOR_ANGLE) % 8
  return slotIndex * SECTOR_ANGLE
}

export function isNearSnapPoint(rotation: number): boolean {
  const snap = getSnapAngle(rotation)
  let diff = Math.abs(rotation - snap)
  if (diff > Math.PI) diff = Math.PI * 2 - diff
  return diff < SLOT_SNAP_THRESHOLD
}

export { SLOT_SNAP_THRESHOLD, SECTOR_ANGLE, ICON_DISTANCE_RATIO, INNER_RADIUS_RATIO }
