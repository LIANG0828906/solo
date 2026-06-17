import React, { useCallback, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import type { CellType, Hero, Monster, Position } from '@/types'

interface CellProps {
  type: CellType
  x: number
  y: number
  hero: Hero | undefined
  monster: Monster | undefined
  isSelected: boolean
  onClick: (x: number, y: number) => void
}

const Cell = React.memo<CellProps>(({ type, x, y, hero, monster, isSelected, onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 100)
    onClick(x, y)
  }, [x, y, onClick])

  const getCellStyle = (): string => {
    const baseStyle = 'w-[30px] h-[30px] flex items-center justify-center relative transition-all duration-150 border border-[var(--cell-border)]'
    
    switch (type) {
      case 'wall':
        return `${baseStyle} bg-[var(--wall-bg)]`
      case 'floor':
        return `${baseStyle} bg-[var(--floor-bg)]`
      case 'treasure':
        return `${baseStyle} bg-[var(--floor-bg)]`
      case 'exit':
        return `${baseStyle} bg-[var(--floor-bg)]`
      default:
        return baseStyle
    }
  }

  return (
    <div
      className={`${getCellStyle()} ${isAnimating ? 'animate-click-pulse' : ''} cursor-pointer hover:brightness-110`}
      onClick={handleClick}
    >
      {type === 'treasure' && (
        <div className="absolute w-4 h-4 bg-[var(--treasure-color)] rounded-sm transform rotate-45" />
      )}
      
      {type === 'exit' && (
        <div className="absolute inset-1 bg-[var(--exit-color)] rounded-sm opacity-80" />
      )}

      {hero && (
        <div
          className={`absolute w-[24px] h-[24px] rounded-full bg-[var(--hero-color)] animate-hero-glow ${
            isSelected ? 'ring-2 ring-[var(--selected-border)] ring-offset-1 ring-offset-transparent' : ''
          }`}
        />
      )}

      {monster && (
        <div
          className={`absolute w-[22px] h-[22px] bg-[var(--monster-color)] animate-monster-pulse ${
            isSelected ? 'ring-2 ring-[var(--selected-border)] ring-offset-1 ring-offset-transparent' : ''
          }`}
        />
      )}
    </div>
  )
})

Cell.displayName = 'Cell'

export const GameBoard: React.FC = () => {
  const { maze, heroes, monsters, selectedHeroId, selectHero, moveHero, attackMonster } = useGameStore()

  const getHeroAt = useCallback((x: number, y: number): Hero | undefined => {
    return heroes.find((h) => h.position.x === x && h.position.y === y)
  }, [heroes])

  const getMonsterAt = useCallback((x: number, y: number): Monster | undefined => {
    return monsters.find((m) => m.position.x === x && m.position.y === y)
  }, [monsters])

  const isAdjacent = useCallback((pos1: Position, pos2: Position): boolean => {
    const dx = Math.abs(pos1.x - pos2.x)
    const dy = Math.abs(pos1.y - pos2.y)
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)
  }, [])

  const handleCellClick = useCallback((x: number, y: number) => {
    const hero = getHeroAt(x, y)
    const monster = getMonsterAt(x, y)
    const cellType = maze[y]?.[x]

    if (hero) {
      selectHero(hero.id)
      return
    }

    if (selectedHeroId) {
      const selectedHero = heroes.find((h) => h.id === selectedHeroId)
      if (!selectedHero) return

      if (monster && isAdjacent(selectedHero.position, { x, y })) {
        attackMonster(selectedHeroId, monster.id)
        return
      }

      if (cellType === 'floor' || cellType === 'treasure' || cellType === 'exit') {
        if (isAdjacent(selectedHero.position, { x, y }) && !getHeroAt(x, y) && !getMonsterAt(x, y)) {
          moveHero(selectedHeroId, { x, y })
        }
      }
    }
  }, [maze, heroes, selectedHeroId, getHeroAt, getMonsterAt, isAdjacent, selectHero, moveHero, attackMonster])

  return (
    <div className="game-board inline-block border-2 border-[var(--cell-border)] rounded overflow-hidden shadow-2xl">
      {maze.map((row, y) => (
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
                onClick={handleCellClick}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default GameBoard
