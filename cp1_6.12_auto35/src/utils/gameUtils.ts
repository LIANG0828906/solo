import { TerrainType, Unit, Position, GamePhase, HistoryRecord, AiDecision } from '../types/game';

export function generateTerrain(mapSize: number): TerrainType[][] {
  const terrain: TerrainType[][] = [];
  for (let y = 0; y < mapSize; y++) {
    const row: TerrainType[] = [];
    for (let x = 0; x < mapSize; x++) {
      const rand = Math.random();
      if (rand < 0.6) {
        row.push('grass');
      } else if (rand < 0.85) {
        row.push('mountain');
      } else {
        row.push('water');
      }
    }
    terrain.push(row);
  }
  terrain[0][0] = 'grass';
  terrain[0][1] = 'grass';
  terrain[1][0] = 'grass';
  terrain[mapSize - 1][mapSize - 1] = 'grass';
  terrain[mapSize - 1][mapSize - 2] = 'grass';
  terrain[mapSize - 2][mapSize - 1] = 'grass';
  return terrain;
}

const UNIT_TEMPLATES = [
  { name: '战士', type: 'warrior', hp: 100, attack: 20, moveRange: 3, attackRange: 1 },
  { name: '弓手', type: 'archer', hp: 70, attack: 25, moveRange: 2, attackRange: 3 },
  { name: '骑兵', type: 'cavalry', hp: 90, attack: 22, moveRange: 5, attackRange: 1 },
  { name: '法师', type: 'mage', hp: 60, attack: 35, moveRange: 2, attackRange: 2 },
];

function* idGenerator(prefix: string) {
  let i = 1;
  while (true) {
    yield `${prefix}-${i++}`;
  }
}

export function deployUnits(mapSize: number): Unit[] {
  const units: Unit[] = [];
  const playerIdGen = idGenerator('player');
  const aiIdGen = idGenerator('ai');

  const playerPositions: Position[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ];

  const aiPositions: Position[] = [
    { x: mapSize - 1, y: mapSize - 1 },
    { x: mapSize - 2, y: mapSize - 1 },
    { x: mapSize - 1, y: mapSize - 2 },
    { x: mapSize - 2, y: mapSize - 2 },
  ];

  for (let i = 0; i < 4; i++) {
    const template = UNIT_TEMPLATES[i];
    units.push({
      id: playerIdGen.next().value as string,
      name: `玩家${template.name}`,
      type: template.type,
      team: 'player',
      position: { ...playerPositions[i] },
      hp: template.hp,
      maxHp: template.hp,
      attack: template.attack,
      moveRange: template.moveRange,
      attackRange: template.attackRange,
      isAlive: true,
      hasMoved: false,
      hasAttacked: false,
    });
  }

  for (let i = 0; i < 4; i++) {
    const template = UNIT_TEMPLATES[i];
    units.push({
      id: aiIdGen.next().value as string,
      name: `AI${template.name}`,
      type: template.type,
      team: 'ai',
      position: { ...aiPositions[i] },
      hp: template.hp,
      maxHp: template.hp,
      attack: template.attack,
      moveRange: template.moveRange,
      attackRange: template.attackRange,
      isAlive: true,
      hasMoved: false,
      hasAttacked: false,
    });
  }

  return units;
}

export function calculateDamage(attacker: Unit, defender: Unit): number {
  const baseDamage = attacker.attack;
  const variance = Math.floor(Math.random() * 10) - 5;
  return Math.max(1, baseDamage + variance);
}

export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

export { GamePhase };
export type { HistoryRecord, AiDecision };
