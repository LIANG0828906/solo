import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Cell, Ship, GRID_SIZE, CELL_SIZE, Position, ShipType } from '../types';

interface BattleGridProps {
  side: 'player' | 'ai';
  title: string;
}

const CellComponent = memo(function CellComponent({
  cell,
  ship,
  side,
  isPreview,
  previewValid,
  onClick,
  onHover,
  onLeave,
}: {
  cell: Cell;
  ship?: Ship;
  side: 'player' | 'ai';
  isPreview?: boolean;
  previewValid?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
}) {
  const isPlayerSide = side === 'player';

  const getCellStyle = () => {
    let bg = '#E0F7FA';
    let border = '1px solid #34495E';

    if (isPlayerSide && cell.hasShip && ship && ship.isPlaced) {
      bg = ship.color;
      if (cell.isHit) {
        bg = '#C0392B';
      }
    }

    if (!isPlayerSide && cell.isHit && cell.hasShip) {
      bg = '#E67E22';
    }

    if (cell.isMiss) {
      bg = isPlayerSide ? '#85C1E9' : '#B0BEC5';
    }

    if (isPreview) {
      bg = previewValid ? 'rgba(255, 255, 255, 0.5)' : 'rgba(231, 76, 60, 0.5)';
      border = previewValid ? '2px dashed white' : '2px dashed #E74C3C';
    }

    return { bg, border };
  };

  const style = getCellStyle();

  return (
    <motion.div
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        backgroundColor: style.bg,
        border: style.border,
        boxSizing: 'border-box',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      whileHover={onClick ? { scale: 1.05, boxShadow: '0 4px 8px rgba(0,0,0,0.3)' } : {}}
      transition={{ duration: 0.15 }}
    >
      {cell.isHit && cell.hasShip && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.3, times: [0, 0.5, 1] }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            backgroundColor: isPlayerSide ? '#E74C3C' : '#E67E22',
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 10px ${isPlayerSide ? '#E74C3C' : '#E67E22'}`,
          }}
        />
      )}
      {cell.isMiss && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '20%',
            height: '20%',
            borderRadius: '50%',
            backgroundColor: isPlayerSide ? '#5DADE2' : '#90A4AE',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      {cell.isHit && cell.hasShip && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 40 40">
            <line x1="5" y1="5" x2="35" y2="35" stroke="#1a1a1a" strokeWidth="1.5" />
            <line x1="35" y1="5" x2="5" y2="35" stroke="#1a1a1a" strokeWidth="1.5" />
            <line x1="20" y1="2" x2="20" y2="38" stroke="#1a1a1a" strokeWidth="1" />
            <line x1="2" y1="20" x2="38" y2="20" stroke="#1a1a1a" strokeWidth="1" />
          </svg>
        </div>
      )}
    </motion.div>
  );
});

const BattleGrid = memo(function BattleGrid({ side, title }: BattleGridProps) {
  const grid = useGameStore((state) => (side === 'player' ? state.playerGrid : state.aiGrid));
  const ships = useGameStore((state) => (side === 'player' ? state.playerShips : state.aiShips));
  const phase = useGameStore((state) => state.phase);
  const turn = useGameStore((state) => state.turn);
  const selectedShip = useGameStore((state) => state.selectedShip);
  const placementDirection = useGameStore((state) => state.placementDirection);
  const playerAttack = useGameStore((state) => state.playerAttack);
  const hitAnimation = useGameStore((state) => state.hitAnimation);

  const [hoverPos, setHoverPos] = useState<Position | null>(null);

  const isPlayerSide = side === 'player';
  const canPlace = isPlayerSide && phase === 'placement' && selectedShip;
  const canAttack = !isPlayerSide && phase === 'battle' && turn === 'player';

  const shipMap = useMemo(() => {
    const map = new Map<string, Ship>();
    ships.forEach((s) => map.set(s.id, s));
    return map;
  }, [ships]);

  const selectedShipConfig = useMemo(() => {
    if (!selectedShip) return null;
    return ships.find((s) => s.type === selectedShip) || null;
  }, [selectedShip, ships]);

  const previewPositions = useMemo(() => {
    if (!canPlace || !hoverPos || !selectedShipConfig) return null;

    const positions: Position[] = [];
    const length = selectedShipConfig.length;

    for (let i = 0; i < length; i++) {
      const x = placementDirection === 'horizontal' ? hoverPos.x + i : hoverPos.x;
      const y = placementDirection === 'vertical' ? hoverPos.y + i : hoverPos.y;
      positions.push({ x, y });
    }

    return positions;
  }, [canPlace, hoverPos, selectedShipConfig, placementDirection]);

  const previewValid = useMemo(() => {
    if (!previewPositions) return false;
    return previewPositions.every(
      (pos) =>
        pos.x >= 0 &&
        pos.x < GRID_SIZE &&
        pos.y >= 0 &&
        pos.y < GRID_SIZE &&
        !grid[pos.y][pos.x].hasShip
    );
  }, [previewPositions, grid]);

  const handleCellClick = (x: number, y: number) => {
    if (canPlace && previewValid) {
      useGameStore.getState().placeShip(x, y);
      setHoverPos(null);
    } else if (canAttack) {
      if (!grid[y][x].isHit && !grid[y][x].isMiss) {
        playerAttack(x, y);
      }
    }
  };

  const handleCellHover = (x: number, y: number) => {
    if (canPlace) {
      setHoverPos({ x, y });
    }
  };

  const handleGridLeave = () => {
    setHoverPos(null);
  };

  const isPreviewCell = (x: number, y: number) => {
    if (!previewPositions) return false;
    return previewPositions.some((p) => p.x === x && p.y === y);
  };

  const getShipForCell = (cell: Cell): Ship | undefined => {
    if (!cell.shipId) return undefined;
    return shipMap.get(cell.shipId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#ECF0F1',
          fontFamily: 'monospace',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {title}
      </div>
      <motion.div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          border: '2px solid #34495E',
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          backgroundColor: '#34495E',
        }}
        onMouseLeave={handleGridLeave}
        animate={
          hitAnimation &&
          ((side === 'player' && hitAnimation.side === 'player') ||
            (side === 'ai' && hitAnimation.side === 'ai'))
            ? { x: [0, -3, 3, -2, 2, 0] }
            : {}
        }
        transition={{ duration: 0.2 }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <CellComponent
              key={`${x}-${y}`}
              cell={cell}
              ship={getShipForCell(cell)}
              side={side}
              isPreview={isPreviewCell(x, y)}
              previewValid={previewValid}
              onClick={
                canPlace || canAttack
                  ? () => handleCellClick(x, y)
                  : undefined
              }
              onHover={canPlace ? () => handleCellHover(x, y) : undefined}
              onLeave={canPlace ? handleGridLeave : undefined}
            />
          ))
        )}
      </motion.div>
    </div>
  );
});

export default BattleGrid;
