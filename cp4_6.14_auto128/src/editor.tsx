import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useEditorStore, LevelElement, PlatformElement, SpikeElement, CoinElement, GoalElement, CharacterState, NewPlatformElement, NewSpikeElement, NewCoinElement, NewGoalElement } from './store'
import { PhysicsEngine, PhysicsState } from './physics'

interface EditorCanvasProps {}

export interface EditorCanvasRef {
  getCanvas: () => HTMLCanvasElement | null
}

export const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(function EditorCanvas(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const physicsEngineRef = useRef<PhysicsEngine | null>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const animationFrameRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const dragElementRef = useRef<string | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const isResizingRef = useRef(false)
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const haloTimeRef = useRef(0)

  const {
    elements,
    character,
    isPlaying,
    isHit,
    isWin,
    showHalo,
    score,
    updateElement,
    setMousePosition,
    collectCoin,
    triggerHit,
    triggerWin,
    updateCharacter,
    setPlaying,
  } = useEditorStore()

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }))

  const drawRoundRect = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    },
    []
  )

  const drawPlatform = useCallback(
    (ctx: CanvasRenderingContext2D, platform: PlatformElement) => {
      ctx.fillStyle = platform.color
      drawRoundRect(ctx, platform.x, platform.y, platform.width, platform.height, platform.borderRadius)
      ctx.fill()

      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 2
      ctx.stroke()
    },
    [drawRoundRect]
  )

  const drawSpike = useCallback((ctx: CanvasRenderingContext2D, spike: SpikeElement) => {
    const triangleCount = Math.max(1, Math.floor(spike.width / 20))
    const triangleWidth = spike.width / triangleCount

    ctx.fillStyle = '#ef4444'
    for (let i = 0; i < triangleCount; i++) {
      const x = spike.x + i * triangleWidth
      ctx.beginPath()
      ctx.moveTo(x, spike.y + spike.height)
      ctx.lineTo(x + triangleWidth / 2, spike.y)
      ctx.lineTo(x + triangleWidth, spike.y + spike.height)
      ctx.closePath()
      ctx.fill()
    }

    ctx.strokeStyle = '#b91c1c'
    ctx.lineWidth = 2
    for (let i = 0; i < triangleCount; i++) {
      const x = spike.x + i * triangleWidth
      ctx.beginPath()
      ctx.moveTo(x, spike.y + spike.height)
      ctx.lineTo(x + triangleWidth / 2, spike.y)
      ctx.lineTo(x + triangleWidth, spike.y + spike.height)
      ctx.stroke()
    }
  }, [])

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, coin: CoinElement) => {
    if (coin.collected) return

    const gradient = ctx.createRadialGradient(coin.x, coin.y, 0, coin.x, coin.y, coin.radius)
    gradient.addColorStop(0, '#fde047')
    gradient.addColorStop(0.7, '#eab308')
    gradient.addColorStop(1, '#ca8a04')

    ctx.beginPath()
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.strokeStyle = '#a16207'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#fef08a'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('$', coin.x, coin.y)
  }, [])

  const drawGoal = useCallback((ctx: CanvasRenderingContext2D, goal: GoalElement) => {
    ctx.fillStyle = '#64748b'
    ctx.fillRect(goal.x + goal.width / 2 - 3, goal.y, 6, goal.height)

    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.moveTo(goal.x + goal.width / 2, goal.y)
    ctx.lineTo(goal.x + goal.width / 2 + 40, goal.y + 15)
    ctx.lineTo(goal.x + goal.width / 2, goal.y + 30)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#15803d'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('★', goal.x + goal.width / 2 + 18, goal.y + 15)
  }, [])

  const drawCharacter = useCallback((ctx: CanvasRenderingContext2D, char: CharacterState) => {
    const jumpOffset = !char.onGround ? Math.sin(Date.now() / 100) * 2 : 0

    ctx.fillStyle = '#facc15'
    drawRoundRect(ctx, char.x, char.y + jumpOffset, char.width, char.height, 4)
    ctx.fill()

    ctx.strokeStyle = '#ca8a04'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#1e293b'
    ctx.fillRect(char.x + 8, char.y + 8 + jumpOffset, 5, 5)
    ctx.fillRect(char.x + 19, char.y + 8 + jumpOffset, 5, 5)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(char.x + 9, char.y + 9 + jumpOffset, 2, 2)
    ctx.fillRect(char.x + 20, char.y + 9 + jumpOffset, 2, 2)

    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.beginPath()
    if (char.onGround) {
      ctx.arc(char.x + 16, char.y + 22 + jumpOffset, 5, 0, Math.PI)
    } else {
      ctx.arc(char.x + 16, char.y + 24 + jumpOffset, 3, 0, Math.PI * 2)
    }
    ctx.stroke()
  }, [drawRoundRect])

  const drawHalo = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!showHalo) {
      haloTimeRef.current = 0
      return
    }

    if (haloTimeRef.current === 0) {
      haloTimeRef.current = Date.now()
    }

    const elapsed = (Date.now() - haloTimeRef.current) / 200
    const progress = Math.min(1, elapsed)
    const opacity = 0.6 * (1 - progress)

    if (opacity <= 0) return

    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2 - 20 * progress,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    )
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0)')
    gradient.addColorStop(0.5, `rgba(59, 130, 246, ${opacity})`)
    gradient.addColorStop(1, `rgba(59, 130, 246, ${opacity * 0.5})`)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [showHalo])

  const drawHitEffect = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!isHit) return
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [isHit])

  const drawWinBanner = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!isWin) return

    const bannerWidth = 300
    const bannerHeight = 80
    const x = (canvas.width - bannerWidth) / 2
    const y = (canvas.height - bannerHeight) / 2

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 5

    ctx.fillStyle = '#22c55e'
    drawRoundRect(ctx, x, y, bannerWidth, bannerHeight, 16)
    ctx.fill()

    ctx.shadowColor = 'transparent'

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Winner!', canvas.width / 2, canvas.height / 2)
  }, [isWin, drawRoundRect])

  const drawScore = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!isPlaying) return

    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)'
    drawRoundRect(ctx, canvas.width - 120, 10, 110, 40, 8)
    ctx.fill()

    ctx.fillStyle = '#facc15'
    ctx.beginPath()
    ctx.arc(canvas.width - 95, 30, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`× ${score}`, canvas.width - 75, 30)
  }, [isPlaying, score, drawRoundRect])

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const findElementAtPos = useCallback(
    (x: number, y: number): LevelElement | null => {
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i]
        if (el.type === 'platform' || el.type === 'spike' || el.type === 'goal') {
          if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
            return el
          }
        } else if (el.type === 'coin') {
          const dx = x - el.x
          const dy = y - el.y
          if (dx * dx + dy * dy <= el.radius * el.radius) {
            return el
          }
        }
      }
      return null
    },
    [elements]
  )

  const isOnResizeHandle = useCallback((x: number, y: number, el: LevelElement): boolean => {
    if (el.type !== 'platform') return false
    const handleSize = 10
    return (
      x >= el.x + el.width - handleSize &&
      x <= el.x + el.width + handleSize &&
      y >= el.y + el.height - handleSize &&
      y <= el.y + el.height + handleSize
    )
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPlaying) return

      const { x, y } = getMousePos(e)
      const clickedElement = findElementAtPos(x, y)

      if (e.button === 2) {
        e.preventDefault()
        if (clickedElement) {
          useEditorStore.getState().removeElement(clickedElement.id)
        }
        return
      }

      if (clickedElement && isOnResizeHandle(x, y, clickedElement) && clickedElement.type === 'platform') {
        isResizingRef.current = true
        dragElementRef.current = clickedElement.id
        resizeStartRef.current = {
          x,
          y,
          width: clickedElement.width,
          height: clickedElement.height,
        }
        return
      }

      if (clickedElement) {
        isDraggingRef.current = true
        dragElementRef.current = clickedElement.id
        dragOffsetRef.current = {
          x: x - clickedElement.x,
          y: y - clickedElement.y,
        }
        return
      }

      const state = useEditorStore.getState()
      const tool = state.currentTool

      if (tool === 'platform') {
        state.addElement({
          type: 'platform',
          x,
          y,
          width: 100,
          height: 20,
          color: '#8b5cf6',
          borderRadius: 4,
        } as NewPlatformElement)
      } else if (tool === 'spike') {
        state.addElement({
          type: 'spike',
          x,
          y,
          width: 60,
          height: 25,
        } as NewSpikeElement)
      } else if (tool === 'coin') {
        state.addElement({
          type: 'coin',
          x,
          y,
          radius: 12,
          collected: false,
        } as NewCoinElement)
      } else if (tool === 'goal') {
        state.addElement({
          type: 'goal',
          x,
          y,
          width: 50,
          height: 60,
        } as NewGoalElement)
      }
    },
    [isPlaying, getMousePos, findElementAtPos, isOnResizeHandle]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getMousePos(e)
      setMousePosition(x, y)

      if (!dragElementRef.current) return

      if (isResizingRef.current) {
        const dx = x - resizeStartRef.current.x
        const dy = y - resizeStartRef.current.y
        updateElement(dragElementRef.current, {
          width: Math.max(30, resizeStartRef.current.width + dx),
          height: Math.max(10, resizeStartRef.current.height + dy),
        })
      } else if (isDraggingRef.current) {
        updateElement(dragElementRef.current, {
          x: x - dragOffsetRef.current.x,
          y: y - dragOffsetRef.current.y,
        })
      }
    },
    [getMousePos, setMousePosition, updateElement]
  )

  const handleMouseUp = useCallback(() => {
    if ((isDraggingRef.current || isResizingRef.current) && dragElementRef.current) {
      useEditorStore.getState().recordSnapshot()
      useEditorStore.getState().triggerHalo()
    }
    isDraggingRef.current = false
    isResizingRef.current = false
    dragElementRef.current = null
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)'
    ctx.lineWidth = 1
    const gridSize = 40
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    for (const element of elements) {
      if (element.type === 'platform') {
        drawPlatform(ctx, element)
      } else if (element.type === 'spike') {
        drawSpike(ctx, element)
      } else if (element.type === 'coin') {
        drawCoin(ctx, element)
      } else if (element.type === 'goal') {
        drawGoal(ctx, element)
      }
    }

    if (isPlaying) {
      drawCharacter(ctx, character)
    } else {
      ctx.globalAlpha = 0.5
      drawCharacter(ctx, { ...character, x: character.startX, y: character.startY })
      ctx.globalAlpha = 1
    }

    drawHalo(ctx, canvas)
    drawHitEffect(ctx, canvas)
    drawWinBanner(ctx, canvas)
    drawScore(ctx, canvas)

    animationFrameRef.current = requestAnimationFrame(render)
  }, [
    elements,
    character,
    isPlaying,
    drawPlatform,
    drawSpike,
    drawCoin,
    drawGoal,
    drawCharacter,
    drawHalo,
    drawHitEffect,
    drawWinBanner,
    drawScore,
  ])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code)

      if (!isPlaying) {
        if (e.ctrlKey && e.code === 'KeyZ' && !e.shiftKey) {
          e.preventDefault()
          useEditorStore.getState().undo()
        }
        if (e.ctrlKey && e.code === 'KeyZ' && e.shiftKey) {
          e.preventDefault()
          useEditorStore.getState().redo()
        }
        if (e.ctrlKey && e.code === 'KeyY') {
          e.preventDefault()
          useEditorStore.getState().redo()
        }
      }

      if (e.code === 'Escape') {
        if (isPlaying) {
          setPlaying(false)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPlaying, setPlaying])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = 600
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [render])

  useEffect(() => {
    if (isPlaying) {
      const physicsState: PhysicsState = {
        character,
        keys: keysRef.current,
        elements,
        onCoinCollect: collectCoin,
        onHit: triggerHit,
        onWin: triggerWin,
        updateCharacter,
      }

      physicsEngineRef.current = new PhysicsEngine(physicsState)
      physicsEngineRef.current.start()
    } else {
      if (physicsEngineRef.current) {
        physicsEngineRef.current.stop()
        physicsEngineRef.current = null
      }
    }

    return () => {
      if (physicsEngineRef.current) {
        physicsEngineRef.current.stop()
        physicsEngineRef.current = null
      }
    }
  }, [isPlaying, character, elements, collectCoin, triggerHit, triggerWin, updateCharacter])

  useEffect(() => {
    if (physicsEngineRef.current && isPlaying) {
      physicsEngineRef.current.setElements(elements)
    }
  }, [elements, isPlaying])

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      style={{
        display: 'block',
        cursor: isPlaying ? 'default' : 'crosshair',
      }}
    />
  )
})
