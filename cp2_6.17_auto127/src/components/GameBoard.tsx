import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { COLOR_HEX } from '../types';
import type { Tile as TileType } from '../types';
import IconComponent from './Icon';

const BoardTile: React.FC<{ tile: TileType }> = ({ tile }) => {
  const selectTile = useGameStore((s) => s.selectTile);

  const handleClick = () => {
    selectTile(tile.id);
  };

  return (
    <div
      className={`tile ${tile.state}`}
      style={{ backgroundColor: COLOR_HEX[tile.color] }}
      onClick={handleClick}
    >
      <div className="tile-icon">
        <IconComponent type={tile.icon} color="rgba(255,255,255,0.95)" />
      </div>
    </div>
  );
};

export const GameBoard: React.FC = () => {
  const tiles = useGameStore((s) => s.tiles);
  const shakeTrigger = useGameStore((s) => s.shakeTrigger);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (shakeTrigger > 0) {
      setShakeKey((k) => k + 1);
    }
  }, [shakeTrigger]);

  const sortedTiles = [...tiles].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  return (
    <div
      className={`game-board-wrapper ${shakeKey > 0 ? 'shake' : ''}`}
      key={shakeKey}
    >
      <div className="game-board">
        {sortedTiles.map((tile) => (
          <BoardTile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
