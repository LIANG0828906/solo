import { v4 as uuidv4 } from 'uuid'
import { mixColors, pickRandomColor, VORTEX_CENTER_COLOR, type ThemeName, getPalette } from './theme'

export type LineType = 'warp' | 'weft'

export interface Line {
  id: string
  type: LineType
  index: number
  basePos: number
  offset: number
  targetOffset: number
  speed: number
  direction: 1 | -1
  color: string
  targetColor: string
  colorMix: number
  vortexOffset: number
  vortexTargetOffset: number
  pulseOffset: number
  pulseTargetOffset: number
}

export interface VortexState {
  active: boolean
  x: number
  y: number
  radius: number
  recoveryStart: number | null
  recoveryDuration: number
}

export interface PulseEvent {
  startTime: number
  duration: number
  amplitude: number
}

export interface UpdateContext {
  timestamp: number
  viewportW: number
  viewportH: number
  tapestryX: number
  tapestryY: number
  tapestryW: number
  tapestryH: number
  vortex: VortexState
  pulses: PulseEvent[]
  paused: boolean
  theme: ThemeName
}

export const LINE_COUNT = 80
export const BASE_SPEED = 0.5
export const VORTEX_RADIUS = 80
export const RECOVERY_DURATION = 3000
export const PULSE_DURATION = 1200
export const PULSE_AMPLITUDE = 15

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3)

const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t)

export const createLines = (theme: ThemeName): Line[] => {
  const lines: Line[] = []
  const palette = getPalette(theme)

  for (let i = 0; i < LINE_COUNT; i++) {
    lines.push({
      id: uuidv4(),
      type: 'warp',
      index: i,
      basePos: (i + 0.5) / LINE_COUNT,
      offset: 0,
      targetOffset: 0,
      speed: BASE_SPEED,
      direction: Math.random() > 0.5 ? 1 : -1,
      color: pickRandomColor(palette),
      targetColor: pickRandomColor(palette),
      colorMix: Math.random(),
      vortexOffset: 0,
      vortexTargetOffset: 0,
      pulseOffset: 0,
      pulseTargetOffset: 0,
    })
  }

  for (let i = 0; i < LINE_COUNT; i++) {
    lines.push({
      id: uuidv4(),
      type: 'weft',
      index: i,
      basePos: (i + 0.5) / LINE_COUNT,
      offset: 0,
      targetOffset: 0,
      speed: BASE_SPEED,
      direction: Math.random() > 0.5 ? 1 : -1,
      color: pickRandomColor(palette),
      targetColor: pickRandomColor(palette),
      colorMix: Math.random(),
      vortexOffset: 0,
      vortexTargetOffset: 0,
      pulseOffset: 0,
      pulseTargetOffset: 0,
    })
  }

  return lines
}

export const computeVortexEffect = (
  line: Line,
  ctx: UpdateContext
): { offsetDelta: number; colorRatio: number } => {
  if (!ctx.vortex.active && ctx.vortex.recoveryStart === null) {
    return { offsetDelta: 0, colorRatio: 0 }
  }

  let lineX: number
  let lineY: number

  if (line.type === 'warp') {
    lineX = ctx.tapestryX + line.basePos * ctx.tapestryW + line.offset
    lineY = ctx.tapestryY + ctx.tapestryH / 2
  } else {
    lineX = ctx.tapestryX + ctx.tapestryW / 2
    lineY = ctx.tapestryY + line.basePos * ctx.tapestryH + line.offset
  }

  const dx = lineX - ctx.vortex.x
  const dy = lineY - ctx.vortex.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  let influence = 0
  if (dist < ctx.vortex.radius) {
    influence = 1 - dist / ctx.vortex.radius
    influence = easeOutQuad(influence)
  }

  if (ctx.vortex.recoveryStart !== null) {
    const recoveryElapsed = ctx.timestamp - ctx.vortex.recoveryStart
    const recoveryProgress = Math.min(1, recoveryElapsed / ctx.vortex.recoveryDuration)
    influence *= 1 - easeOut(recoveryProgress)
    if (recoveryProgress >= 1) {
      influence = 0
    }
  }

  const angle = Math.atan2(dy, dx)
  const swirlStrength = influence * 30
  const offsetDelta = Math.sin(angle) * swirlStrength

  return { offsetDelta, colorRatio: influence }
}

export const computePulseEffect = (line: Line, ctx: UpdateContext): number => {
  if (ctx.pulses.length === 0) return 0

  let totalOffset = 0
  const activePulses: PulseEvent[] = []

  for (const pulse of ctx.pulses) {
    const elapsed = ctx.timestamp - pulse.startTime
    if (elapsed >= pulse.duration) continue

    activePulses.push(pulse)
    const progress = elapsed / pulse.duration
    const wave = Math.sin(progress * Math.PI * 2)
    const envelope = Math.sin(progress * Math.PI)
    totalOffset += wave * envelope * pulse.amplitude
  }

  if (activePulses.length !== ctx.pulses.length) {
    ctx.pulses.length = 0
    ctx.pulses.push(...activePulses)
  }

  return totalOffset
}

export const swapAdjacentColors = (lines: Line[]): Line[] => {
  const newLines = lines.map((l) => ({ ...l }))

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < LINE_COUNT - 1; i += 2) {
      const warpA = newLines[i]
      const warpB = newLines[i + 1]
      if (Math.random() > 0.5) {
        ;[warpA.color, warpB.color] = [warpB.color, warpA.color]
        ;[warpA.targetColor, warpB.targetColor] = [warpB.targetColor, warpA.targetColor]
      }
    }

    for (let i = 0; i < LINE_COUNT - 1; i += 2) {
      const weftA = newLines[LINE_COUNT + i]
      const weftB = newLines[LINE_COUNT + i + 1]
      if (Math.random() > 0.5) {
        ;[weftA.color, weftB.color] = [weftB.color, weftA.color]
        ;[weftA.targetColor, weftB.targetColor] = [weftB.targetColor, weftA.targetColor]
      }
    }
  }

  return newLines
}

export const updateLines = (lines: Line[], ctx: UpdateContext): Line[] => {
  if (ctx.paused) return lines

  const palette = getPalette(ctx.theme)
  const updated: Line[] = new Array(lines.length)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const vortex = computeVortexEffect(line, ctx)
    const pulse = computePulseEffect(line, ctx)

    let newOffset = line.offset + line.speed * line.direction
    const maxTravel = line.type === 'warp' ? ctx.tapestryW / LINE_COUNT : ctx.tapestryH / LINE_COUNT

    if (newOffset > maxTravel) {
      newOffset = -maxTravel
    } else if (newOffset < -maxTravel) {
      newOffset = maxTravel
    }

    let newColorMix = line.colorMix + 0.005
    let newTargetColor = line.targetColor
    if (newColorMix >= 1) {
      newColorMix = 0
      newTargetColor = pickRandomColor(palette)
    }

    const baseColor = mixColors(line.color, line.targetColor, easeOut(newColorMix))
    const finalColor = mixColors(baseColor, VORTEX_CENTER_COLOR, vortex.colorRatio)

    const vortexSmoothed = line.vortexOffset + (vortex.offsetDelta - line.vortexOffset) * 0.15
    const pulseSmoothed = line.pulseOffset + (pulse - line.pulseOffset) * 0.2

    updated[i] = {
      ...line,
      offset: newOffset,
      targetOffset: newOffset,
      colorMix: newColorMix,
      targetColor: newTargetColor,
      color: finalColor,
      vortexOffset: vortexSmoothed,
      pulseOffset: pulseSmoothed,
    }
  }

  return updated
}

export const sortLinesForRender = (lines: Line[]): Line[] => {
  return [...lines].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'warp' ? -1 : 1
    }
    return a.index - b.index
  })
}
