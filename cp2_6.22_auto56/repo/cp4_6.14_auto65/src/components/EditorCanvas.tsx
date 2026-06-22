import { useRef, useEffect, useCallback, useState } from 'react'
import type { Tile, Enemy, TileType, Viewport, HistoryAction } from '../types'

const GRID_SIZE = 32
const SNAP_DISTANCE = 16
const MIN_SCALE = 0.25
const MAX_SCALE = 4.0

interface EditorCanvasProps {
  tiles: Tile[]
  enemies: Enemy[]
  viewport: Viewport
  onViewportChange: (viewport: Viewport) => void
  onTilesChange: (tiles: Tile[]) => void
  onEnemiesChange: (enemies: Enemy[]) => void
  onPushHistory: (action: HistoryAction) => void
  currentTool: 'ground' | 'wall' | 'platform' | 'eraser' | 'enemy' | 'hand'
  onTileDraw?: (tiles: Tile[], previousTiles: Tile[]) => void
  onTileErase?: (erased: Tile[]) => void
  onEnemyPlace?: (enemy: Enemy) => void
  onEnemyMove?: (enemyId: string, from: { x: number; y: number }, to: { x: number; y: number }) => void
  onEnemyDelete?: (enemy: Enemy) => void
}

type ToolMode = 'idle' | 'drawing' | 'panning' | 'dragging_enemy' | 'placing_enemy'

const TILE_COLORS: Record<TileType, string> = {
  ground: '#92400e',
  wall: '#475569',
  platform: '#65a30d'
}

export default function EditorCanvas({
  tiles,
  enemies,
  viewport,
  onViewportChange,
  onTilesChange,
  onEnemiesChange,
  onPushHistory,
  currentTool,
  onTileDraw,
  onTileErase,
  onEnemyPlace,
  onEnemyMove,
  onEnemyDelete
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>(0)
  const tilesRef = useRef<Tile[]>(tiles)
  const enemiesRef = useRef<Enemy[]>(enemies)
  const viewportRef = useRef<Viewport>(viewport)

  const toolModeRef = useRef<ToolMode>('idle')
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const isDrawingRef = useRef(false)
  const drawnTilesRef = useRef<Map<string, Tile>>(new Map())
  const previousTilesRef = useRef<Map<string, Tile>>(new Map())
  const erasedTilesRef = useRef<Map<string, Tile>>(new Map())
  const draggingEnemyRef = useRef<Enemy | null>(null)
  const dragStartPosRef = useRef({ x: 0, y: 0 })
  const selectedEnemyRef = useRef<string | null>(null)
  const showEnemyMenuRef = useRef<{ x: number; y: number; enemyId: string } | null>(null)
  const isSpacePressedRef = useRef(false)

  const [enemyMenu, setEnemyMenu] = useState<{ x: number; y: number; enemyId: string } | null>(null)

  useEffect(() => {
    tilesRef.current = tiles
    enemiesRef.current = enemies
    viewportRef.current = viewport
  }, [tiles, enemies, viewport])

  const screenToWorld = useCallback((screenX: number, screenY: number, vp: Viewport) => {
    return {
      x: (screenX - vp.offsetX) / vp.scale,
      y: (screenY - vp.offsetY) / vp.scale
    }
  }, [])

  const worldToScreen = useCallback((worldX: number, worldY: number, vp: Viewport) => {
    return {
      x: worldX * vp.scale + vp.offsetX,
      y: worldY * vp.scale + vp.offsetY
    }
  }, [])

  const snapToGrid = useCallback((value: number, scale: number, gridSize: number = GRID_SIZE) => {
    return Math.round(value / gridSize) * gridSize
  }, [])

  const snapEnemyToGrid = useCallback((worldX: number, worldY: number, scale: number) => {
    const snapGrid = SNAP_DISTANCE
    return {
      x: Math.round(worldX / snapGrid) * snapGrid,
      y: Math.round(worldY / snapGrid) * snapGrid
    }
  }, [])

  const getTileKey = (gridX: number, gridY: number) => `${gridX},${gridY}`

  const findTileAt = useCallback((worldX: number, worldY: number, tilesList: Tile[]) => {
    const gridX = Math.floor(worldX / GRID_SIZE)
    const gridY = Math.floor(worldY / GRID_SIZE)
    return tilesList.find(t => t.x === gridX && t.y === gridY)
  }, [])

  const findEnemyAt = useCallback((worldX: number, worldY: number, enemiesList: Enemy[], scale: number) => {
    const radius = 12
    for (const enemy of enemiesList) {
      const dx = worldX - enemy.x
      const dy = worldY - enemy.y
      if (dx * dx + dy * dy <= radius * radius) {
        return enemy
      }
    }
    return null
  }, [])

  const isInViewport = useCallback((worldX: number, worldY: number, width: number, height: number, vp: Viewport, canvasWidth: number, canvasHeight: number) => {
    const screen = worldToScreen(worldX, worldY, vp)
    return (
      screen.x + width * vp.scale >= 0 &&
      screen.x <= canvasWidth &&
      screen.y + height * vp.scale >= 0 &&
      screen.y <= canvasHeight
    )
  }, [worldToScreen])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const vp = viewportRef.current
    const currentTiles = tilesRef.current
    const currentEnemies = enemiesRef.current

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#e0f2fe')
    gradient.addColorStop(1, '#f0f9ff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    const startWorld = screenToWorld(0, 0, vp)
    const endWorld = screenToWorld(width, height, vp)

    const startGridX = Math.floor(startWorld.x / GRID_SIZE)
    const endGridX = Math.ceil(endWorld.x / GRID_SIZE)
    const startGridY = Math.floor(startWorld.y / GRID_SIZE)
    const endGridY = Math.ceil(endWorld.y / GRID_SIZE)

    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1

    if (vp.scale >= 0.25) {
      for (let gx = startGridX; gx <= endGridX; gx++) {
        const screenX = gx * GRID_SIZE * vp.scale + vp.offsetX
        ctx.beginPath()
        ctx.moveTo(screenX, 0)
        ctx.lineTo(screenX, height)
        ctx.stroke()
      }

      for (let gy = startGridY; gy <= endGridY; gy++) {
        const screenY = gy * GRID_SIZE * vp.scale + vp.offsetY
        ctx.beginPath()
        ctx.moveTo(0, screenY)
        ctx.lineTo(width, screenY)
        ctx.stroke()
      }
    }

    for (const tile of currentTiles) {
      if (!isInViewport(tile.x * GRID_SIZE, tile.y * GRID_SIZE, GRID_SIZE, GRID_SIZE, vp, width, height)) {
        continue
      }

      const screen = worldToScreen(tile.x * GRID_SIZE, tile.y * GRID_SIZE, vp)
      const size = GRID_SIZE * vp.scale

      ctx.fillStyle = TILE_COLORS[tile.type]
      ctx.fillRect(screen.x, screen.y, size, size)

      if (vp.scale >= 0.5) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.lineWidth = 1
        ctx.strokeRect(screen.x, screen.y, size, size)
      }
    }

    for (const enemy of currentEnemies) {
      if (!isInViewport(enemy.x - 12, enemy.y - 12, 24, 24, vp, width, height)) {
        continue
      }

      const screen = worldToScreen(enemy.x, enemy.y, vp)
      const radius = 12 * vp.scale

      ctx.beginPath()
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = '#dc2626'
      ctx.fill()

      if (selectedEnemyRef.current === enemy.id) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    if (draggingEnemyRef.current) {
      const screen = worldToScreen(draggingEnemyRef.current.x, draggingEnemyRef.current.y, vp)
      const radius = 12 * vp.scale

      ctx.beginPath()
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(220, 38, 38, 0.5)'
      ctx.fill()
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])
    }

    animationFrameRef.current = requestAnimationFrame(render)
  }, [screenToWorld, worldToScreen, isInViewport])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [render])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const world = screenToWorld(screenX, screenY, viewportRef.current)

    lastMousePosRef.current = { x: e.clientX, y: e.clientY }

    const effectiveTool = isSpacePressedRef.current ? 'hand' : currentTool

    if (effectiveTool === 'hand' || e.button === 1) {
      toolModeRef.current = 'panning'
      return
    }

    if (effectiveTool === 'enemy') {
      const hitEnemy = findEnemyAt(world.x, world.y, enemiesRef.current, viewportRef.current.scale)
      if (hitEnemy) {
        draggingEnemyRef.current = { ...hitEnemy }
        dragStartPosRef.current = { x: hitEnemy.x, y: hitEnemy.y }
        selectedEnemyRef.current = hitEnemy.id
        toolModeRef.current = 'dragging_enemy'
      } else {
        toolModeRef.current = 'placing_enemy'
      }
      return
    }

    if (effectiveTool === 'ground' || effectiveTool === 'wall' || effectiveTool === 'platform' || effectiveTool === 'eraser') {
      const hitEnemy = findEnemyAt(world.x, world.y, enemiesRef.current, viewportRef.current.scale)
      if (hitEnemy) {
        draggingEnemyRef.current = { ...hitEnemy }
        dragStartPosRef.current = { x: hitEnemy.x, y: hitEnemy.y }
        selectedEnemyRef.current = hitEnemy.id
        toolModeRef.current = 'dragging_enemy'
        return
      }

      isDrawingRef.current = true
      drawnTilesRef.current.clear()
      previousTilesRef.current.clear()
      erasedTilesRef.current.clear()
      toolModeRef.current = 'drawing'
      handleDrawingAt(world.x, world.y, effectiveTool)
    }
  }, [currentTool, screenToWorld, findEnemyAt])

  const handleDrawingAt = useCallback((worldX: number, worldY: number, tool: string) => {
    const gridX = Math.floor(worldX / GRID_SIZE)
    const gridY = Math.floor(worldY / GRID_SIZE)
    const key = getTileKey(gridX, gridY)

    if (tool === 'eraser') {
      const existingTile = findTileAt(worldX, worldY, tilesRef.current)
      if (existingTile && !erasedTilesRef.current.has(existingTile.id)) {
        erasedTilesRef.current.set(existingTile.id, existingTile)
        const newTiles = tilesRef.current.filter(t => t.id !== existingTile.id)
        tilesRef.current = newTiles
        onTilesChange(newTiles)
      }
    } else if (tool === 'ground' || tool === 'wall' || tool === 'platform') {
      const existingTile = findTileAt(worldX, worldY, tilesRef.current)
      if (existingTile) {
        if (existingTile.type === tool) return
        if (!previousTilesRef.current.has(existingTile.id)) {
          previousTilesRef.current.set(existingTile.id, existingTile)
        }
        const newTiles = tilesRef.current.filter(t => t.id !== existingTile.id)
        tilesRef.current = newTiles
      }

      if (!drawnTilesRef.current.has(key)) {
        const newTile: Tile = {
          id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          x: gridX,
          y: gridY,
          type: tool as TileType
        }
        drawnTilesRef.current.set(key, newTile)
        const newTiles = [...tilesRef.current, newTile]
        tilesRef.current = newTiles
        onTilesChange(newTiles)
      }
    }
  }, [findTileAt, onTilesChange])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const dx = e.clientX - lastMousePosRef.current.x
    const dy = e.clientY - lastMousePosRef.current.y

    if (toolModeRef.current === 'panning') {
      const newViewport = {
        ...viewportRef.current,
        offsetX: viewportRef.current.offsetX + dx,
        offsetY: viewportRef.current.offsetY + dy
      }
      viewportRef.current = newViewport
      onViewportChange(newViewport)
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
      return
    }

    if (toolModeRef.current === 'dragging_enemy' && draggingEnemyRef.current) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const world = screenToWorld(screenX, screenY, viewportRef.current)

      const snapped = snapEnemyToGrid(world.x, world.y, viewportRef.current.scale)
      draggingEnemyRef.current = { ...draggingEnemyRef.current, x: snapped.x, y: snapped.y }
      return
    }

    if (toolModeRef.current === 'drawing' && isDrawingRef.current) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const world = screenToWorld(screenX, screenY, viewportRef.current)

      const effectiveTool = isSpacePressedRef.current ? 'hand' : currentTool
      if (effectiveTool !== 'hand') {
        handleDrawingAt(world.x, world.y, effectiveTool)
      }
    }

    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
  }, [currentTool, onViewportChange, screenToWorld, handleDrawingAt, snapEnemyToGrid])

  const handleMouseUp = useCallback(() => {
    if (toolModeRef.current === 'drawing') {
      if (drawnTilesRef.current.size > 0) {
        const drawn = Array.from(drawnTilesRef.current.values())
        const previous = Array.from(previousTilesRef.current.values())
        const action: HistoryAction = {
          type: 'draw_tile',
          tiles: drawn,
          previousTiles: previous
        }
        onPushHistory(action)
        if (onTileDraw) onTileDraw(drawn, previous)
      }
      if (erasedTilesRef.current.size > 0) {
        const erased = Array.from(erasedTilesRef.current.values())
        const action: HistoryAction = {
          type: 'erase_tile',
          erased
        }
        onPushHistory(action)
        if (onTileErase) onTileErase(erased)
      }
      isDrawingRef.current = false
      drawnTilesRef.current.clear()
      previousTilesRef.current.clear()
      erasedTilesRef.current.clear()
    }

    if (toolModeRef.current === 'dragging_enemy' && draggingEnemyRef.current) {
      const from = dragStartPosRef.current
      const to = { x: draggingEnemyRef.current.x, y: draggingEnemyRef.current.y }
      const enemyId = draggingEnemyRef.current.id

      if (from.x !== to.x || from.y !== to.y) {
        const newEnemies = enemiesRef.current.map(e =>
          e.id === enemyId ? { ...e, x: to.x, y: to.y } : e
        )
        enemiesRef.current = newEnemies
        onEnemiesChange(newEnemies)

        const action: HistoryAction = {
          type: 'move_enemy',
          enemyId,
          from,
          to
        }
        onPushHistory(action)
        if (onEnemyMove) onEnemyMove(enemyId, from, to)
      }
      draggingEnemyRef.current = null
    }

    if (toolModeRef.current === 'placing_enemy') {
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const screenX = lastMousePosRef.current.x - rect.left
        const screenY = lastMousePosRef.current.y - rect.top
        const world = screenToWorld(screenX, screenY, viewportRef.current)
        const snapped = snapEnemyToGrid(world.x, world.y, viewportRef.current.scale)

        const newEnemy: Enemy = {
          id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          x: snapped.x,
          y: snapped.y
        }
        const newEnemies = [...enemiesRef.current, newEnemy]
        enemiesRef.current = newEnemies
        onEnemiesChange(newEnemies)

        const action: HistoryAction = {
          type: 'place_enemy',
          enemy: newEnemy
        }
        onPushHistory(action)
        if (onEnemyPlace) onEnemyPlace(newEnemy)
      }
    }

    toolModeRef.current = 'idle'
  }, [onPushHistory, onTilesChange, onEnemiesChange, onTileDraw, onTileErase, onEnemyPlace, onEnemyMove, screenToWorld, snapEnemyToGrid])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const world = screenToWorld(screenX, screenY, viewportRef.current)

    const hitEnemy = findEnemyAt(world.x, world.y, enemiesRef.current, viewportRef.current.scale)
    if (hitEnemy) {
      showEnemyMenuRef.current = { x: e.clientX, y: e.clientY, enemyId: hitEnemy.id }
      setEnemyMenu({ x: e.clientX, y: e.clientY, enemyId: hitEnemy.id })
      selectedEnemyRef.current = hitEnemy.id
    } else {
      showEnemyMenuRef.current = null
      setEnemyMenu(null)
      selectedEnemyRef.current = null
    }
  }, [screenToWorld, findEnemyAt])

  const handleDeleteEnemy = useCallback((enemyId: string) => {
    const enemy = enemiesRef.current.find(e => e.id === enemyId)
    if (enemy) {
      const newEnemies = enemiesRef.current.filter(e => e.id !== enemyId)
      enemiesRef.current = newEnemies
      onEnemiesChange(newEnemies)

      const action: HistoryAction = {
        type: 'delete_enemy',
        enemy
      }
      onPushHistory(action)
      if (onEnemyDelete) onEnemyDelete(enemy)
    }
    showEnemyMenuRef.current = null
    setEnemyMenu(null)
    selectedEnemyRef.current = null
  }, [onEnemiesChange, onPushHistory, onEnemyDelete])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const vp = viewportRef.current
    const worldBefore = screenToWorld(mouseX, mouseY, vp)

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    let newScale = vp.scale * zoomFactor
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))

    if (newScale === vp.scale) return

    const newViewport = { ...vp, scale: newScale }
    const worldAfter = screenToWorld(mouseX, mouseY, newViewport)

    newViewport.offsetX += (worldAfter.x - worldBefore.x) * newScale
    newViewport.offsetY += (worldAfter.y - worldBefore.y) * newScale

    viewportRef.current = newViewport
    onViewportChange(newViewport)
  }, [onViewportChange, screenToWorld])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) {
      isSpacePressedRef.current = true
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      isSpacePressedRef.current = false
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showEnemyMenuRef.current) {
        const menuEl = document.getElementById('enemy-context-menu')
        if (menuEl && !menuEl.contains(e.target as Node)) {
          showEnemyMenuRef.current = null
          setEnemyMenu(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: isSpacePressedRef.current || currentTool === 'hand' ? 'grab' : 'crosshair'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />
      {enemyMenu && (
        <div
          id="enemy-context-menu"
          style={{
            position: 'fixed',
            left: enemyMenu.x,
            top: enemyMenu.y,
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            padding: '4px 0',
            zIndex: 1000,
            minWidth: '100px'
          }}
        >
          <button
            onClick={() => handleDeleteEnemy(enemyMenu.enemyId)}
            style={{
              width: '100%',
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#334155',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            删除敌人
          </button>
        </div>
      )}
    </div>
  )
}
