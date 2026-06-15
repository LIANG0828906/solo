import {
  CellStatus,
  Ship,
  Player,
  Position,
  AttackResult,
  BOARD_SIZE,
  SHIP_CONFIGS,
} from './types';

export class GameEngine {
  static createEmptyBoard(): CellStatus[][] {
    return Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(CellStatus.EMPTY));
  }

  static createShips(): Ship[] {
    return SHIP_CONFIGS.map((config) => ({
      ...config,
      positions: [],
      isPlaced: false,
      isSunk: false,
    }));
  }

  static createPlayer(id: string, name: string): Player {
    return {
      id,
      name,
      ships: this.createShips(),
      board: this.createEmptyBoard(),
      isReady: false,
    };
  }

  static canPlaceShip(
    board: CellStatus[][],
    ship: Ship,
    startRow: number,
    startCol: number,
    orientation: 'horizontal' | 'vertical'
  ): boolean {
    const positions: Position[] = [];

    for (let i = 0; i < ship.size; i++) {
      const row = orientation === 'horizontal' ? startRow : startRow + i;
      const col = orientation === 'horizontal' ? startCol + i : startCol;

      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return false;
      }

      positions.push({ row, col });
    }

    for (const pos of positions) {
      if (board[pos.row][pos.col] !== CellStatus.EMPTY) {
        return false;
      }
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = pos.row + dr;
          const nc = pos.col + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (
              board[nr][nc] === CellStatus.SHIP &&
              !positions.some((p) => p.row === nr && p.col === nc)
            ) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  static getPreviewPositions(
    ship: Ship,
    startRow: number,
    startCol: number,
    orientation: 'horizontal' | 'vertical'
  ): Position[] {
    const positions: Position[] = [];
    for (let i = 0; i < ship.size; i++) {
      const row = orientation === 'horizontal' ? startRow : startRow + i;
      const col = orientation === 'horizontal' ? startCol + i : startCol;
      positions.push({ row, col });
    }
    return positions;
  }

  static placeShip(
    player: Player,
    shipId: string,
    startRow: number,
    startCol: number,
    orientation: 'horizontal' | 'vertical'
  ): Player | null {
    const shipIndex = player.ships.findIndex((s) => s.id === shipId);
    if (shipIndex === -1) return null;

    const ship = player.ships[shipIndex];
    if (ship.isPlaced) {
      player = this.removeShip(player, shipId);
    }

    if (!this.canPlaceShip(player.board, ship, startRow, startCol, orientation)) {
      return null;
    }

    const positions = this.getPreviewPositions(ship, startRow, startCol, orientation);
    const newBoard = player.board.map((row) => [...row]);
    const newShips = [...player.ships];

    for (const pos of positions) {
      newBoard[pos.row][pos.col] = CellStatus.SHIP;
    }

    newShips[shipIndex] = {
      ...ship,
      positions,
      orientation,
      isPlaced: true,
    };

    return {
      ...player,
      board: newBoard,
      ships: newShips,
    };
  }

  static removeShip(player: Player, shipId: string): Player {
    const ship = player.ships.find((s) => s.id === shipId);
    if (!ship || !ship.isPlaced) return player;

    const newBoard = player.board.map((row) => [...row]);
    for (const pos of ship.positions) {
      newBoard[pos.row][pos.col] = CellStatus.EMPTY;
    }

    const newShips = player.ships.map((s) =>
      s.id === shipId
        ? { ...s, positions: [], isPlaced: false, orientation: 'horizontal' as const }
        : s
    );

    return {
      ...player,
      board: newBoard,
      ships: newShips,
    };
  }

  static rotateShip(ship: Ship): Ship {
    return {
      ...ship,
      orientation: ship.orientation === 'horizontal' ? 'vertical' : 'horizontal',
    };
  }

  static areAllShipsPlaced(player: Player): boolean {
    return player.ships.every((s) => s.isPlaced);
  }

  static processAttack(
    defender: Player,
    attackerId: string,
    row: number,
    col: number
  ): { defender: Player; result: AttackResult } {
    const board = defender.board.map((r) => [...r]);
    const cell = board[row][col];

    if (cell === CellStatus.HIT || cell === CellStatus.MISS || cell === CellStatus.SUNK) {
      return {
        defender,
        result: {
          row,
          col,
          isHit: false,
          isSunk: false,
          isGameOver: false,
        },
      };
    }

    const isHit = cell === CellStatus.SHIP;
    let isSunk = false;
    let sunkShipName: string | undefined;
    let newShips = [...defender.ships];

    if (isHit) {
      board[row][col] = CellStatus.HIT;

      const hitShipIndex = newShips.findIndex((ship) =>
        ship.positions.some((p) => p.row === row && p.col === col)
      );

      if (hitShipIndex !== -1) {
        const hitShip = newShips[hitShipIndex];
        const newHealth = hitShip.health - 1;

        if (newHealth <= 0) {
          isSunk = true;
          sunkShipName = hitShip.name;
          for (const pos of hitShip.positions) {
            board[pos.row][pos.col] = CellStatus.SUNK;
          }
          newShips[hitShipIndex] = { ...hitShip, health: 0, isSunk: true };
        } else {
          newShips[hitShipIndex] = { ...hitShip, health: newHealth };
        }
      }
    } else {
      board[row][col] = CellStatus.MISS;
    }

    const isGameOver = newShips.every((s) => s.isSunk);

    return {
      defender: {
        ...defender,
        board,
        ships: newShips,
      },
      result: {
        row,
        col,
        isHit,
        isSunk,
        sunkShipName,
        isGameOver,
      },
    };
  }

  static getSunkenShips(player: Player): Ship[] {
    return player.ships.filter((s) => s.isSunk);
  }

  static getShipAtPosition(player: Player, row: number, col: number): Ship | undefined {
    return player.ships.find((ship) =>
      ship.positions.some((p) => p.row === row && p.col === col)
    );
  }
}
