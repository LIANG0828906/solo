import { Creature, Formation, FormationCell, Element, Team } from '../types';

const COLS = 5;
const COL_SPACING = 1.2;
const ROW_SPACING = 2;
const FRONT_OFFSET = 0.5;
const BACK_OFFSET = 0.5;

function getElementCounter(element: Element): Element {
  switch (element) {
    case 'fire': return 'water';
    case 'water': return 'grass';
    case 'grass': return 'fire';
  }
}

function countElementsByTeam(creatures: Creature[]): Record<Team, Record<Element, number>> {
  const counts: Record<Team, Record<Element, number>> = {
    ally: { fire: 0, water: 0, grass: 0 },
    enemy: { fire: 0, water: 0, grass: 0 }
  };
  
  for (const c of creatures) {
    if (c.isAlive) {
      counts[c.team][c.element]++;
    }
  }
  
  return counts;
}

function getDominantElement(counts: Record<Element, number>): Element {
  let max = -1;
  let dominant: Element = 'fire';
  for (const e of ['fire', 'water', 'grass'] as Element[]) {
    if (counts[e] > max) {
      max = counts[e];
      dominant = e;
    }
  }
  return dominant;
}

function sortBySpeedDesc(creatures: Creature[]): Creature[] {
  return [...creatures].sort((a, b) => b.speed - a.speed);
}

function sortRowByElement(creatures: Creature[], counterElement: Element): Creature[] {
  const counters: Creature[] = [];
  const neutrals: Creature[] = [];
  const weak: Creature[] = [];
  
  const strongAgainst = getElementCounter(counterElement);
  
  for (const c of creatures) {
    if (c.element === strongAgainst) {
      counters.push(c);
    } else if (c.element === counterElement) {
      weak.push(c);
    } else {
      neutrals.push(c);
    }
  }
  
  return [...counters, ...neutrals, ...weak];
}

export function generateFormation(
  allyCreatures: Creature[],
  enemyCreatures: Creature[],
  centerX: number = 0,
  centerZ: number = 0
): { allyFormation: Formation; enemyFormation: Formation } {
  const elementCounts = countElementsByTeam([...allyCreatures, ...enemyCreatures]);
  
  const allyDominant = getDominantElement(elementCounts.ally);
  const enemyDominant = getDominantElement(elementCounts.enemy);
  
  const allyCounter = getElementCounter(enemyDominant);
  const enemyCounter = getElementCounter(allyDominant);
  
  const sortedAlly = sortBySpeedDesc(allyCreatures.filter(c => c.isAlive));
  const sortedEnemy = sortBySpeedDesc(enemyCreatures.filter(c => c.isAlive));
  
  const allyFront = sortRowByElement(sortedAlly.slice(0, COLS), allyCounter);
  const allyBack = sortRowByElement(sortedAlly.slice(COLS, COLS * 2), allyCounter);
  
  const enemyFront = sortRowByElement(sortedEnemy.slice(0, COLS), enemyCounter);
  const enemyBack = sortRowByElement(sortedEnemy.slice(COLS, COLS * 2), enemyCounter);
  
  const allyFormation = createFormationFromRows(allyFront, allyBack, centerX, centerZ - 2, 'ally');
  const enemyFormation = createFormationFromRows(enemyFront, enemyBack, centerX, centerZ + 2, 'enemy');
  
  return { allyFormation, enemyFormation };
}

function createFormationFromRows(
  frontRow: Creature[],
  backRow: Creature[],
  centerX: number,
  centerZ: number,
  team: Team
): Formation {
  const formation: Formation = [];
  const startX = centerX - (COLS - 1) * COL_SPACING / 2;
  
  const zFront = team === 'ally' 
    ? centerZ - ROW_SPACING / 2 - FRONT_OFFSET
    : centerZ + ROW_SPACING / 2 + FRONT_OFFSET;
  
  const zBack = team === 'ally'
    ? centerZ + ROW_SPACING / 2 + BACK_OFFSET
    : centerZ - ROW_SPACING / 2 - BACK_OFFSET;
  
  for (let col = 0; col < COLS; col++) {
    const x = startX + col * COL_SPACING;
    
    formation.push({
      id: `cell_${team}_0_${col}`,
      creatureId: frontRow[col]?.id ?? null,
      row: 0,
      col: col as 0 | 1 | 2 | 3 | 4,
      position: { x, z: zFront }
    });
    
    formation.push({
      id: `cell_${team}_1_${col}`,
      creatureId: backRow[col]?.id ?? null,
      row: 1,
      col: col as 0 | 1 | 2 | 3 | 4,
      position: { x, z: zBack }
    });
  }
  
  return formation;
}

export function getFormationCreatures(formation: Formation, creatures: Map<string, Creature>): Creature[] {
  const result: Creature[] = [];
  for (const cell of formation) {
    if (cell.creatureId) {
      const c = creatures.get(cell.creatureId);
      if (c) result.push(c);
    }
  }
  return result;
}

export function findCellByPosition(
  formation: Formation,
  x: number,
  z: number,
  tolerance: number = 0.6
): FormationCell | null {
  for (const cell of formation) {
    const dx = Math.abs(cell.position.x - x);
    const dz = Math.abs(cell.position.z - z);
    if (dx < tolerance && dz < tolerance) {
      return cell;
    }
  }
  return null;
}

export function findCellByCreatureId(
  formation: Formation,
  creatureId: string
): FormationCell | null {
  return formation.find(c => c.creatureId === creatureId) ?? null;
}

export function swapCreatures(
  formation: Formation,
  cell1Id: string,
  cell2Id: string
): void {
  const cell1 = formation.find(c => c.id === cell1Id);
  const cell2 = formation.find(c => c.id === cell2Id);
  
  if (cell1 && cell2) {
    const temp = cell1.creatureId;
    cell1.creatureId = cell2.creatureId;
    cell2.creatureId = temp;
  }
}

export function setCreatureInCell(
  formation: Formation,
  cellId: string,
  creatureId: string | null
): void {
  const cell = formation.find(c => c.id === cellId);
  if (cell) {
    cell.creatureId = creatureId;
  }
}
