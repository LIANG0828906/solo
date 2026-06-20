import { useEffect } from 'react';
import { useGameStore } from '../gameStore';
import { MAP_SIZE } from '../types';
import type { Direction, Room } from '../types';
import './GameBoard.css';

const getRoomColor = (room: Room): string => {
  switch (room.type) {
    case 'wall':
      return '#4A4A4A';
    case 'corridor':
      return '#3A3A3A';
    case 'start':
    case 'end':
    case 'normal':
    case 'treasure':
    case 'monster':
      return '#2D2D2D';
    default:
      return '#2D2D2D';
  }
};

export function GameBoard() {
  const { map, player, isMoving, battle, gameOver, initGame, movePlayer, restartGame } =
    useGameStore();

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (battle.active || gameOver) return;
      let dir: Direction | null = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dir = 'up';
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dir = 'down';
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dir = 'left';
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dir = 'right';
      if (dir) {
        e.preventDefault();
        movePlayer(dir);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [battle.active, gameOver, movePlayer]);

  if (map.length === 0) {
    return <div className="board-loading">加载中...</div>;
  }

  return (
    <div className="board-wrapper">
      <div
        className="game-board"
        style={{
          gridTemplateColumns: `repeat(${MAP_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${MAP_SIZE}, 1fr)`,
        }}
      >
        {map.map((row) =>
          row.map((room) => {
            const isPlayerHere = player.x === room.x && player.y === room.y;
            return (
              <div
                key={`${room.x}-${room.y}`}
                className={`room room-${room.type} ${room.visited ? 'visited' : ''}`}
                style={{ backgroundColor: getRoomColor(room) }}
              >
                {room.type === 'start' && <div className="start-portal" />}
                {room.type === 'end' && <div className="end-portal" />}
                {room.type === 'treasure' && room.hasTreasure && (
                  <div className="treasure-icon">💰</div>
                )}
                {room.type === 'monster' && room.hasMonster && (
                  <div className="monster-icon">👹</div>
                )}
                {isPlayerHere && (
                  <div
                    className={`player ${isMoving ? 'moving' : ''} ${player.isHit ? 'hit' : ''}`}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>游戏结束</h2>
            <p>你被击败了！</p>
            <button onClick={restartGame}>重新开始</button>
          </div>
        </div>
      )}
    </div>
  );
}
