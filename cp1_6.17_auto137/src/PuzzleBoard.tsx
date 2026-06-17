import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useGameStore, type Fragment, type Slot } from './store'
import { audioEngine } from './audioEngine'

interface Props {
  onComplete: () => void
}

interface AnimatingFragment {
  fragmentId: string
  type: 'glow' | 'shake'
  startTime: number
  slotId?: string
}

const HEX_SIZE = 40
const HEX_SIZE_DRAGGING = 42.5
const GRID_OFFSET_X = 0
const GRID_OFFSET_Y = 50
const POOL_ITEM_SIZE = 90

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fillColor: string,
  strokeColor: string,
  lineWidth: number = 2
): void {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = x + size * Math.cos(angle)
    const py = y + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const PuzzleBoard: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)

  const { currentConstellation, fragmentPool, placedFragments, placeFragment, isCompleted } =
    useGameStore()

  const [draggingFragment, setDraggingFragment] = useState<Fragment | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [animatingFragments, setAnimatingFragments] = useState<AnimatingFragment[]>([])
  const [snappingFragment, setSnappingFragment] = useState<{
    fragment: Fragment
    fromX: number
    fromY: number
    toSlot: Slot
    startTime: number
  } | null>(null)

  const getPoolPosition = useCallback(
    (index: number): { x: number; y: number } => {
      const col = index % 2
      const row = Math.floor(index / 2)
      return {
        x: 60 + col * POOL_ITEM_SIZE,
        y: 120 + row * POOL_ITEM_SIZE,
      }
    },
    []
  )

  const getSlotPosition = useCallback(
    (slot: Slot): { x: number; y: number } => {
      return {
        x: slot.x + 300 + GRID_OFFSET_X,
        y: slot.y + GRID_OFFSET_Y,
      }
    },
    []
  )

  const findNearestSlot = useCallback(
    (x: number, y: number): Slot | null => {
      let nearestSlot: Slot | null = null
      let minDistance = Infinity

      for (const slot of currentConstellation.slots) {
        const slotPos = getSlotPosition(slot)
        const distance = Math.sqrt(Math.pow(x - slotPos.x, 2) + Math.pow(y - slotPos.y, 2))
        if (distance < minDistance && distance < 80) {
          const isOccupied = placedFragments.some(
            (f) => f.targetSlotId === slot.id && f.isPlaced
          )
          if (!isOccupied) {
            minDistance = distance
            nearestSlot = slot
          }
        }
      }

      return nearestSlot
    },
    [currentConstellation.slots, getSlotPosition, placedFragments]
  )

  const findFragmentAtPosition = useCallback(
    (x: number, y: number): Fragment | null => {
      for (let i = fragmentPool.length - 1; i >= 0; i--) {
        const fragment = fragmentPool[i]
        if (fragment.isPlaced) continue
        const pos = getPoolPosition(i)
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))
        if (distance < HEX_SIZE) {
          return fragment
        }
      }
      return null
    },
    [fragmentPool, getPoolPosition]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      if (isCompleted || snappingFragment) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const fragment = findFragmentAtPosition(x, y)
      if (fragment) {
        const poolPos = getPoolPosition(fragmentPool.indexOf(fragment))
        setDraggingFragment(fragment)
        setDragOffset({ x: x - poolPos.x, y: y - poolPos.y })
        setDragPosition({ x, y })
      }
    },
    [findFragmentAtPosition, getPoolPosition, fragmentPool, isCompleted, snappingFragment]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      if (!draggingFragment) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setDragPosition({ x, y })
    },
    [draggingFragment]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      if (!draggingFragment || snappingFragment) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const nearestSlot = findNearestSlot(x, y)

      if (nearestSlot) {
        const isCorrect = placeFragment(draggingFragment.id, nearestSlot.id)
        if (isCorrect) {
          const poolPos = getPoolPosition(fragmentPool.indexOf(draggingFragment))
          setSnappingFragment({
            fragment: draggingFragment,
            fromX: x - dragOffset.x,
            fromY: y - dragOffset.y,
            toSlot: nearestSlot,
            startTime: performance.now(),
          })
          setAnimatingFragments((prev) => [
            ...prev,
            {
              fragmentId: draggingFragment.id,
              type: 'glow',
              startTime: performance.now() + 300,
              slotId: nearestSlot.id,
            },
          ])
          audioEngine.playPlaceSound()
        } else {
          setAnimatingFragments((prev) => [
            ...prev,
            {
              fragmentId: draggingFragment.id,
              type: 'shake',
              startTime: performance.now(),
            },
          ])
          audioEngine.playErrorSound()
        }
      }

      setDraggingFragment(null)
    },
    [
      draggingFragment,
      findNearestSlot,
      placeFragment,
      getPoolPosition,
      fragmentPool,
      dragOffset,
      snappingFragment,
    ]
  )

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        onComplete()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isCompleted, onComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = 0

    const render = (currentTime: number): void => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime
      void deltaTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gridGradient = ctx.createLinearGradient(300, 0, 300, canvas.height)
      gridGradient.addColorStop(0, '#0D1117')
      gridGradient.addColorStop(1, '#0D1117CC')
      ctx.fillStyle = gridGradient
      ctx.fillRect(0, 0, 300, canvas.height)

      ctx.font = '16px sans-serif'
      ctx.fillStyle = '#8B949E'
      ctx.fillText('碎片池', 90, 80)

      ctx.strokeStyle = '#30363D'
      ctx.lineWidth = 1
      for (let x = 300; x < canvas.width; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.globalAlpha = 0.3
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath()
        ctx.moveTo(300, y)
        ctx.lineTo(canvas.width, y)
        ctx.globalAlpha = 0.3
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      currentConstellation.slots.forEach((slot) => {
        const pos = getSlotPosition(slot)
        const isOccupied = placedFragments.some(
          (f) => f.targetSlotId === slot.id && f.isPlaced
        )

        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6
          const px = pos.x + HEX_SIZE * Math.cos(angle)
          const py = pos.y + HEX_SIZE * Math.sin(angle)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()

        if (isOccupied) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
          ctx.setLineDash([])
          ctx.lineWidth = 2
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
          ctx.setLineDash([5, 5])
          ctx.lineWidth = 1.5
        }
        ctx.stroke()
        ctx.setLineDash([])
      })

      const now = performance.now()

      fragmentPool.forEach((fragment, index) => {
        if (fragment.isPlaced) return
        if (draggingFragment?.id === fragment.id) return
        if (snappingFragment?.fragment.id === fragment.id) return

        const pos = getPoolPosition(index)
        const shakeAnim = animatingFragments.find(
          (a) => a.fragmentId === fragment.id && a.type === 'shake'
        )

        let offsetX = 0
        let displayColor = fragment.color

        if (shakeAnim) {
          const elapsed = now - shakeAnim.startTime
          if (elapsed < 200) {
            const progress = elapsed / 200
            offsetX = Math.sin(progress * Math.PI * 10) * 5 * (1 - progress)
            if (elapsed < 300) {
              displayColor = '#FF4444'
            }
          }
        }

        drawHexagon(
          ctx,
          pos.x + offsetX,
          pos.y,
          HEX_SIZE,
          displayColor + 'CC',
          displayColor,
          2
        )
      })

      placedFragments.forEach((fragment) => {
        const slot = currentConstellation.slots.find(
          (s) => s.id === fragment.targetSlotId
        )
        if (!slot) return

        const pos = getSlotPosition(slot)
        const glowAnim = animatingFragments.find(
          (a) => a.slotId === slot.id && a.type === 'glow'
        )

        drawHexagon(ctx, pos.x, pos.y, HEX_SIZE, fragment.color + 'E6', fragment.color, 2)

        if (glowAnim) {
          const elapsed = now - glowAnim.startTime
          if (elapsed < 500) {
            const alpha = 0.8 * (1 - elapsed / 500)
            const glowSize = HEX_SIZE + 10 * (elapsed / 500)
            ctx.beginPath()
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i - Math.PI / 6
              const px = pos.x + glowSize * Math.cos(angle)
              const py = pos.y + glowSize * Math.sin(angle)
              if (i === 0) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
            }
            ctx.closePath()
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.lineWidth = 3
            ctx.stroke()

            const gradient = ctx.createRadialGradient(
              pos.x,
              pos.y,
              HEX_SIZE * 0.5,
              pos.x,
              pos.y,
              glowSize
            )
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`)
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
            ctx.fillStyle = gradient
            ctx.fill()
          }
        }
      })

      if (snappingFragment) {
        const elapsed = now - snappingFragment.startTime
        const duration = 300

        if (elapsed >= duration) {
          setSnappingFragment(null)
        } else {
          const t = easeOut(elapsed / duration)
          const toPos = getSlotPosition(snappingFragment.toSlot)
          const x = snappingFragment.fromX + (toPos.x - snappingFragment.fromX) * t
          const y = snappingFragment.fromY + (toPos.y - snappingFragment.fromY) * t

          drawHexagon(
            ctx,
            x,
            y,
            HEX_SIZE,
            snappingFragment.fragment.color + 'E6',
            snappingFragment.fragment.color,
            2
          )
        }
      }

      if (draggingFragment) {
        const x = dragPosition.x - dragOffset.x
        const y = dragPosition.y - dragOffset.y

        ctx.save()
        ctx.shadowColor = draggingFragment.color
        ctx.shadowBlur = 20
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4

        drawHexagon(
          ctx,
          x,
          y,
          HEX_SIZE_DRAGGING,
          draggingFragment.color + 'E6',
          draggingFragment.color,
          3
        )
        ctx.restore()

        const nearestSlot = findNearestSlot(x, y)
        if (nearestSlot) {
          const slotPos = getSlotPosition(nearestSlot)
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6
            const px = slotPos.x + HEX_SIZE * 1.1 * Math.cos(angle)
            const py = slotPos.y + HEX_SIZE * 1.1 * Math.sin(angle)
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.strokeStyle = draggingFragment.color
          ctx.lineWidth = 2
          ctx.setLineDash([8, 4])
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      const cleanedAnims = animatingFragments.filter((a) => {
        const elapsed = now - a.startTime
        return elapsed < 600
      })
      if (cleanedAnims.length !== animatingFragments.length) {
        setAnimatingFragments(cleanedAnims)
      }

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [
    currentConstellation,
    fragmentPool,
    placedFragments,
    draggingFragment,
    dragPosition,
    dragOffset,
    animatingFragments,
    snappingFragment,
    getPoolPosition,
    getSlotPosition,
    findNearestSlot,
  ])

  const progress = placedFragments.length
  const total = currentConstellation.slots.length

  return (
    <div
      ref={containerRef}
      style={{
        width: '900px',
        height: '600px',
        backgroundColor: '#161B22',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '320px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <h2
          style={{
            color: '#C9D1D9',
            fontSize: '20px',
            fontWeight: 600,
            margin: 0,
            letterSpacing: '2px',
          }}
        >
          {currentConstellation.name}
        </h2>
        <div
          style={{
            color: '#8B949E',
            fontSize: '16px',
            fontFamily: 'monospace',
          }}
        >
          碎片进度：
          <span style={{ color: currentConstellation.color, fontWeight: 600 }}>
            {progress}
          </span>
          <span style={{ color: '#6E7681' }}>/{total}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        style={{
          display: 'block',
          cursor: draggingFragment ? 'grabbing' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}

export default PuzzleBoard
