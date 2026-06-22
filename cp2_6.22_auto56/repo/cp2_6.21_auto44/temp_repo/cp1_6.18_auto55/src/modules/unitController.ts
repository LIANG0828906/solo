import { Unit, Enemy, Position, MapData, UnitType, GamePhase } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { worldToGrid, CELL_SIZE, MAP_WIDTH, MAP_HEIGHT } from './terrainGenerator';

const keyState: Record<string, boolean> = {};

let moveTarget: Position | null = null;
let lastInputTime: number = performance.now();

export function initInputHandlers(canvas: HTMLCanvasElement | null) {
  window.addEventListener('keydown', (e) => {
    keyState[e.key.toLowerCase()] = true;
    lastInputTime = performance.now();
  });

  window.addEventListener('keyup', (e) => {
    keyState[e.key.toLowerCase()] = false;
  });

  if (canvas) {
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      moveTarget = { x, y };
      lastInputTime = performance.now();
    });
  }
}

export function cleanupInputHandlers(canvas: HTMLCanvasElement | null) {
  if (canvas) {
    canvas.onclick = null;
  }
}

export function getInputDelay(): number {
  return Math.min(50, performance.now() - lastInputTime);
}

export function getKeyState(key: string): boolean {
  return keyState[key.toLowerCase()] ?? false;
}

export function createInitialUnits(mapData: MapData): Unit[] {
  const centerX = MAP_WIDTH * CELL_SIZE / 2;
  const centerY = MAP_HEIGHT * CELL_SIZE / 2;

  const units: Unit[] = [
    {
      id: uuidv4(),
      type: UnitType.COMMANDER,
      position: { x: centerX - 32, y: centerY },
      hp: 100,
      maxHp: 100,
      visionRadius: 150,
      visionAngle: (120 * Math.PI) / 180,
      moveSpeed: 50,
      isSelected: true,
      facing: 0,
    },
  ];

  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    units.push({
      id: uuidv4(),
      type: UnitType.SCOUT,
      position: {
        x: centerX + 48 + Math.cos(angle) * 32,
        y: centerY + Math.sin(angle) * 32,
      },
      hp: 80,
      maxHp: 80,
      visionRadius: 80,
      visionAngle: 0,
      moveSpeed: 90,
      isSelected: false,
      facing: angle,
    });
  }

  return units;
}

export function createInitialEnemies(mapData: MapData): Enemy[] {
  const enemies: Enemy[] = [];

  for (let i = 0; i < 2; i++) {
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (edge) {
      case 0:
        x = Math.random() * MAP_WIDTH * CELL_SIZE;
        y = 64;
        break;
      case 1:
        x = MAP_WIDTH * CELL_SIZE - 64;
        y = Math.random() * MAP_HEIGHT * CELL_SIZE;
        break;
      case 2:
        x = Math.random() * MAP_WIDTH * CELL_SIZE;
        y = MAP_HEIGHT * CELL_SIZE - 64;
        break;
      default:
        x = 64;
        y = Math.random() * MAP_HEIGHT * CELL_SIZE;
    }

    enemies.push({
      id: uuidv4(),
      position: { x, y },
      visionRadius: 60,
      moveSpeed: 30,
      patrolTarget: {
        x: 100 + Math.random() * (MAP_WIDTH * CELL_SIZE - 200),
        y: 100 + Math.random() * (MAP_HEIGHT * CELL_SIZE - 200),
      },
    });
  }

  return enemies;
}

function isPositionValid(pos: Position, mapData: MapData): boolean {
  const grid = worldToGrid(pos.x, pos.y);
  if (grid.x < 0 || grid.x >= mapData.width || grid.y < 0 || grid.y >= mapData.height) {
    return false;
  }
  const cell = mapData.grid[grid.y][grid.x];
  if (cell.type === 'tree' || cell.type === 'ruin') {
    const offsetX = pos.x - grid.x * CELL_SIZE - CELL_SIZE / 2;
    const offsetY = pos.y - grid.y * CELL_SIZE - CELL_SIZE / 2;
    if (Math.abs(offsetX) < 8 && Math.abs(offsetY) < 8) {
      return false;
    }
  }
  return true;
}

function clampPosition(pos: Position): Position {
  const margin = 16;
  return {
    x: Math.max(margin, Math.min(MAP_WIDTH * CELL_SIZE - margin, pos.x)),
    y: Math.max(margin, Math.min(MAP_HEIGHT * CELL_SIZE - margin, pos.y)),
  };
}

export function updateUnits(
  units: Unit[],
  selectedUnitId: string | null,
  mapData: MapData,
  deltaTime: number
): Unit[] {
  return units.map((unit) => {
    if (unit.id !== selectedUnitId) return unit;

    const newUnit = { ...unit, position: { ...unit.position } };
    let dx = 0;
    let dy = 0;

    if (getKeyState('w') || getKeyState('arrowup')) dy -= 1;
    if (getKeyState('s') || getKeyState('arrowdown')) dy += 1;
    if (getKeyState('a') || getKeyState('arrowleft')) dx -= 1;
    if (getKeyState('d') || getKeyState('arrowright')) dx += 1;

    if (moveTarget) {
      const tdx = moveTarget.x - unit.position.x;
      const tdy = moveTarget.y - unit.position.y;
      const dist = Math.sqrt(tdx * tdx + tdy * tdy);

      if (dist > 4) {
        dx = tdx / dist;
        dy = tdy / dist;
      } else {
        moveTarget = null;
      }
    }

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;

      const speed = unit.moveSpeed * deltaTime;
      const newPos = {
        x: unit.position.x + dx * speed,
        y: unit.position.y + dy * speed,
      };

      if (isPositionValid(newPos, mapData)) {
        newUnit.position = clampPosition(newPos);
      } else {
        const xOnly = { x: unit.position.x + dx * speed, y: unit.position.y };
        const yOnly = { x: unit.position.x, y: unit.position.y + dy * speed };

        if (isPositionValid(xOnly, mapData)) {
          newUnit.position = clampPosition(xOnly);
        } else if (isPositionValid(yOnly, mapData)) {
          newUnit.position = clampPosition(yOnly);
        }
      }

      newUnit.facing = Math.atan2(dy, dx);
    }

    return newUnit;
  });
}

export function updateEnemies(
  enemies: Enemy[],
  mapData: MapData,
  deltaTime: number
): Enemy[] {
  return enemies.map((enemy) => {
    const newEnemy = { ...enemy, position: { ...enemy.position } };

    const dx = enemy.patrolTarget.x - enemy.position.x;
    const dy = enemy.patrolTarget.y - enemy.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      newEnemy.patrolTarget = {
        x: 100 + Math.random() * (MAP_WIDTH * CELL_SIZE - 200),
        y: 100 + Math.random() * (MAP_HEIGHT * CELL_SIZE - 200),
      };
    } else {
      const speed = enemy.moveSpeed * deltaTime;
      newEnemy.position = clampPosition({
        x: enemy.position.x + (dx / dist) * speed,
        y: enemy.position.y + (dy / dist) * speed,
      });
    }

    return newEnemy;
  });
}

export function checkCollisions(
  units: Unit[],
  enemies: Enemy[]
): { gameOver: boolean; flash: boolean } {
  for (const unit of units) {
    for (const enemy of enemies) {
      const dx = unit.position.x - enemy.position.x;
      const dy = unit.position.y - enemy.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 24) {
        return { gameOver: true, flash: true };
      }
    }
  }
  return { gameOver: false, flash: false };
}

export function checkExtraction(
  units: Unit[],
  extractionPoint: Position,
  currentProgress: number,
  deltaTime: number,
  phase: GamePhase
): number {
  if (phase !== GamePhase.PLAYING) return currentProgress;

  const extractionRadius = 40;
  const allInside = units.every((unit) => {
    const dx = unit.position.x - extractionPoint.x;
    const dy = unit.position.y - extractionPoint.y;
    return Math.sqrt(dx * dx + dy * dy) < extractionRadius;
  });

  if (allInside) {
    return Math.min(100, currentProgress + (100 / 3) * deltaTime);
  } else {
    return Math.max(0, currentProgress - (100 / 6) * deltaTime);
  }
}

export function switchUnitByKey(units: Unit[], key: string): string | null {
  const index = parseInt(key, 10) - 1;
  if (index >= 0 && index < units.length) {
    return units[index].id;
  }
  return null;
}
