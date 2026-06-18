import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useGameStore, createEmptyGrid } from '@/store/GameStore';
import {
  GRID_SIZE,
  SHIP_DEFINITIONS,
  Ship,
  Orientation,
  CellState,
} from '@/types';
import {
  validatePlacement,
  placeShip,
  getShipSize,
} from '@/modules/game/GameLogic';
import { eventBus } from '@/modules/EventBus';

const ShipSelector: React.FC = () => {
  const playerShips = useGameStore((s) => s.playerShips);
  const selectedShip = useGameStore((s) => s.selectedShip);
  const shipOrientation = useGameStore((s) => s.shipOrientation);
  const phase = useGameStore((s) => s.phase);

  const handleSelect = (type: string) => {
    const state = useGameStore.getState();
    if (state.selectedShip === type) {
      useGameStore.setState({ selectedShip: null });
    } else {
      useGameStore.setState({ selectedShip: type, shipOrientation: 'horizontal' });
    }
  };

  if (phase !== 'deploy') return null;

  return (
    <div className="ship-selector">
      <div className="ship-selector-title">选择舰艇</div>
      <div className="ship-selector-hint">R键旋转 | 点击放置</div>
      {SHIP_DEFINITIONS.map((def) => {
        const placed = playerShips.find((s) => s.type === def.type);
        const isSelected = selectedShip === def.type;
        return (
          <div
            key={def.type}
            className={`ship-option ${isSelected ? 'selected' : ''} ${placed ? 'placed' : ''}`}
            onClick={() => !placed && handleSelect(def.type)}
          >
            <div className="ship-option-icon" style={{ color: def.color }}>
              {'▮'.repeat(def.size)}
            </div>
            <div className="ship-option-label">{def.label}</div>
            <div className="ship-option-status">
              {placed ? '✓' : `${def.size}格`}
            </div>
          </div>
        );
      })}
      {selectedShip && (
        <div className="ship-orientation">
          方向: {shipOrientation === 'horizontal' ? '→ 横向' : '↓ 纵向'}
        </div>
      )}
    </div>
  );
};

const GridCell: React.FC<{
  row: number;
  col: number;
  state: CellState;
  isOpponent: boolean;
  shipColor?: string;
  isHoverPreview: boolean;
  isInvalidPreview: boolean;
  isSinking: boolean;
  isAttackPending: boolean;
  isLastAttack: boolean;
  lastAttackResult: 'hit' | 'miss' | null;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = React.memo(
  ({
    row,
    col,
    state,
    isOpponent,
    shipColor,
    isHoverPreview,
    isInvalidPreview,
    isSinking,
    isAttackPending,
    isLastAttack,
    lastAttackResult,
    onClick,
    onMouseEnter,
    onMouseLeave,
  }) => {
    let cellClass = 'grid-cell';
    if (state === 'ship') cellClass += ' cell-ship';
    if (state === 'hit') cellClass += ' cell-hit';
    if (state === 'miss') cellClass += ' cell-miss';
    if (state === 'sunk') cellClass += ' cell-sunk';
    if (isHoverPreview) cellClass += ' cell-preview';
    if (isInvalidPreview) cellClass += ' cell-invalid';
    if (isSinking) cellClass += ' cell-sinking';
    if (isAttackPending) cellClass += ' cell-pending';
    if (isLastAttack && lastAttackResult === 'hit') cellClass += ' cell-explosion';
    if (isLastAttack && lastAttackResult === 'miss') cellClass += ' cell-splash';

    const isIntersection =
      row < GRID_SIZE - 1 && col < GRID_SIZE - 1;

    return (
      <div
        className={cellClass}
        style={shipColor && state === 'ship' ? { '--ship-color': shipColor } as React.CSSProperties : undefined}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-row={row}
        data-col={col}
      >
        {state === 'ship' && shipColor && (
          <div className="ship-block" style={{ background: shipColor }} />
        )}
        {state === 'hit' && <div className="hit-marker" />}
        {state === 'miss' && <div className="miss-marker" />}
        {state === 'sunk' && <div className="sunk-marker" />}
        {isHoverPreview && !isInvalidPreview && (
          <div className="preview-marker" />
        )}
        {isInvalidPreview && <div className="invalid-marker" />}
        {isAttackPending && <div className="pending-spinner" />}
        {isLastAttack && lastAttackResult === 'hit' && (
          <div className="pixel-explosion">
            <div className="px-particle p1" />
            <div className="px-particle p2" />
            <div className="px-particle p3" />
            <div className="px-particle p4" />
            <div className="px-particle p5" />
            <div className="px-core" />
          </div>
        )}
        {isLastAttack && lastAttackResult === 'miss' && (
          <div className="pixel-splash">
            <div className="px-drop d1" />
            <div className="px-drop d2" />
            <div className="px-drop d3" />
            <div className="px-ripple r1" />
            <div className="px-ripple r2" />
          </div>
        )}
        {isIntersection && <div className="grid-dot" />}
      </div>
    );
  }
);

GridCell.displayName = 'GridCell';

const GameBoard: React.FC<{
  grid: ReturnType<typeof useGameStore.getState>['playerGrid'];
  ships: Ship[];
  isOpponent: boolean;
  label: string;
}> = ({ grid, ships, isOpponent, label }) => {
  const phase = useGameStore((s) => s.phase);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const selectedShip = useGameStore((s) => s.selectedShip);
  const shipOrientation = useGameStore((s) => s.shipOrientation);
  const hoverCell = useGameStore((s) => s.hoverCell);
  const lastAttackCell = useGameStore((s) => s.lastAttackCell);
  const lastAttackResult = useGameStore((s) => s.lastAttackResult);
  const attackPending = useGameStore((s) => s.attackPending);
  const sinkingCells = useGameStore((s) => s.sinkingCells);
  const [localPendingCell, setLocalPendingCell] = useState<[number, number] | null>(null);

  const canAttack =
    !isOpponent &&
    phase === 'battle' &&
    currentTurn === 'player' &&
    !attackPending;

  const canDeploy =
    isOpponent === false && phase === 'deploy' && selectedShip !== null;

  const getPreviewCells = useCallback((): [number, number][] => {
    if (!canDeploy || !hoverCell || !selectedShip) return [];
    const size = getShipSize(selectedShip as Ship['type']);
    const cells: [number, number][] = [];
    for (let i = 0; i < size; i++) {
      const r =
        shipOrientation === 'vertical' ? hoverCell[0] + i : hoverCell[0];
      const c =
        shipOrientation === 'horizontal' ? hoverCell[1] + i : hoverCell[1];
      cells.push([r, c]);
    }
    return cells;
  }, [canDeploy, hoverCell, selectedShip, shipOrientation]);

  const previewCells = useMemo(getPreviewCells, [getPreviewCells]);

  const isPreviewInvalid = useCallback((): boolean => {
    if (!canDeploy || !hoverCell || !selectedShip) return false;
    const size = getShipSize(selectedShip as Ship['type']);
    const existingShip = ships.find((s) => s.type === selectedShip);
    return !validatePlacement(
      grid,
      hoverCell[0],
      hoverCell[1],
      size,
      shipOrientation,
      existingShip?.id
    );
  }, [canDeploy, hoverCell, selectedShip, shipOrientation, grid, ships]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const state = useGameStore.getState();

      if (state.phase === 'deploy' && !isOpponent && state.selectedShip) {
        const size = getShipSize(state.selectedShip as Ship['type']);
        const existingShip = state.playerShips.find(
          (s) => s.type === state.selectedShip
        );
        const valid = validatePlacement(
          state.playerGrid,
          row,
          col,
          size,
          state.shipOrientation,
          existingShip?.id
        );
        if (!valid) return;

        const newShip: Ship = existingShip || {
          id: `ship-${state.selectedShip}-${Date.now()}`,
          type: state.selectedShip as Ship['type'],
          cells: [],
          hits: new Array(size).fill(false),
          sunk: false,
          orientation: state.shipOrientation,
        };

        const newCells: [number, number][] = [];
        for (let i = 0; i < size; i++) {
          const r =
            state.shipOrientation === 'vertical' ? row + i : row;
          const c =
            state.shipOrientation === 'horizontal' ? col + i : col;
          newCells.push([r, c]);
        }
        newShip.cells = newCells;
        newShip.orientation = state.shipOrientation;

        const newGrid = placeShip(state.playerGrid, row, col, newShip);
        const otherShips = state.playerShips.filter(
          (s) => s.type !== state.selectedShip
        );
        const newShips = [...otherShips, newShip];

        useGameStore.setState({
          playerGrid: newGrid,
          playerShips: newShips,
          selectedShip: null,
        });
      }

      if (state.phase === 'battle' && isOpponent && state.currentTurn === 'player' && !state.attackPending) {
        const cellState = state.opponentGrid.cells[row][col];
        if (cellState === 'hit' || cellState === 'miss' || cellState === 'sunk') return;

        setLocalPendingCell([row, col]);
        useGameStore.setState({ attackPending: true });

        setTimeout(() => {
          setLocalPendingCell(null);
        }, 1500);

        eventBus.emit('attackEvent', {
          row,
          col,
          attacker: 'player',
        });
      }
    },
    [isOpponent]
  );

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (canDeploy) {
        useGameStore.setState({ hoverCell: [row, col] });
      }
    },
    [canDeploy]
  );

  const handleMouseLeave = useCallback(() => {
    if (canDeploy) {
      useGameStore.setState({ hoverCell: null });
    }
  }, [canDeploy]);

  const getShipColorForCell = (row: number, col: number): string | undefined => {
    const shipId = grid.shipMap[row][col];
    if (!shipId) return undefined;
    const ship = ships.find((s) => s.id === shipId);
    if (!ship) return undefined;
    const def = SHIP_DEFINITIONS.find((d) => d.type === ship.type);
    return def?.color;
  };

  const isValidPreview = !isPreviewInvalid();

  return (
    <div className="board-container">
      <div className="board-label">{label}</div>
      <div className="board-grid">
        {Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE }, (_, col) => {
            const cellState = grid.cells[row][col];
            const isInPreview = previewCells.some(
              ([r, c]) => r === row && c === col
            );
            const isSinking = sinkingCells.some(
              ([r, c]) => r === row && c === col
            );
            const isPending =
              localPendingCell?.[0] === row && localPendingCell?.[1] === col;
            const isLastAtk =
              lastAttackCell?.[0] === row && lastAttackCell?.[1] === col;

            return (
              <GridCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                state={cellState}
                isOpponent={isOpponent}
                shipColor={
                  !isOpponent ? getShipColorForCell(row, col) : undefined
                }
                isHoverPreview={isInPreview && canDeploy}
                isInvalidPreview={isInPreview && canDeploy && !isValidPreview}
                isSinking={isSinking}
                isAttackPending={isPending}
                isLastAttack={isLastAtk && isOpponent}
                lastAttackResult={isLastAtk && isOpponent ? lastAttackResult : null}
                onClick={() => handleCellClick(row, col)}
                onMouseEnter={() => handleMouseEnter(row, col)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export const Board: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const playerGrid = useGameStore((s) => s.playerGrid);
  const opponentGrid = useGameStore((s) => s.opponentGrid);
  const playerShips = useGameStore((s) => s.playerShips);
  const opponentShips = useGameStore((s) => s.opponentShips);
  const isReady = useGameStore((s) => s.isReady);
  const allShipsPlaced = SHIP_DEFINITIONS.every((def) =>
    playerShips.some((s) => s.type === def.type)
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const state = useGameStore.getState();
        if (state.selectedShip) {
          useGameStore.setState({
            shipOrientation:
              state.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal',
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleReady = () => {
    if (!allShipsPlaced) return;
    useGameStore.setState({ isReady: true, phase: 'matching' });
    eventBus.emit('matchRequest', {
      playerId: useGameStore.getState().playerId,
    });
  };

  return (
    <div className="board-area">
      <ShipSelector />
      <GameBoard
        grid={playerGrid}
        ships={playerShips}
        isOpponent={false}
        label="我方海域"
      />
      {phase !== 'deploy' && (
        <GameBoard
          grid={opponentGrid}
          ships={opponentShips}
          isOpponent={true}
          label="敌方海域"
        />
      )}
      {phase === 'deploy' && (
        <div className="deploy-actions">
          <button
            className={`btn-ready ${allShipsPlaced ? '' : 'disabled'}`}
            onClick={handleReady}
            disabled={!allShipsPlaced}
          >
            就 绪
          </button>
          {!allShipsPlaced && (
            <div className="deploy-hint">请放置所有舰艇</div>
          )}
        </div>
      )}
      {phase === 'matching' && (
        <div className="matching-overlay">
          <div className="matching-spinner" />
          <div className="matching-text">正在匹配对手...</div>
        </div>
      )}
    </div>
  );
};

export default Board;
