import { useGameStore } from './store'
import { Position } from './gameEngine'

interface CellProps {
  x: number
  y: number
  isPlayer: boolean
  cellType: string
  onClick: () => void
}

function MapCell({ x, y, isPlayer, cellType, onClick }: CellProps) {
  const renderIcon = () => {
    if (isPlayer) {
      return <div className="icon player-icon">⚔</div>
    }

    switch (cellType) {
      case 'enemy':
        return <div className="icon enemy-icon">☠</div>
      case 'chest':
        return <div className="icon chest-icon">💰</div>
      case 'trap':
        return <div className="icon trap-icon">⏳</div>
      case 'exit':
        return <div className="icon exit-icon">↑</div>
      default:
        return null
    }
  }

  return (
    <div
      className={`map-cell cell-${x}-${y}`}
      onClick={onClick}
    >
      {renderIcon()}
    </div>
  )
}

function GameMap() {
  const { dungeonGrid, playerPos, handleCellClick } = useGameStore()

  const handleCellClickCallback = (pos: Position) => {
    handleCellClick(pos)
  }

  return (
    <div className="game-map-container">
      <div className="game-map">
        {dungeonGrid.map((row, y) =>
          row.map((cell, x) => (
            <MapCell
              key={`${x}-${y}`}
              x={x}
              y={y}
              isPlayer={playerPos.x === x && playerPos.y === y}
              cellType={cell.type}
              onClick={() => handleCellClickCallback({ x, y })}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default GameMap
