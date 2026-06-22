import { 
  Creature, Formation, CombatLog, CombatResult, 
  Team, ELEMENT_MULTIPLIERS, Element 
} from '../types';

const MAX_ROUNDS = 10;

export function getElementMultiplier(attacker: Element, defender: Element): number {
  return ELEMENT_MULTIPLIERS[attacker][defender];
}

export function calculateDamage(attacker: Creature, defender: Creature): { damage: number; multiplier: number } {
  const multiplier = getElementMultiplier(attacker.element, defender.element);
  const damage = Math.round(attacker.attack * multiplier);
  return { damage, multiplier };
}

function getAttackOrder(creatures: Creature[]): Creature[] {
  return [...creatures]
    .filter(c => c.isAlive)
    .sort((a, b) => b.speed - a.speed);
}

function getEnemyTeam(team: Team): Team {
  return team === 'ally' ? 'enemy' : 'ally';
}

function selectTarget(
  _attacker: Creature,
  attackerCol: number | undefined,
  enemies: { creature: Creature; col: number }[]
): { creature: Creature; col: number } | null {
  const aliveEnemies = enemies.filter(e => e.creature.isAlive);
  
  if (aliveEnemies.length === 0) return null;
  
  if (attackerCol !== undefined) {
    const sameColEnemy = aliveEnemies.find(e => e.col === attackerCol);
    if (sameColEnemy) {
      return sameColEnemy;
    }
  }
  
  return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
}

function getCreatureCol(formation: Formation, creatureId: string): number | undefined {
  const cell = formation.find(c => c.creatureId === creatureId);
  return cell?.col;
}

function getFormationCreaturesWithCols(
  formation: Formation,
  creatures: Map<string, Creature>
): { creature: Creature; col: number }[] {
  const result: { creature: Creature; col: number }[] = [];
  for (const cell of formation) {
    if (cell.creatureId) {
      const c = creatures.get(cell.creatureId);
      if (c) {
        result.push({ creature: c, col: cell.col });
      }
    }
  }
  return result;
}

function getCreaturePosition(
  formation: Formation,
  creatureId: string
): { x: number; y: number; z: number } | undefined {
  const cell = formation.find(c => c.creatureId === creatureId);
  if (cell) {
    return { x: cell.position.x, y: 0.5, z: cell.position.z };
  }
  return undefined;
}

function countSurvivors(creatures: Creature[], team: Team): number {
  return creatures.filter(c => c.team === team && c.isAlive).length;
}

function checkBattleEnd(creatures: Creature[]): Team | 'draw' | null {
  const allyAlive = countSurvivors(creatures, 'ally');
  const enemyAlive = countSurvivors(creatures, 'enemy');
  
  if (allyAlive === 0 && enemyAlive === 0) return 'draw';
  if (allyAlive === 0) return 'enemy';
  if (enemyAlive === 0) return 'ally';
  return null;
}

export interface CombatSimulationOptions {
  getPosition: (creatureId: string) => { x: number; y: number; z: number } | undefined;
}

export function simulateCombat(
  allyFormation: Formation,
  enemyFormation: Formation,
  creatures: Map<string, Creature>,
  options?: CombatSimulationOptions
): CombatResult {
  const allCreatures = Array.from(creatures.values());
  const allFormation = [...allyFormation, ...enemyFormation];
  
  for (const c of allCreatures) {
    c.currentHp = c.maxHp;
    c.isAlive = true;
  }
  
  const logs: CombatLog[] = [];
  let totalDamageAlly = 0;
  let totalDamageEnemy = 0;
  let winner: Team | 'draw' = 'draw';
  
  const getPosition = options?.getPosition || 
    ((id: string) => getCreaturePosition(allFormation, id));
  
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const attackOrder = getAttackOrder(allCreatures);
    
    for (const attacker of attackOrder) {
      if (!attacker.isAlive) continue;
      
      const enemyTeam = getEnemyTeam(attacker.team);
      const enemyFormation_ = enemyTeam === 'ally' ? allyFormation : enemyFormation;
      const enemies = getFormationCreaturesWithCols(enemyFormation_, creatures);
      
      const attackerCol = getCreatureCol(
        attacker.team === 'ally' ? allyFormation : enemyFormation,
        attacker.id
      );
      
      const target = selectTarget(attacker, attackerCol, enemies);
      
      if (!target) continue;
      
      const { damage, multiplier } = calculateDamage(attacker, target.creature);
      
      target.creature.currentHp -= damage;
      
      const isKill = target.creature.currentHp <= 0;
      if (isKill) {
        target.creature.currentHp = 0;
        target.creature.isAlive = false;
      }
      
      if (attacker.team === 'ally') {
        totalDamageAlly += damage;
      } else {
        totalDamageEnemy += damage;
      }
      
      const attackerPos = getPosition(attacker.id);
      const targetPos = getPosition(target.creature.id);
      
      logs.push({
        round,
        attackerId: attacker.id,
        targetId: target.creature.id,
        damage,
        elementMultiplier: multiplier,
        isKill,
        attackerPosition: attackerPos || { x: 0, y: 0.5, z: 0 },
        targetPosition: targetPos || { x: 0, y: 0.5, z: 0 },
        attackerElement: attacker.element
      });
      
      const endCheck = checkBattleEnd(allCreatures);
      if (endCheck) {
        winner = endCheck;
        return {
          winner,
          allySurvivors: countSurvivors(allCreatures, 'ally'),
          enemySurvivors: countSurvivors(allCreatures, 'enemy'),
          totalDamageAlly,
          totalDamageEnemy,
          logs,
          creatures: new Map(creatures)
        };
      }
    }
  }
  
  const allyAlive = countSurvivors(allCreatures, 'ally');
  const enemyAlive = countSurvivors(allCreatures, 'enemy');
  
  if (allyAlive > enemyAlive) winner = 'ally';
  else if (enemyAlive > allyAlive) winner = 'enemy';
  else winner = 'draw';
  
  return {
    winner,
    allySurvivors: allyAlive,
    enemySurvivors: enemyAlive,
    totalDamageAlly,
    totalDamageEnemy,
    logs,
    creatures: new Map(creatures)
  };
}
