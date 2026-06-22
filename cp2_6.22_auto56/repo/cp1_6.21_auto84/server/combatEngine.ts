import type { Unit, BattleLogEntry, CombatResult, UnitSkill } from '../src/types';

const UNIT_SKILLS: Record<string, UnitSkill> = {
  warrior: {
    name: '重击',
    description: '造成1.8倍伤害',
    damageMultiplier: 1.8,
  },
  mage: {
    name: '火球术',
    description: '造成2.2倍伤害',
    damageMultiplier: 2.2,
  },
  archer: {
    name: '连射',
    description: '攻击两次，每次0.8倍伤害',
    damageMultiplier: 0.8,
  },
};

const UNIT_SPEED: Record<string, number> = {
  archer: 3,
  mage: 2,
  warrior: 1,
};

function getAliveUnitsByPlayer(units: Unit[]): Map<string, Unit[]> {
  const playerUnits = new Map<string, Unit[]>();
  for (const unit of units) {
    if (unit.health > 0) {
      if (!playerUnits.has(unit.playerId)) {
        playerUnits.set(unit.playerId, []);
      }
      playerUnits.get(unit.playerId)!.push(unit);
    }
  }
  return playerUnits;
}

function checkWinner(units: Unit[]): string | null {
  const playerUnits = getAliveUnitsByPlayer(units);
  const alivePlayers = Array.from(playerUnits.keys()).filter(
    (playerId) => playerUnits.get(playerId)!.length > 0
  );
  return alivePlayers.length === 1 ? alivePlayers[0] : null;
}

function sortUnitsBySpeed(units: Unit[]): Unit[] {
  return [...units].sort((a, b) => {
    const speedA = UNIT_SPEED[a.type] || 0;
    const speedB = UNIT_SPEED[b.type] || 0;
    if (speedB !== speedA) return speedB - speedA;
    return a.id.localeCompare(b.id);
  });
}

function getRandomTarget(attacker: Unit, allUnits: Unit[]): Unit | null {
  const enemyUnits = allUnits.filter(
    (u) => u.playerId !== attacker.playerId && u.health > 0
  );
  if (enemyUnits.length === 0) return null;
  return enemyUnits[Math.floor(Math.random() * enemyUnits.length)];
}

function calculateDamage(
  attacker: Unit,
  target: Unit,
  isSkill: boolean
): { damage: number; skillName?: string; hits: number } {
  const baseDamage = attacker.attack;
  if (isSkill) {
    const skill = UNIT_SKILLS[attacker.type];
    if (attacker.type === 'archer') {
      return {
        damage: Math.floor(baseDamage * skill.damageMultiplier),
        skillName: skill.name,
        hits: 2,
      };
    }
    return {
      damage: Math.floor(baseDamage * skill.damageMultiplier),
      skillName: skill.name,
      hits: 1,
    };
  }
  return { damage: baseDamage, hits: 1 };
}

export function executeRound(
  units: Unit[],
  round: number
): CombatResult {
  const logs: BattleLogEntry[] = [];
  const updatedUnits = units.map((u) => ({ ...u }));
  const unitMap = new Map(updatedUnits.map((u) => [u.id, u]));

  const aliveUnits = updatedUnits.filter((u) => u.health > 0);
  const sortedUnits = sortUnitsBySpeed(aliveUnits);

  for (const attacker of sortedUnits) {
    if (attacker.health <= 0) continue;

    let target = getRandomTarget(attacker, updatedUnits);
    if (!target) continue;

    if (attacker.currentCooldown === 0) {
      const { damage, skillName, hits } = calculateDamage(attacker, target, true);
      
      for (let i = 0; i < hits; i++) {
        const currentTarget = unitMap.get(target.id)!;
        if (currentTarget.health <= 0) {
          const newTarget = getRandomTarget(attacker, updatedUnits);
          if (!newTarget) break;
          target = newTarget;
        }
        
        const actualTarget = unitMap.get(target.id)!;
        if (actualTarget.health <= 0) break;

        actualTarget.health = Math.max(0, actualTarget.health - damage);
        
        logs.push({
          round,
          timestamp: Date.now(),
          type: 'skill',
          attackerId: attacker.id,
          attackerName: attacker.name,
          targetId: actualTarget.id,
          targetName: actualTarget.name,
          damage,
          skillName,
        });

        attacker.skillTriggered = (attacker.skillTriggered || 0) + 1;

        if (actualTarget.health <= 0) {
          logs.push({
            round,
            timestamp: Date.now(),
            type: 'death',
            attackerId: attacker.id,
            attackerName: attacker.name,
            targetId: actualTarget.id,
            targetName: actualTarget.name,
            damage: 0,
          });
        }
      }
      
      attacker.currentCooldown = attacker.skillCooldown;
    } else {
      const { damage } = calculateDamage(attacker, target, false);
      const actualTarget = unitMap.get(target.id)!;
      
      if (actualTarget.health > 0) {
        actualTarget.health = Math.max(0, actualTarget.health - damage);
        
        logs.push({
          round,
          timestamp: Date.now(),
          type: 'attack',
          attackerId: attacker.id,
          attackerName: attacker.name,
          targetId: actualTarget.id,
          targetName: actualTarget.name,
          damage,
        });

        if (actualTarget.health <= 0) {
          logs.push({
            round,
            timestamp: Date.now(),
            type: 'death',
            attackerId: attacker.id,
            attackerName: attacker.name,
            targetId: actualTarget.id,
            targetName: actualTarget.name,
            damage: 0,
          });
        }
      }
      
      attacker.currentCooldown = Math.max(0, attacker.currentCooldown - 1);
    }

    const winner = checkWinner(updatedUnits);
    if (winner) {
      return {
        round,
        logs,
        updatedUnits,
        isFinished: true,
        winner,
      };
    }
  }

  const winner = checkWinner(updatedUnits);
  return {
    round,
    logs,
    updatedUnits,
    isFinished: !!winner,
    winner,
  };
}

export const combatEngine = {
  executeRound,
};
