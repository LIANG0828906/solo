import React, { useCallback, useMemo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { gameEngine } from '@/engine/GameEngine'
import type { CellType, Hero, Monster, Position, AnimationEffect } from '@/types'

interface CellProps {
  type: CellType
  x: number
  y: number
  hero: Hero | undefined
  monster: Monster | undefined
  isSelected: boolean
  effects: AnimationEffect[]
  onClick: (x: number, y: number) => void
}

const Cell = React.memo<CellProps>(({ type, x, y, hero, monster, isSelected, effects, onClick }) => {
  const [isClickAnimating, setIsClickAnimating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = useCallback(() => {
    setIsClickAnimating(true)
    setTimeout(() => setIsClickAnimating(false), 100)
    onClick(x, y)
  }, [x, y, onClick])

  const attackEffect = effects.find(
    (e) => e.type === 'attack' && e.position.x === x && e.position.y === y
  )
  const damageEffect = effects.find(
    (e) => e.type === 'damage' && e.position.x === x && e.position.y === y
  )
  const itemEffect = effects.find(
    (e) => e.type === 'item' && e.position.x === x && e.position.y === y
  )

  const getCellBg = () => {
    switch (type) {
      case 'wall':
        return 'bg-[var(--wall-bg)]'
      case 'floor':
        return 'bg-[var(--floor-bg)]'
      case 'treasure':
        return 'bg-[var(--floor-bg)]'
      case 'exit':
        return 'bg-[var(--floor-bg)]'
      default:
        return 'bg-[var(--floor-bg)]'
    }
  }

  return (
    <div
      className={`w-[30px] h-[30px] flex items-center justify-center relative border border-[var(--cell-border)] ${getCellBg()} ${isClickAnimating ? 'animate-cell-pulse' : ''} ${isHovered && (hero || monster || type === 'treasure') ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {type === 'treasure' && (
        <div className="absolute w-4 h-4 bg-[var(--treasure-color)] rounded-sm transform rotate-45 animate-treasure-glow" />
      )}

      {type === 'exit' && (
        <div className="absolute inset-1 bg-gradient-to-br from-[var(--exit-color)] to-[#2ECC71] rounded-sm opacity-80 animate-exit-pulse" />
      )}

      {hero && hero.hp > 0 && (
        <div className="relative flex items-center justify-center">
          {isSelected && (
            <div className="absolute w-[34px] h-[34px] rounded-full border-2 border-[var(--selected-border)] animate-selected-glow" />
          )}
          {isHovered && !isSelected && (
            <div className="absolute w-[35px] h-[35px] rounded-full border-2 border-white/20" />
          )}
          <div
            className={`w-[24px] h-[24px] rounded-full bg-[var(--hero-color)] animate-hero-glow transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}
          />
        </div>
      )}

      {monster && monster.hp > 0 && (
        <div className="relative flex items-center justify-center">
          {isSelected && (
            <div className="absolute w-[34px] h-[34px] border-2 border-[var(--selected-border)] animate-selected-glow" />
          )}
          {isHovered && !isSelected && (
            <div className="absolute w-[35px] h-[35px] border-2 border-white/20" />
          )}
          <div
            className={`w-[22px] h-[22px] bg-[var(--monster-color)] animate-monster-pulse transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}
          />
        </div>
      )}

      {attackEffect && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white/60 animate-attack-flash" />
        </div>
      )}

      {damageEffect && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-red-500/50 animate-attack-flash" />
        </div>
      )}

      {itemEffect && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-item-particle"
              style={{
                '--angle': `${i * 60}deg`,
                backgroundColor: ['#F1C40F', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#E67E22'][i],
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  )
})

Cell.displayName = 'Cell'

export const GameBoard = React.memo(() => {
  const { maze, heroes, monsters, selectedHeroId, selectHero } = useGameStore()

  const getHeroAt = useCallback(
    (x: number, y: number): Hero | undefined => {
      return heroes.find((h) => h.position.x === x && h.position.y === y && h.hp > 0)
    },
    [heroes]
  )

  const getMonsterAt = useCallback(
    (x: number, y: number): Monster | undefined => {
      return monsters.find((m) => m.position.x === x && m.position.y === y && m.hp > 0)
    },
    [monsters]
  )

  const isAdjacent = useCallback((pos1: Position, pos2: Position): boolean => {
    const dx = Math.abs(pos1.x - pos2.x)
    const dy = Math.abs(pos1.y - pos2.y)
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)
  }, [])

  const effects = useGameStore((state) => state.animationEffects)

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      const hero = getHeroAt(x, y)
      const monster = getMonsterAt(x, y)
      const cellType = maze[y]?.[x]

      if (hero) {
        selectHero(hero.id)
        return
      }

      if (selectedHeroId) {
        const selectedHero = heroes.find((h) => h.id === selectedHeroId)
        if (!selectedHero || selectedHero.hp <= 0) return

        if (monster && isAdjacent(selectedHero.position, { x, y })) {
          gameEngine.requestAttack(selectedHeroId, monster.id)
          return
        }

        if (cellType === 'floor' || cellType === 'treasure' || cellType === 'exit') {
          if (isAdjacent(selectedHero.position, { x, y }) && !getHeroAt(x, y) && !getMonsterAt(x, y)) {
            gameEngine.requestHeroMove(selectedHeroId, { x, y })
          }
        }
      }
    },
    [maze, heroes, selectedHeroId, getHeroAt, getMonsterAt, isAdjacent, selectHero]
  )

  const rows = useMemo(() => {
    return maze.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => {
          const hero = getHeroAt(x, y)
          const monster = getMonsterAt(x, y)
          const isSelected = !!(hero && hero.id === selectedHeroId) || !!(monster && monster.id === selectedHeroId)

          return (
            <Cell
              key={`${x}-${y}`}
              type={cell}
              x={x}
              y={y}
              hero={hero}
              monster={monster}
              isSelected={isSelected}
              effects={effects}
              onClick={handleCellClick}
            />
          )
        })}
      </div>
    ))
  }, [maze, getHeroAt, getMonsterAt, selectedHeroId, effects, handleCellClick])

  return (
    <div className="game-board-wrapper inline-block border-2 border-[var(--cell-border)] rounded overflow-hidden shadow-2xl">
      <div className="game-board">{rows}</div>
    </div>
  )
})

GameBoard.displayName = 'GameBoard'

export default GameBoard
