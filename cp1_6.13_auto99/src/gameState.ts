export type Faction = 'blue' | 'red';
export type ShipType = 'attack' | 'defense' | 'speed';
export type GamePhase = 'deploy' | 'battle' | 'gameOver';

export interface Ship {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  type: ShipType;
  faction: Faction;
  slotIndex: number | null;
  isAlive: boolean;
  hasAttacked: boolean;
  flashTimer: number;
  shakeTimer: number;
  shakeOffset: number;
}

export interface ShipTemplate {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  type: ShipType;
}

export interface Position {
  x: number;
  y: number;
}

export interface Slot {
  index: number;
  row: 'front' | 'back';
  position: Position;
  ship: Ship | null;
  faction: Faction;
  hovered: boolean;
  scale: number;
  targetScale: number;
  borderColorR: number;
  borderColorG: number;
  borderColorB: number;
  borderColorA: number;
  targetBorderColorR: number;
  targetBorderColorG: number;
  targetBorderColorB: number;
  targetBorderColorA: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface LaserBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  progress: number;
  duration: number;
}

export interface Explosion {
  x: number;
  y: number;
  particles: Particle[];
  duration: number;
  elapsed: number;
}

export interface GameStats {
  totalDamage: { blue: number; red: number };
  turnsPlayed: number;
}

export interface GameStateData {
  phase: GamePhase;
  turn: number;
  currentFaction: Faction;
  deployStep: Faction;
  blueShips: Ship[];
  redShips: Ship[];
  blueSlots: Slot[];
  redSlots: Slot[];
  selectedShip: Ship | null;
  selectedSlot: Slot | null;
  draggingShipTemplate: ShipTemplate | null;
  dragPosition: Position;
  explosions: Explosion[];
  laserBeams: LaserBeam[];
  stats: GameStats;
  winner: Faction | null;
}

const SHIP_TEMPLATES: ShipTemplate[] = [
  { name: '猎鹰号', hp: 60, attack: 85, defense: 30, speed: 75, type: 'attack' },
  { name: '雷霆号', hp: 70, attack: 70, defense: 40, speed: 60, type: 'attack' },
  { name: '堡垒号', hp: 95, attack: 35, defense: 90, speed: 20, type: 'defense' },
  { name: '护盾号', hp: 85, attack: 45, defense: 80, speed: 25, type: 'defense' },
  { name: '疾风号', hp: 50, attack: 65, defense: 25, speed: 95, type: 'speed' },
  { name: '幻影号', hp: 55, attack: 70, defense: 30, speed: 85, type: 'speed' },
];

export function getShipTemplates(): ShipTemplate[] {
  return SHIP_TEMPLATES.map(t => ({ ...t }));
}

function createShip(template: ShipTemplate, faction: Faction, id: string): Ship {
  return {
    id,
    name: template.name,
    hp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    defense: template.defense,
    speed: template.speed,
    type: template.type,
    faction,
    slotIndex: null,
    isAlive: true,
    hasAttacked: false,
    flashTimer: 0,
    shakeTimer: 0,
    shakeOffset: 0,
  };
}

export function createSlots(faction: Faction, canvasWidth: number, canvasHeight: number): Slot[] {
  const slots: Slot[] = [];
  const centerY = canvasHeight / 2;
  const slotSpacing = 70;
  const frontOffsetX = faction === 'blue' ? -200 : 200;
  const backOffsetX = faction === 'blue' ? -320 : 320;
  const centerX = canvasWidth / 2;

  for (let i = 0; i < 3; i++) {
    slots.push({
      index: i,
      row: 'front',
      position: {
        x: centerX + frontOffsetX,
        y: centerY + (i - 1) * slotSpacing,
      },
      ship: null,
      faction,
      hovered: false,
      scale: 1,
      targetScale: 1,
    });
  }

  for (let i = 0; i < 2; i++) {
    slots.push({
      index: i + 3,
      row: 'back',
      position: {
        x: centerX + backOffsetX,
        y: centerY + (i - 0.5) * slotSpacing,
      },
      ship: null,
      faction,
      hovered: false,
      scale: 1,
      targetScale: 1,
    });
  }

  return slots;
}

export function createInitialGameState(canvasWidth: number, canvasHeight: number): GameStateData {
  const blueShips: Ship[] = [];
  const redShips: Ship[] = [];

  SHIP_TEMPLATES.forEach((template, i) => {
    blueShips.push(createShip(template, 'blue', `blue-${i}`));
    redShips.push(createShip(template, 'red', `red-${i}`));
  });

  return {
    phase: 'deploy',
    turn: 1,
    currentFaction: 'blue',
    deployStep: 'blue',
    blueShips,
    redShips,
    blueSlots: createSlots('blue', canvasWidth, canvasHeight),
    redSlots: createSlots('red', canvasWidth, canvasHeight),
    selectedShip: null,
    selectedSlot: null,
    draggingShipTemplate: null,
    dragPosition: { x: 0, y: 0 },
    explosions: [],
    laserBeams: [],
    stats: {
      totalDamage: { blue: 0, red: 0 },
      turnsPlayed: 0,
    },
    winner: null,
  };
}

export function getDeployedShips(ships: Ship[]): Ship[] {
  return ships.filter(s => s.slotIndex !== null);
}

export function getShipsForFaction(state: GameStateData, faction: Faction): Ship[] {
  return faction === 'blue' ? state.blueShips : state.redShips;
}

export function getSlotsForFaction(state: GameStateData, faction: Faction): Slot[] {
  return faction === 'blue' ? state.blueSlots : state.redSlots;
}

export function getAliveShipsForFaction(state: GameStateData, faction: Faction): Ship[] {
  const ships = getShipsForFaction(state, faction);
  return ships.filter(s => s.isAlive && s.slotIndex !== null);
}

export function getTotalHpForFaction(state: GameStateData, faction: Faction): number {
  const ships = getShipsForFaction(state, faction);
  return ships
    .filter(s => s.slotIndex !== null)
    .reduce((sum, s) => sum + Math.max(0, s.hp), 0);
}

export function getMaxTotalHpForFaction(state: GameStateData, faction: Faction): number {
  const ships = getShipsForFaction(state, faction);
  return ships
    .filter(s => s.slotIndex !== null)
    .reduce((sum, s) => sum + s.maxHp, 0);
}

export function canAttackTarget(attacker: Ship, target: Ship, state: GameStateData): boolean {
  if (!attacker.isAlive || !target.isAlive) return false;
  if (attacker.faction === target.faction) return false;
  if (attacker.hasAttacked) return false;
  if (target.slotIndex === null || attacker.slotIndex === null) return false;

  const targetSlots = getSlotsForFaction(state, target.faction);
  const targetSlot = targetSlots.find(s => s.index === target.slotIndex);
  if (!targetSlot) return false;

  const attackerSlots = getSlotsForFaction(state, attacker.faction);
  const attackerSlot = attackerSlots.find(s => s.index === attacker.slotIndex);
  if (!attackerSlot) return false;

  if (targetSlot.row === 'front') {
    return true;
  }

  const frontRowTargets = targetSlots.filter(s => s.row === 'front' && s.ship && s.ship.isAlive);
  if (frontRowTargets.length > 0) {
    return false;
  }

  return true;
}

export function checkGameOver(state: GameStateData): Faction | null {
  const blueAlive = getAliveShipsForFaction(state, 'blue').length;
  const redAlive = getAliveShipsForFaction(state, 'red').length;

  if (blueAlive === 0) return 'red';
  if (redAlive === 0) return 'blue';
  if (state.turn > 20) {
    const blueHp = getTotalHpForFaction(state, 'blue');
    const redHp = getTotalHpForFaction(state, 'red');
    if (blueHp > redHp) return 'blue';
    if (redHp > blueHp) return 'red';
    return 'blue';
  }

  return null;
}

export function resetShipAttackFlags(state: GameStateData, faction: Faction): void {
  const ships = getShipsForFaction(state, faction);
  ships.forEach(s => {
    s.hasAttacked = false;
  });
}
