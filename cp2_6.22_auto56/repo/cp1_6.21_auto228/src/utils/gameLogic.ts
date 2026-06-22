import { v4 as uuidv4 } from 'uuid';
import { 
  Ship, ShipType, Cell, GameState, PlanetType, Player,
  SHIP_CONFIGS, SHIP_COSTS, SHIP_VALUES
} from '../types/game';

export function createShip(type: ShipType, player: Player): Ship {
  const config = SHIP_CONFIGS[type];
  return {
    id: uuidv4(),
    ...config,
    player,
    hasMoved: false,
    hasAttacked: false,
  };
}

export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export function getValidMoves(
  board: Cell[][],
  ship: Ship,
  fromX: number,
  fromY: number,
  isDeploymentPhase: boolean
): { x: number; y: number }[] {
  const moves: { x: number; y: number }[] = [];
  const maxRange = isDeploymentPhase ? 1 : ship.moveRange;

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (x === fromX && y === fromY) continue;
      
      const distance = calculateDistance(fromX, fromY, x, y);
      if (distance > maxRange) continue;

      const cell = board[y][x];
      const hasEnemyShip = cell.ships.some(s => s.player !== ship.player);

      if (isDeploymentPhase) {
        if (hasEnemyShip) continue;
        if (cell.planet === 'enemy1' || cell.planet === 'enemy2') continue;
      }

      if (!hasEnemyShip) {
        moves.push({ x, y });
      }
    }
  }

  return moves;
}

export function getValidAttacks(
  board: Cell[][],
  ship: Ship,
  fromX: number,
  fromY: number,
  isDeploymentPhase: boolean
): { x: number; y: number }[] {
  if (isDeploymentPhase || ship.hasAttacked) return [];

  const attacks: { x: number; y: number }[] = [];

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const distance = calculateDistance(fromX, fromY, x, y);
      if (distance !== 1) continue;

      const cell = board[y][x];
      const hasEnemyShip = cell.ships.some(s => s.player !== ship.player);

      if (hasEnemyShip) {
        attacks.push({ x, y });
      }
    }
  }

  return attacks;
}

export function moveShip(
  board: Cell[][],
  ship: Ship,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({
    ...cell,
    ships: [...cell.ships]
  })));

  const fromCell = newBoard[fromY][fromX];
  const toCell = newBoard[toY][toX];

  const shipIndex = fromCell.ships.findIndex(s => s.id === ship.id);
  if (shipIndex === -1) return board;

  const movedShip = { ...fromCell.ships[shipIndex], hasMoved: true };
  fromCell.ships.splice(shipIndex, 1);
  toCell.ships.push(movedShip);

  if (toCell.planet === 'neutral') {
    toCell.planet = ship.player === 1 ? 'friendly1' : 'friendly2';
  }

  return newBoard;
}

export function calculateDamage(attacker: Ship, defender: Ship): number {
  const baseDamage = attacker.attack;
  const defense = defender.defense;
  const damage = Math.max(1, baseDamage - Math.floor(defense / 2));
  return damage;
}

export interface BattleResult {
  board: Cell[][];
  report: string;
  destroyedShips: string[];
}

export function executeAttack(
  board: Cell[][],
  attacker: Ship,
  attackerX: number,
  attackerY: number,
  targetX: number,
  targetY: number
): BattleResult {
  const newBoard = board.map(row => row.map(cell => ({
    ...cell,
    ships: [...cell.ships]
  })));

  const attackerCell = newBoard[attackerY][attackerX];
  const targetCell = newBoard[targetY][targetX];

  const attackerIndex = attackerCell.ships.findIndex(s => s.id === attacker.id);
  if (attackerIndex === -1) return { board, report: '攻击失败', destroyedShips: [] };

  const enemyShips = targetCell.ships.filter(s => s.player !== attacker.player);
  if (enemyShips.length === 0) return { board, report: '没有目标', destroyedShips: [] };

  const target = enemyShips[0];
  const targetIndex = targetCell.ships.findIndex(s => s.id === target.id);

  const damageToTarget = calculateDamage(attacker, target);
  const damageToAttacker = calculateDamage(target, attacker);

  const reports: string[] = [];
  const destroyedShips: string[] = [];

  targetCell.ships[targetIndex] = {
    ...target,
    hp: target.hp - damageToTarget
  };

  attackerCell.ships[attackerIndex] = {
    ...attacker,
    hp: attacker.hp - damageToAttacker,
    hasAttacked: true
  };

  reports.push(`${attacker.name}对${target.name}造成${damageToTarget}点伤害`);
  reports.push(`${target.name}反击造成${damageToAttacker}点伤害`);

  if (targetCell.ships[targetIndex].hp <= 0) {
    reports.push(`${target.name}被摧毁!`);
    destroyedShips.push(target.id);
    targetCell.ships.splice(targetIndex, 1);
  }

  if (attackerCell.ships[attackerIndex].hp <= 0) {
    reports.push(`${attacker.name}被摧毁!`);
    destroyedShips.push(attacker.id);
    attackerCell.ships.splice(attackerIndex, 1);
  }

  if (targetCell.ships.length === 0 && targetCell.planet) {
    if (attacker.player === 1 && targetCell.planet === 'enemy2') {
      targetCell.planet = 'friendly1';
      reports.push('占领了敌方行星!');
    } else if (attacker.player === 2 && targetCell.planet === 'enemy1') {
      targetCell.planet = 'friendly2';
      reports.push('占领了敌方行星!');
    }
  }

  return {
    board: newBoard,
    report: reports.join('，'),
    destroyedShips
  };
}

export function calculateResources(board: Cell[][], player: Player): number {
  let resources = 0;
  const friendlyType = player === 1 ? 'friendly1' : 'friendly2';

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const cell = board[y][x];
      if (cell.planet === friendlyType) {
        resources += 4;
      } else if (cell.planet === 'neutral') {
        const hasPlayerShip = cell.ships.some(s => s.player === player);
        if (hasPlayerShip) {
          resources += 2;
        }
      }
    }
  }

  return resources;
}

export function countPlanets(board: Cell[][], player: Player): number {
  let count = 0;
  const friendlyType = player === 1 ? 'friendly1' : 'friendly2';

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (board[y][x].planet === friendlyType) {
        count++;
      }
    }
  }

  return count;
}

export function calculateFleetValue(board: Cell[][], player: Player): number {
  let value = 0;

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const ships = board[y][x].ships.filter(s => s.player === player);
      for (const ship of ships) {
        value += SHIP_VALUES[ship.type];
      }
    }
  }

  return value;
}

export function calculateScores(board: Cell[][]): { player1: number; player2: number } {
  const p1Planets = countPlanets(board, 1);
  const p2Planets = countPlanets(board, 2);
  const p1Fleet = calculateFleetValue(board, 1);
  const p2Fleet = calculateFleetValue(board, 2);

  return {
    player1: p1Planets * 5 + p1Fleet,
    player2: p2Planets * 5 + p2Fleet
  };
}

export function buildShip(
  board: Cell[][],
  type: ShipType,
  player: Player,
  resources: number
): { board: Cell[][]; resources: number; success: boolean; message: string } {
  const cost = SHIP_COSTS[type];
  if (resources < cost) {
    return { board, resources, success: false, message: '资源不足' };
  }

  const baseX = player === 1 ? 0 : 3;
  const baseY = player === 1 ? 0 : 3;
  const baseCell = board[baseY][baseX];

  if (baseCell.baseOwner !== player) {
    return { board, resources, success: false, message: '基地已被占领' };
  }

  const newBoard = board.map(row => row.map(cell => ({
    ...cell,
    ships: [...cell.ships]
  })));

  const newShip = createShip(type, player);
  newShip.hasMoved = true;
  newShip.hasAttacked = true;
  newBoard[baseY][baseX].ships.push(newShip);

  return {
    board: newBoard,
    resources: resources - cost,
    success: true,
    message: `${SHIP_CONFIGS[type].name}建造完成!`
  };
}

export function resetShipFlags(board: Cell[][]): Cell[][] {
  return board.map(row => row.map(cell => ({
    ...cell,
    ships: cell.ships.map(ship => ({
      ...ship,
      hasMoved: false,
      hasAttacked: false
    }))
  })));
}

export function initializeBoard(): Cell[][] {
  const board: Cell[][] = [];
  
  const planetLayout: (PlanetType | null)[][] = [
    ['friendly1', 'neutral', 'neutral', 'neutral'],
    ['neutral', 'neutral', 'neutral', 'neutral'],
    ['neutral', 'neutral', 'neutral', 'neutral'],
    ['neutral', 'neutral', 'neutral', 'friendly2'],
  ];

  for (let y = 0; y < 4; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < 4; x++) {
      row.push({
        x,
        y,
        planet: planetLayout[y][x],
        ships: [],
        isBase: (x === 0 && y === 0) || (x === 3 && y === 3),
        baseOwner: (x === 0 && y === 0) ? 1 : (x === 3 && y === 3) ? 2 : undefined
      });
    }
    board.push(row);
  }

  board[0][0].ships = [
    createShip('scout', 1),
    createShip('scout', 1),
    createShip('frigate', 1),
  ];

  board[3][3].ships = [
    createShip('scout', 2),
    createShip('scout', 2),
    createShip('frigate', 2),
  ];

  return board;
}

export function initializeGameState(player1Name: string, player2Name: string): GameState {
  return {
    id: uuidv4(),
    board: initializeBoard(),
    currentPlayer: 1,
    turn: 1,
    maxTurns: 10,
    isDeploymentPhase: true,
    resources: { player1: 0, player2: 0 },
    selectedCell: null,
    selectedShip: null,
    battleReport: null,
    gameOver: false,
    winner: null,
    scores: { player1: 0, player2: 0 },
    startTime: Date.now(),
    playerNames: { player1: player1Name, player2: player2Name },
    animatingCell: null,
    validMoves: [],
    validAttacks: [],
  };
}
