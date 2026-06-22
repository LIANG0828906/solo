import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { GridRenderer } from '../canvas/GridRenderer'
import { PhysicsEngine } from '../physics/PhysicsEngine'
import type { PlayerState, GameObject } from '../types'

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<GridRenderer | null>(null)
  const physicsRef = useRef<PhysicsEngine | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const dragObjectRef = useRef<string | null>(null)
  const lastHoverCellRef = useRef<{ col: number; row: number } | null>(null)

  const [playerState, setPlayerState] = useState<PlayerState | null>(null)
  const [collectedCoins, setCollectedCoins] = useState<string[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null)

  const grid = useGameStore((state) => state.grid)
  const objects = useGameStore((state) => state.objects)
  const terrainTheme = useGameStore((state) => state.terrainTheme)
  const selectedTool = useGameStore((state) => state.selectedTool)
  const selectedObjectId = useGameStore((state) => state.selectedObjectId)
  const isPlaying = useGameStore((state) => state.isPlaying)
  const gridCols = useGameStore((state) => state.gridCols)
  const gridRows = useGameStore((state) => state.gridRows)
  const toggleCell = useGameStore((state) => state.toggleCell)
  const addObject = useGameStore((state) => state.addObject)
  const removeObject = useGameStore((state) => state.removeObject)
  const moveObject = useGameStore((state) => state.moveObject)
  const selectObject = useGameStore((state) => state.selectObject)
  const fillRow = useGameStore((state) => state.fillRow)
  const clearColumn = useGameStore((state) => state.clearColumn)
  const setPlaying = useGameStore((state) => state.setPlaying)

  useEffect(() => {
    if (!canvasRef.current) return

    const renderer = new GridRenderer(canvasRef.current)
    renderer.setGridSize(gridCols, gridRows)
    rendererRef.current = renderer

    const physics = new PhysicsEngine()
    physicsRef.current = physics

    const resize = () => {
      if (!containerRef.current || !rendererRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const padding = 40
      const maxCellWidth = (rect.width - padding * 2) / gridCols
      const maxCellHeight = (rect.height - padding * 2) / gridRows
      const cellSize = Math.floor(Math.min(maxCellWidth, maxCellHeight, 64))

      rendererRef.current?.resize(rect.width, rect.height)
      rendererRef.current?.setCellSize(Math.max(20, cellSize))
      rendererRef.current?.recalculateOffset()
      physicsRef.current?.setCellSize(Math.max(20, cellSize))
    }

    resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gridCols, gridRows])

  useEffect(() => {
    if (!rendererRef.current) return
    rendererRef.current.setGridSize(gridCols, gridRows)

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const padding = 40
      const maxCellWidth = (rect.width - padding * 2) / gridCols
      const maxCellHeight = (rect.height - padding * 2) / gridRows
      const cellSize = Math.floor(Math.min(maxCellWidth, maxCellHeight, 64))
      rendererRef.current.setCellSize(Math.max(20, cellSize))
      rendererRef.current.resize(rect.width, rect.height)
      rendererRef.current.recalculateOffset()
      if (physicsRef.current) {
        physicsRef.current.setCellSize(Math.max(20, cellSize))
      }
    }
  }, [gridCols, gridRows])

  const renderLoop = useCallback(() => {
    if (!rendererRef.current) return

    rendererRef.current.drawFrame(
      grid,
      objects,
      terrainTheme,
      selectedObjectId,
      selectedTool,
      hoverCell,
      isPlaying,
      playerState,
      collectedCoins,
      physicsRef.current
    )

    animationFrameRef.current = requestAnimationFrame(renderLoop)
  }, [grid, objects, terrainTheme, selectedObjectId, selectedTool, hoverCell, isPlaying, playerState, collectedCoins])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderLoop)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [renderLoop])

  useEffect(() => {
    if (!physicsRef.current) return

    const physics = physicsRef.current
    physics.setGrid(grid, gridCols, gridRows)
    physics.setObjects(objects)

    if (isPlaying) {
      const playerObj = objects.find((o) => o.type === 'player')
      if (playerObj) {
        physics.resetPlayer(playerObj.gridX, playerObj.gridY)
      } else {
        physics.resetPlayer(1, gridRows - 2)
      }
      setGameOver(false)
      setCollectedCoins([])

      physics.setOnUpdate((player, coins) => {
        setPlayerState({ ...player })
        setCollectedCoins(coins)
        if (physics.isGameOver()) {
          setGameOver(true)
        }
      })

      physics.start()
    } else {
      physics.stop()
      setPlayerState(null)
      setCollectedCoins([])
    }

    return () => {
      physics.stop()
    }
  }, [isPlaying, grid, objects, gridCols, gridRows])

  useEffect(() => {
    if (!isPlaying) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!physicsRef.current) return
      const input = {
        left: e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A',
        right: e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D',
        jump: e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ',
      }
      const currentInput = getCurrentInput()
      physicsRef.current.setInput({
        left: currentInput.left || input.left,
        right: currentInput.right || input.right,
        jump: currentInput.jump || input.jump,
      })
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!physicsRef.current) return
      const input = {
        left: !(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'),
        right: !(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'),
        jump: !(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' '),
      }
      const currentInput = getCurrentInput()
      physicsRef.current.setInput({
        left: currentInput.left && input.left,
        right: currentInput.right && input.right,
        jump: currentInput.jump && input.jump,
      })
    }

    const pressedKeys: Record<string, boolean> = {}

    function getCurrentInput() {
      return {
        left: !!(pressedKeys['ArrowLeft'] || pressedKeys['a'] || pressedKeys['A']),
        right: !!(pressedKeys['ArrowRight'] || pressedKeys['d'] || pressedKeys['D']),
        jump: !!(pressedKeys['ArrowUp'] || pressedKeys['w'] || pressedKeys['W'] || pressedKeys[' ']),
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      pressedKeys[e.key] = true
      handleKeyDown(e)
    }

    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeys[e.key] = false
      handleKeyUp(e)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [isPlaying])

  useEffect(() => {
    if (isPlaying) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        if (lastHoverCellRef.current) {
          fillRow(lastHoverCellRef.current.row)
        }
      }
      if (e.key === 'd' || e.key === 'D') {
        if (lastHoverCellRef.current) {
          clearColumn(lastHoverCellRef.current.col)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, fillRow, clearColumn])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !rendererRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return rendererRef.current.screenToGrid(x, y)
  }

  const findObjectAtCell = (col: number, row: number): GameObject | undefined => {
    return objects.find((o) => o.gridX === col && o.gridY === row)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getMousePos(e)
    setHoverCell(cell)
    if (cell) {
      lastHoverCellRef.current = cell
    }

    if (isDraggingRef.current && dragObjectRef.current && cell && !isPlaying) {
      const existing = objects.find(
        (o) => o.gridX === cell.col && o.gridY === cell.row && o.id !== dragObjectRef.current
      )
      if (!existing) {
        moveObject(dragObjectRef.current, cell.col, cell.row)
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return
    const cell = getMousePos(e)
    if (!cell) return

    if (e.button === 2) {
      const obj = findObjectAtCell(cell.col, cell.row)
      if (obj) {
        removeObject(obj.id)
      }
      return
    }

    if (selectedTool) {
      const existing = findObjectAtCell(cell.col, cell.row)
      if (!existing) {
        addObject(selectedTool, cell.col, cell.row)
      }
    } else {
      const obj = findObjectAtCell(cell.col, cell.row)
      if (obj) {
        selectObject(obj.id)
        isDraggingRef.current = true
        dragObjectRef.current = obj.id
      } else {
        selectObject(null)
        toggleCell(cell.row, cell.col)
      }
    }
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
    dragObjectRef.current = null
  }

  const handleMouseLeave = () => {
    setHoverCell(null)
    isDraggingRef.current = false
    dragObjectRef.current = null
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const handleRestart = () => {
    if (!physicsRef.current) return
    const playerObj = objects.find((o) => o.type === 'player')
    if (playerObj) {
      physicsRef.current.resetPlayer(playerObj.gridX, playerObj.gridY)
    }
    setGameOver(false)
    setCollectedCoins([])
  }

  const totalCoins = objects.filter((o) => o.type === 'coin').length

  return (
    <div className="canvas-container">
      <div className="top-bar">
        <button
          className={`play-button ${isPlaying ? 'stop' : ''}`}
          onClick={() => setPlaying(!isPlaying)}
          title={isPlaying ? '停止' : '播放'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <polygon points="8,5 19,12 8,19" />
            </svg>
          )}
        </button>
        <button
          className="action-button export"
          onClick={() => {
            const event = new CustomEvent('export-level')
            window.dispatchEvent(event)
          }}
        >
          导出
        </button>
        <button
          className="action-button import"
          onClick={() => {
            const event = new CustomEvent('import-level')
            window.dispatchEvent(event)
          }}
        >
          导入
        </button>
      </div>

      {isPlaying && totalCoins > 0 && (
        <div className="coin-counter">
          <div className="coin-icon" />
          <span>{collectedCoins.length} / {totalCoins}</span>
        </div>
      )}

      <div className="canvas-wrapper" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className={`game-canvas ${selectedTool ? 'object-cursor' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
        />

        {gameOver && (
          <div className="game-over-overlay">
            <h2>游戏结束</h2>
            <button className="restart-button" onClick={handleRestart}>
              重新开始
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameCanvas
