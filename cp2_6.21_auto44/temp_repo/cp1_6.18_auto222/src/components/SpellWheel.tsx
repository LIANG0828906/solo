import { useRef, useEffect, useCallback, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ParticlePool, hexToRgb } from '@/utils/particlePool'
import {
  drawWheelBackground,
  drawSectors,
  drawSpellIcons,
  drawCooldownOverlay,
  drawGoldenRing,
  drawComboIndicator,
  getSnapAngle,
  isNearSnapPoint,
  SECTOR_ANGLE,
} from '@/utils/wheelRenderer'
import type { SpellCastEvent } from '@/types'

interface SpellWheelProps {
  onSpellCast?: (event: SpellCastEvent) => void
}

const WHEEL_RADIUS = 200
const CANVAS_PADDING = 60
const CANVAS_SIZE = (WHEEL_RADIUS + CANVAS_PADDING) * 2

export default function SpellWheel({ onSpellCast }: SpellWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleRef = useRef(new ParticlePool())
  const animRef = useRef(0)
  const rotationRef = useRef(0)
  const targetRotationRef = useRef(0)
  const isDraggingRef = useRef(false)
  const dragStartAngleRef = useRef(0)
  const dragStartRotationRef = useRef(0)
  const selectedSlotRef = useRef(-1)
  const highlightProgressRef = useRef(0)
  const comboScaleRef = useRef(0)
  const comboCountRef = useRef(0)
  const sweepAngleRef = useRef(0)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressSlotRef = useRef(-1)
  const lastFrameTimeRef = useRef(performance.now())
  const flyOutRef = useRef<{ slotIndex: number; progress: number; active: boolean }[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editingSlot, setEditingSlot] = useState(-1)
  const dprRef = useRef(1)

  const spellSlots = useGameStore(s => s.spellSlots)
  const cooldowns = useGameStore(s => s.cooldowns)
  const combo = useGameStore(s => s.combo)
  const castSpell = useGameStore(s => s.castSpell)
  const isOnCooldown = useGameStore(s => s.isOnCooldown)
  const canCastSpell = useGameStore(s => s.canCastSpell)
  const addCastLog = useGameStore(s => s.addCastLog)

  const getCx = useCallback(() => CANVAS_SIZE / 2, [])
  const getCy = useCallback(() => CANVAS_SIZE / 2, [])

  const getMouseAngle = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_SIZE / rect.width
    const scaleY = CANVAS_SIZE / rect.height
    const x = (clientX - rect.left) * scaleX - getCx()
    const y = (clientY - rect.top) * scaleY - getCy()
    return Math.atan2(y, x)
  }, [getCx, getCy])

  const getSelectedSlotFromRotation = useCallback((rotation: number) => {
    let normalized = (((-rotation) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const slot = Math.floor(normalized / SECTOR_ANGLE + 0.5) % 8
    return slot
  }, [])

  const triggerSpellCast = useCallback((slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= spellSlots.length) return
    const spell = spellSlots[slotIndex]
    if (!spell) return

    if (isOnCooldown(spell.id)) {
      addCastLog(`${spell.name} 冷却中!`)
      return
    }

    if (!canCastSpell(spell.id)) {
      addCastLog(`法力不足，无法释放 ${spell.name}!`)
      return
    }

    const success = castSpell(spell.id)
    if (success) {
      const midAngle = rotationRef.current + slotIndex * SECTOR_ANGLE + SECTOR_ANGLE / 2
      const event: SpellCastEvent = {
        spellId: spell.id,
        slotIndex,
        element: spell.element,
        angle: midAngle,
        damage: spell.damage,
      }
      onSpellCast?.(event)
      addCastLog(`释放了 ${spell.name}!`)

      flyOutRef.current.push({ slotIndex, progress: 0, active: true })

      const cx = getCx()
      const cy = getCy()
      const pool = particleRef.current
      const [r1, g1, b1] = hexToRgb(spell.gradientColors[0])
      const [r2, g2, b2] = hexToRgb(spell.gradientColors[1])
      for (let j = 0; j < 12; j++) {
        const angle = midAngle + (Math.random() - 0.5) * 0.5
        const speed = 50 + Math.random() * 80
        const [r, g, b] = Math.random() > 0.5 ? [r1, g1, b1] : [r2, g2, b2]
        pool.spawn(
          cx + WHEEL_RADIUS * 0.3 * Math.cos(midAngle),
          cy + WHEEL_RADIUS * 0.3 * Math.sin(midAngle),
          speed * Math.cos(angle),
          speed * Math.sin(angle),
          2 + Math.random() * 4,
          r, g, b,
          800 + Math.random() * 700,
        )
      }
    }
  }, [spellSlots, isOnCooldown, canCastSpell, castSpell, onSpellCast, addCastLog, getCx, getCy])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const angle = getMouseAngle(e.clientX, e.clientY)
    isDraggingRef.current = true
    dragStartAngleRef.current = angle
    dragStartRotationRef.current = rotationRef.current
    selectedSlotRef.current = getSelectedSlotFromRotation(rotationRef.current)

    longPressSlotRef.current = selectedSlotRef.current
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = setTimeout(() => {
      if (isDraggingRef.current && longPressSlotRef.current >= 0) {
        setEditMode(true)
        setEditingSlot(longPressSlotRef.current)
      }
    }, 1000)

    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [getMouseAngle, getSelectedSlotFromRotation])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const angle = getMouseAngle(e.clientX, e.clientY)
    let delta = angle - dragStartAngleRef.current
    if (delta > Math.PI) delta -= Math.PI * 2
    if (delta < -Math.PI) delta += Math.PI * 2
    rotationRef.current = dragStartRotationRef.current + delta
    targetRotationRef.current = rotationRef.current

    const moveDist = Math.abs(delta)
    if (moveDist > 0.1 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [getMouseAngle])

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (editMode) return

    const current = rotationRef.current
    if (isNearSnapPoint(current)) {
      targetRotationRef.current = getSnapAngle(current)
    }

    const slot = getSelectedSlotFromRotation(rotationRef.current)
    if (slot >= 0 && slot < spellSlots.length) {
      const prevSlot = selectedSlotRef.current
      if (slot === prevSlot || prevSlot === -1) {
        triggerSpellCast(slot)
      }
    }
    selectedSlotRef.current = slot
  }, [editMode, getSelectedSlotFromRotation, spellSlots.length, triggerSpellCast])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (editMode) return
    const angle = getMouseAngle(e.clientX, e.clientY)
    const relAngle = ((angle - rotationRef.current) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
    const slot = Math.floor(relAngle / SECTOR_ANGLE) % 8
    selectedSlotRef.current = slot
    highlightProgressRef.current = 1
    triggerSpellCast(slot)
  }, [editMode, getMouseAngle, triggerSpellCast])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr
    canvas.width = CANVAS_SIZE * dpr
    canvas.height = CANVAS_SIZE * dpr
    ctx.scale(dpr, dpr)

    const render = () => {
      const now = performance.now()
      const delta = Math.min(now - lastFrameTimeRef.current, 50)
      lastFrameTimeRef.current = now

      if (!isDraggingRef.current) {
        const diff = targetRotationRef.current - rotationRef.current
        rotationRef.current += diff * Math.min(1, delta / 150)
      }

      const cx = getCx()
      const cy = getCy()

      if (highlightProgressRef.current > 0) {
        highlightProgressRef.current = Math.max(0, highlightProgressRef.current - delta / 200)
      }

      const currentCombo = combo.spellIds.length
      if (currentCombo >= 3 && combo.isActive) {
        comboCountRef.current = currentCombo
        comboScaleRef.current = Math.min(1.5, comboScaleRef.current + delta / 300)
      } else {
        comboScaleRef.current = Math.max(0, comboScaleRef.current - delta / 200)
        if (comboScaleRef.current <= 0) comboCountRef.current = 0
      }

      sweepAngleRef.current += delta * 0.003

      for (const fo of flyOutRef.current) {
        if (!fo.active) continue
        fo.progress += delta / 600
        if (fo.progress >= 1) fo.active = false
      }
      flyOutRef.current = flyOutRef.current.filter(fo => fo.active)

      particleRef.current.update(delta)

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      drawWheelBackground(ctx, cx, cy, WHEEL_RADIUS)
      drawSectors(ctx, cx, cy, WHEEL_RADIUS, rotationRef.current, spellSlots, selectedSlotRef.current, highlightProgressRef.current)
      drawSpellIcons(ctx, cx, cy, WHEEL_RADIUS, rotationRef.current, spellSlots, selectedSlotRef.current, 1)
      drawCooldownOverlay(ctx, cx, cy, WHEEL_RADIUS, rotationRef.current, spellSlots, cooldowns)
      drawGoldenRing(ctx, cx, cy, WHEEL_RADIUS, sweepAngleRef.current)
      drawComboIndicator(ctx, cx, cy, comboCountRef.current, comboScaleRef.current)
      particleRef.current.draw(ctx)

      for (const fo of flyOutRef.current) {
        if (!fo.active) continue
        const spell = spellSlots[fo.slotIndex]
        if (!spell) continue
        const midAngle = rotationRef.current + fo.slotIndex * SECTOR_ANGLE + SECTOR_ANGLE / 2
        const dist = WHEEL_RADIUS * 0.3 + WHEEL_RADIUS * 0.7 * fo.progress
        const fx = cx + dist * Math.cos(midAngle)
        const fy = cy + dist * Math.sin(midAngle)
        const alpha = 1 - fo.progress
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(fx, fy)
        ctx.scale(1 - fo.progress * 0.5, 1 - fo.progress * 0.5)
        const [r, g, b] = hexToRgb(spell.gradientColors[0])
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.beginPath()
        ctx.arc(0, 0, 15, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (selectedSlotRef.current >= 0 && highlightProgressRef.current > 0) {
        const si = selectedSlotRef.current
        const midAngle = rotationRef.current + si * SECTOR_ANGLE + SECTOR_ANGLE / 2
        const slotCx = cx + WHEEL_RADIUS * 0.55 * Math.cos(midAngle)
        const slotCy = cy + WHEEL_RADIUS * 0.55 * Math.sin(midAngle)
        const alpha = highlightProgressRef.current * 0.4
        ctx.save()
        const glow = ctx.createRadialGradient(slotCx, slotCy, 0, slotCx, slotCy, 40)
        glow.addColorStop(0, `rgba(255,215,0,${alpha})`)
        glow.addColorStop(1, `rgba(255,215,0,0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(slotCx, slotCy, 40, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [spellSlots, cooldowns, combo, getCx, getCy])

  const exitEditMode = useCallback(() => {
    setEditMode(false)
    setEditingSlot(-1)
  }, [])

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE * dprRef.current}
        height={CANVAS_SIZE * dprRef.current}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, maxWidth: '100%' }}
        className="cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      />
      {editMode && editingSlot >= 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
          style={{ width: CANVAS_SIZE * 0.6, height: CANVAS_SIZE * 0.6 }}
        >
          <SpellEditPanel
            slotIndex={editingSlot}
            onClose={exitEditMode}
          />
        </div>
      )}
    </div>
  )
}

function SpellEditPanel({ slotIndex, onClose }: { slotIndex: number; onClose: () => void }) {
  const swapSpell = useGameStore(s => s.swapSpell)
  const currentSlots = useGameStore(s => s.spellSlots)
  const allSpells = useGameStore(s => s.spellSlots)

  const handleSwap = (newSpellIndex: number) => {
    const newSpell = allSpells[newSpellIndex]
    if (newSpell) {
      swapSpell(slotIndex, newSpell)
    }
    onClose()
  }

  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <p className="text-yellow-300 text-sm font-bold">替换槽位 {slotIndex + 1}</p>
      <div className="grid grid-cols-2 gap-2">
        {currentSlots.map((spell, i) => (
          <button
            key={spell.id}
            className="px-2 py-1 text-xs text-white bg-purple-900/60 rounded hover:bg-purple-700/80 transition-colors"
            onClick={() => handleSwap(i)}
          >
            {spell.name}
          </button>
        ))}
      </div>
      <button
        className="mt-2 px-3 py-1 text-xs text-gray-300 bg-gray-800 rounded hover:bg-gray-700"
        onClick={onClose}
      >
        取消
      </button>
    </div>
  )
}
