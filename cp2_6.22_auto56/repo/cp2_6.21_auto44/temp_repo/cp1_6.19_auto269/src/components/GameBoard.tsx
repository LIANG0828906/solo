import { useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'
import { BoardCell } from './BoardCell'
import { ChessUnit } from './ChessUnit'
import { FireBurst } from './effects/FireBurst'
import { IceShard } from './effects/IceShard'
import { Lightning } from './effects/Lightning'
import { ShadowDevour } from './effects/ShadowDevour'
import { isPositionInList, BOARD_SIZE } from '@/engine/Board'
import { getUnitAtPosition } from '@/engine/Unit'

const CELL_SIZE = 64

export function GameBoard() {
  const {
    board,
    units,
    selectedUnitId,
    movablePositions,
    attackablePositions,
    battleEffects,
    currentPlayer,
    selectUnit,
    moveUnit,
    attackUnit,
    clearBattleEffect,
  } = useGameStore()

  const boardRef = useRef<HTMLDivElement>(null)
  const draggedUnitId = useRef<string | null>(null)

  const handleCellClick = useCallback((x: number, y: number) => {
    const unitAtPosition = getUnitAtPosition(units, x, y)

    if (selectedUnitId) {
      const selectedUnit = units.find(u => u.id === selectedUnitId)
      if (!selectedUnit) return

      if (unitAtPosition && unitAtPosition.faction !== currentPlayer) {
        const isAttackable = isPositionInList(attackablePositions, x, y)
        if (isAttackable) {
          attackUnit(selectedUnitId, unitAtPosition.id)
          return
        }
      }

      if (isPositionInList(movablePositions, x, y) && !unitAtPosition) {
        moveUnit(selectedUnitId, x, y)
        return
      }

      if (unitAtPosition && unitAtPosition.faction === currentPlayer) {
        selectUnit(unitAtPosition.id)
        return
      }

      selectUnit(null)
    } else if (unitAtPosition && unitAtPosition.faction === currentPlayer) {
      selectUnit(unitAtPosition.id)
    }
  }, [selectedUnitId, units, currentPlayer, movablePositions, attackablePositions, selectUnit, moveUnit, attackUnit])

  const handleUnitClick = useCallback((unitId: string) => {
    const unit = units.find(u => u.id === unitId)
    if (!unit) return

    if (selectedUnitId && unit.faction !== currentPlayer) {
      const isAttackable = isPositionInList(attackablePositions, unit.x, unit.y)
      if (isAttackable) {
        attackUnit(selectedUnitId, unitId)
        return
      }
    }

    if (unit.faction === currentPlayer) {
      selectUnit(unitId)
    }
  }, [selectedUnitId, units, currentPlayer, attackablePositions, selectUnit, attackUnit])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!boardRef.current || !draggedUnitId.current) return

    const rect = boardRef.current.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE)
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE)

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
      handleCellClick(x, y)
    }

    draggedUnitId.current = null
  }, [handleCellClick])

  const handleDragStart = useCallback((unitId: string) => {
    draggedUnitId.current = unitId
  }, [])

  const handleDragEnd = useCallback(() => {
    draggedUnitId.current = null
  }, [])

  const renderEffect = (effect: typeof battleEffects[0]) => {
    const handleComplete = () => clearBattleEffect(effect.id)

    switch (effect.type) {
      case 'fire_burst':
        return <FireBurst key={effect.id} x={effect.x} y={effect.y} cellSize={CELL_SIZE} onComplete={handleComplete} />
      case 'ice_shard':
        return <IceShard key={effect.id} x={effect.x} y={effect.y} cellSize={CELL_SIZE} onComplete={handleComplete} />
      case 'lightning':
        return <Lightning key={effect.id} x={effect.x} y={effect.y} targetX={effect.targetX} targetY={effect.targetY} cellSize={CELL_SIZE} onComplete={handleComplete} />
      case 'shadow_devour':
        return <ShadowDevour key={effect.id} x={effect.x} y={effect.y} cellSize={CELL_SIZE} onComplete={handleComplete} />
      case 'damage_number':
        return (
          <motion.div
            key={effect.id}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              fontWeight: 700,
              fontSize: '1.25rem',
              left: effect.x * CELL_SIZE + CELL_SIZE / 2,
              top: effect.y * CELL_SIZE,
              color: effect.damage! > 0 ? '#FF5252' : '#4CAF50',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              zIndex: 200,
            }}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -40, opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            onAnimationComplete={handleComplete}
          >
            {effect.damage! > 0 ? `-${effect.damage}` : `+${Math.abs(effect.damage!)}`}
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div
        ref={boardRef}
        style={{
          position: 'relative',
          width: BOARD_SIZE * CELL_SIZE,
          height: BOARD_SIZE * CELL_SIZE,
          boxShadow: '0 0 40px rgba(201, 169, 110, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.5)',
          border: '3px solid #C9A96E',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)` }}>
          {board.cells.map((row, y) =>
            row.map((cell, x) => {
              const unitAtCell = getUnitAtPosition(units, x, y)
              return (
                <BoardCell
                  key={`${x}-${y}`}
                  cell={cell}
                  size={CELL_SIZE}
                  isMovable={isPositionInList(movablePositions, x, y)}
                  isAttackable={isPositionInList(attackablePositions, x, y)}
                  isSelected={selectedUnitId !== null && unitAtCell?.id === selectedUnitId}
                  hasUnit={!!unitAtCell}
                  onClick={() => handleCellClick(x, y)}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                />
              )
            })
          )}
        </div>

        <AnimatePresence>
          {units.filter(u => u.isAlive).map(unit => (
            <ChessUnit
              key={unit.id}
              unit={unit}
              cellSize={CELL_SIZE}
              isSelected={selectedUnitId === unit.id}
              onClick={() => handleUnitClick(unit.id)}
              onDragStart={() => handleDragStart(unit.id)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </AnimatePresence>

        {battleEffects.map(renderEffect)}
      </div>
    </div>
  )
}
