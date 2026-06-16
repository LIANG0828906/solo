import { 
  Ship, ShipType, EchoResult, ShipCell, Orientation, SHIP_CONFIGS, GRID_SIZE 
} from '@/types';
import { generateId, includesCell, getDistance, deepClone, shuffleArray } from '@/utils/arrayHelpers';

export class GameEngine {
  private gridSize: number;

  constructor(gridSize: number = GRID_SIZE) {
    this.gridSize = gridSize;
  }

  public generateRandomShipLayout(): Ship[] {
    const grid: boolean[][] = Array(this.gridSize).fill(null).map(() => 
      Array(this.gridSize).fill(false)
    );
    const ships: Ship[] = [];

    const shipConfigs = [...SHIP_CONFIGS];
    shipConfigs.sort((a, b) => b.length - a.length);

    for (const config of shipConfigs) {
      for (let i = 0; i < config.count; i++) {
        const ship = this.tryPlaceShip(grid, config.type, config.name, config.length);
        if (ship) {
          ships.push(ship);
          ship.cells.forEach(cell => {
            grid[cell.y][cell.x] = true;
          });
        }
      }
    }

    return shuffleArray(ships);
  }

  private tryPlaceShip(
    grid: boolean[][],
    type: ShipType,
    name: string,
    length: number
  ): Ship | null {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      const orientation: Orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const x = Math.floor(Math.random() * this.gridSize);
      const y = Math.floor(Math.random() * this.gridSize);

      if (this.canPlaceShip(grid, x, y, length, orientation)) {
        const cells: ShipCell[] = [];
        for (let i = 0; i < length; i++) {
          if (orientation === 'horizontal') {
            cells.push({ x: x + i, y });
          } else {
            cells.push({ x, y: y + i });
          }
        }

        return {
          id: generateId(),
          type,
          name,
          length,
          cells,
          hits: [],
          sunk: false,
        };
      }
    }

    return null;
  }

  private canPlaceShip(
    grid: boolean[][],
    x: number,
    y: number,
    length: number,
    orientation: Orientation
  ): boolean {
    for (let i = 0; i < length; i++) {
      let checkX = x;
      let checkY = y;

      if (orientation === 'horizontal') {
        checkX = x + i;
      } else {
        checkY = y + i;
      }

      if (checkX >= this.gridSize || checkY >= this.gridSize) {
        return false;
      }

      if (grid[checkY][checkX]) {
        return false;
      }

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = checkX + dx;
          const ny = checkY + dy;
          if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
            if (grid[ny][nx]) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  public getSonarResult(targetX: number, targetY: number, ships: Ship[]): {
    result: EchoResult;
    hitShip?: Ship;
    hitCell?: ShipCell;
  } {
    let closestDistance = Infinity;
    let hitShip: Ship | undefined;
    let hitCell: ShipCell | undefined;

    for (const ship of ships) {
      if (ship.sunk) continue;
      
      for (const cell of ship.cells) {
        const distance = getDistance({ x: targetX, y: targetY }, cell);
        
        if (distance === 0) {
          hitShip = ship;
          hitCell = cell;
          closestDistance = 0;
        } else if (distance < closestDistance) {
          closestDistance = distance;
        }
      }
    }

    if (closestDistance === 0) {
      return { result: 'HIT', hitShip, hitCell };
    } else if (closestDistance === 1) {
      return { result: 'CLOSE' };
    } else if (closestDistance === 2) {
      return { result: 'WARM' };
    }

    return { result: 'COLD' };
  }

  public processHit(ship: Ship, hitCell: ShipCell): Ship {
    const updatedShip = deepClone(ship);
    
    if (!includesCell(updatedShip.hits, hitCell)) {
      updatedShip.hits.push(hitCell);
    }

    updatedShip.sunk = this.checkShipSunk(updatedShip);
    return updatedShip;
  }

  public checkShipSunk(ship: Ship): boolean {
    return ship.cells.every(cell => includesCell(ship.hits, cell));
  }

  public checkAllShipsSunk(ships: Ship[]): boolean {
    return ships.every(ship => ship.sunk);
  }

  public getSunkCount(ships: Ship[]): number {
    return ships.filter(ship => ship.sunk).length;
  }

  public getRemainingShipCells(ship: Ship): ShipCell[] {
    return ship.cells.filter(cell => !includesCell(ship.hits, cell));
  }

  public getShipAtPosition(ships: Ship[], x: number, y: number): Ship | undefined {
    return ships.find(ship => 
      includesCell(ship.cells, { x, y }) && !ship.sunk
    );
  }

  public validateGridSize(): boolean {
    return this.gridSize >= 5 && this.gridSize <= 20;
  }
}
