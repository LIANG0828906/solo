import { Creature, Skill, createCreatureInstance, allCreatures } from './creatures';

export interface BattleLogEntry {
  turn: number;
  attacker: string;
  target: string;
  skill: string;
  damage: number;
  heal: number;
  effect?: string;
  animationType: string;
  attackerIsEnemy: boolean;
  targetIsEnemy: boolean;
}

export interface BattleResult {
  victory: boolean;
  remainingAllies: Creature[];
  remainingEnemies: Creature[];
  totalDamageDealt: number;
  totalDamageTaken: number;
  goldReward: number;
  expReward: number;
  battleLog: BattleLogEntry[];
}

interface CombatCreature extends Creature {
  currentCooldown: number;
  buffs: Buff[];
  debuffs: Debuff[];
}

interface Buff {
  type: string;
  value: number;
  duration: number;
}

interface Debuff {
  type: 'burn' | 'freeze' | 'poison';
  value: number;
  duration: number;
}

function cloneCreature(creature: Creature): CombatCreature {
  return {
    ...creature,
    currentHp: creature.currentHp,
    currentCooldown: 0,
    buffs: [],
    debuffs: [],
  };
}

function calculateDamage(attacker: CombatCreature, defender: CombatCreature, skill: Skill): number {
  let baseDamage = skill.damage > 0 ? skill.damage : attacker.attack;
  
  const attackBuff = attacker.buffs.find(b => b.type === 'attack');
  if (attackBuff) {
    baseDamage *= 1 + attackBuff.value / 100;
  }
  
  let defense = defender.defense;
  const defenseBuff = defender.buffs.find(b => b.type === 'defense');
  if (defenseBuff) {
    defense += defenseBuff.value;
  }
  
  const defenseDebuff = defender.debuffs.find(d => d.type === 'defense');
  if (defenseDebuff) {
    defense -= defenseDebuff.value;
  }
  
  const damage = Math.max(1, baseDamage - defense * 0.5);
  return Math.floor(damage);
}

function applyPassiveBuffs(creatures: CombatCreature[]): void {
  creatures.forEach(creature => {
    const passive = creature.passiveSkill;
    if (passive.effect === 'buff') {
      if (passive.id === 'swift-wings') {
        creature.buffs.push({ type: 'speed', value: passive.effectValue || 0, duration: 999 });
      }
    }
  });
  
  const hasWindSprite = creatures.some(c => c.passiveSkill.id === 'agile-breeze');
  if (hasWindSprite) {
    const windSprite = creatures.find(c => c.passiveSkill.id === 'agile-breeze')!;
    const buffValue = windSprite.passiveSkill.effectValue || 0;
    creatures.forEach(c => {
      c.buffs.push({ type: 'speed', value: buffValue, duration: 999 });
    });
  }
  
  const hasLightAngel = creatures.some(c => c.passiveSkill.id === 'divine-shield');
  if (hasLightAngel) {
    const lightAngel = creatures.find(c => c.passiveSkill.id === 'divine-shield')!;
    const buffValue = lightAngel.passiveSkill.effectValue || 0;
    creatures.forEach(c => {
      c.buffs.push({ type: 'defense', value: buffValue, duration: 999 });
    });
  }
}

function getEffectiveSpeed(creature: CombatCreature): number {
  let speed = creature.speed;
  const speedBuff = creature.buffs.find(b => b.type === 'speed');
  if (speedBuff) speed += speedBuff.value;
  
  const freezeDebuff = creature.debuffs.find(d => d.type === 'freeze');
  if (freezeDebuff) speed -= freezeDebuff.value;
  
  return Math.max(1, speed);
}

function selectTarget(attacker: CombatCreature, enemies: CombatCreature[]): CombatCreature | null {
  const aliveEnemies = enemies.filter(e => e.currentHp > 0);
  if (aliveEnemies.length === 0) return null;
  
  if (attacker.mainSkill.effect === 'heal') {
    return null;
  }
  
  return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
}

function selectHealTarget(healer: CombatCreature, allies: CombatCreature[]): CombatCreature | null {
  const aliveAllies = allies.filter(a => a.currentHp > 0 && a.currentHp < a.maxHp);
  if (aliveAllies.length === 0) return null;
  
  return aliveAllies.reduce((weakest, current) => 
    (current.currentHp / current.maxHp) < (weakest.currentHp / weakest.maxHp) ? current : weakest
  );
}

function applySkillEffect(skill: Skill, target: CombatCreature, attacker: CombatCreature): void {
  if (!skill.effect || !skill.effectValue) return;
  
  switch (skill.effect) {
    case 'burn':
      target.debuffs.push({
        type: 'burn',
        value: skill.effectValue,
        duration: skill.effectDuration || 2,
      });
      break;
    case 'freeze':
      target.debuffs.push({
        type: 'freeze',
        value: skill.effectValue,
        duration: skill.effectDuration || 2,
      });
      break;
    case 'poison':
      target.debuffs.push({
        type: 'poison',
        value: skill.effectValue,
        duration: skill.effectDuration || 3,
      });
      break;
    case 'debuff':
      target.debuffs.push({
        type: 'poison' as any,
        value: skill.effectValue,
        duration: skill.effectDuration || 2,
      });
      break;
  }
}

function processDotDamage(creature: CombatCreature): number {
  let totalDot = 0;
  
  creature.debuffs.forEach(debuff => {
    if (debuff.type === 'burn' || debuff.type === 'poison') {
      totalDot += debuff.value;
    }
  });
  
  creature.currentHp -= totalDot;
  return totalDot;
}

function decrementDurations(creatures: CombatCreature[]): void {
  creatures.forEach(c => {
    c.buffs = c.buffs.filter(b => {
      b.duration--;
      return b.duration > 0;
    });
    c.debuffs = c.debuffs.filter(d => {
      d.duration--;
      return d.duration > 0;
    });
    if (c.currentCooldown > 0) c.currentCooldown--;
  });
}

function tryPassiveOnAttack(attacker: CombatCreature, target: CombatCreature): { triggered: boolean; effect?: string } {
  const passive = attacker.passiveSkill;
  
  if (passive.id === 'burn-aura' && Math.random() < 0.3) {
    target.debuffs.push({
      type: 'burn',
      value: passive.effectValue || 3,
      duration: passive.effectDuration || 2,
    });
    return { triggered: true, effect: 'burn' };
  }
  
  if (passive.id === 'life-drain') {
    const healAmount = Math.floor(passive.effectValue || 0);
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
    return { triggered: true, effect: 'heal' };
  }
  
  return { triggered: false };
}

function tryPassiveOnDefend(defender: CombatCreature, attacker: CombatCreature): { triggered: boolean; effect?: string } {
  const passive = defender.passiveSkill;
  
  if (passive.id === 'ice-armor' && Math.random() < 0.2) {
    attacker.debuffs.push({
      type: 'freeze',
      value: passive.effectValue || 20,
      duration: passive.effectDuration || 1,
    });
    return { triggered: true, effect: 'freeze' };
  }
  
  if (passive.id === 'toxic-body') {
    attacker.debuffs.push({
      type: 'poison',
      value: passive.effectValue || 5,
      duration: passive.effectDuration || 3,
    });
    return { triggered: true, effect: 'poison' };
  }
  
  if (passive.id === 'stone-skin') {
    return { triggered: false };
  }
  
  return { triggered: false };
}

function applyPassiveHeal(creature: CombatCreature): number {
  if (creature.passiveSkill.id === 'regen-water') {
    const healAmount = creature.passiveSkill.effectValue || 0;
    creature.currentHp = Math.min(creature.maxHp, creature.currentHp + healAmount);
    return healAmount;
  }
  return 0;
}

export function generateEnemyWave(wave: number): Creature[] {
  const enemies: Creature[] = [];
  const shuffled = [...allCreatures].sort(() => Math.random() - 0.5);
  const count = Math.min(6, 3 + Math.floor(wave / 2));
  const level = 1 + Math.floor(wave / 3);
  
  for (let i = 0; i < count; i++) {
    const creature = createCreatureInstance(shuffled[i % shuffled.length].id, level, true);
    creature.position = i;
    enemies.push(creature);
  }
  
  return enemies;
}

export function runBattle(allies: Creature[], enemies: Creature[]): BattleResult {
  const allyTeam: CombatCreature[] = allies.filter(a => a.position !== undefined).map(cloneCreature);
  const enemyTeam: CombatCreature[] = enemies.filter(e => e.position !== undefined).map(cloneCreature);
  
  applyPassiveBuffs(allyTeam);
  applyPassiveBuffs(enemyTeam);
  
  const battleLog: BattleLogEntry[] = [];
  let turn = 0;
  let totalDamageDealt = 0;
  let totalDamageTaken = 0;
  const maxTurns = 50;
  
  while (turn < maxTurns) {
    turn++;
    
    const allCreaturesInBattle = [...allyTeam, ...enemyTeam]
      .filter(c => c.currentHp > 0)
      .sort((a, b) => getEffectiveSpeed(b) - getEffectiveSpeed(a));
    
    let battleEnded = false;
    
    for (const creature of allCreaturesInBattle) {
      if (creature.currentHp <= 0) continue;
      
      const isAlly = !creature.isEnemy;
      const friends = isAlly ? allyTeam : enemyTeam;
      const foes = isAlly ? enemyTeam : allyTeam;
      
      const dotDamage = processDotDamage(creature);
      if (dotDamage > 0) {
        battleLog.push({
          turn,
          attacker: creature.name,
          target: creature.name,
          skill: '持续伤害',
          damage: dotDamage,
          heal: 0,
          effect: 'dot',
          animationType: creature.element,
          attackerIsEnemy: !!creature.isEnemy,
          targetIsEnemy: !!creature.isEnemy,
        });
        
        if (isAlly) {
          totalDamageTaken += dotDamage;
        } else {
          totalDamageDealt += dotDamage;
        }
      }
      
      if (creature.currentHp <= 0) continue;
      
      const passiveHeal = applyPassiveHeal(creature);
      if (passiveHeal > 0) {
        battleLog.push({
          turn,
          attacker: creature.name,
          target: creature.name,
          skill: creature.passiveSkill.name,
          damage: 0,
          heal: passiveHeal,
          effect: 'heal',
          animationType: creature.passiveSkill.animationType,
          attackerIsEnemy: !!creature.isEnemy,
          targetIsEnemy: !!creature.isEnemy,
        });
      }
      
      const freezeDebuff = creature.debuffs.find(d => d.type === 'freeze');
      if (freezeDebuff && Math.random() < freezeDebuff.value / 100) {
        battleLog.push({
          turn,
          attacker: creature.name,
          target: creature.name,
          skill: '被冻结',
          damage: 0,
          heal: 0,
          effect: 'freeze',
          animationType: 'ice',
          attackerIsEnemy: !!creature.isEnemy,
          targetIsEnemy: !!creature.isEnemy,
        });
        continue;
      }
      
      if (creature.currentCooldown > 0) {
        const damage = Math.max(1, creature.attack - (foes[0]?.defense || 0) * 0.3);
        const target = selectTarget(creature, foes);
        if (!target) {
          battleEnded = true;
          break;
        }
        
        const actualDamage = Math.floor(damage);
        target.currentHp -= actualDamage;
        
        if (isAlly) {
          totalDamageDealt += actualDamage;
        } else {
          totalDamageTaken += actualDamage;
        }
        
        battleLog.push({
          turn,
          attacker: creature.name,
          target: target.name,
          skill: '普通攻击',
          damage: actualDamage,
          heal: 0,
          animationType: creature.element,
          attackerIsEnemy: !!creature.isEnemy,
          targetIsEnemy: !!target.isEnemy,
        });
        
        tryPassiveOnAttack(creature, target);
        tryPassiveOnDefend(target, creature);
        
        continue;
      }
      
      const skill = creature.mainSkill;
      
      if (skill.effect === 'heal') {
        const healTarget = selectHealTarget(creature, friends);
        if (healTarget) {
          const healAmount = skill.effectValue || 0;
          healTarget.currentHp = Math.min(healTarget.maxHp, healTarget.currentHp + healAmount);
          
          battleLog.push({
            turn,
            attacker: creature.name,
            target: healTarget.name,
            skill: skill.name,
            damage: 0,
            heal: healAmount,
            effect: 'heal',
            animationType: skill.animationType,
            attackerIsEnemy: !!creature.isEnemy,
            targetIsEnemy: !!healTarget.isEnemy,
          });
        } else {
          const target = selectTarget(creature, foes);
          if (target) {
            const damage = Math.max(1, creature.attack - target.defense * 0.3);
            target.currentHp -= damage;
            
            if (isAlly) {
              totalDamageDealt += damage;
            } else {
              totalDamageTaken += damage;
            }
            
            battleLog.push({
              turn,
              attacker: creature.name,
              target: target.name,
              skill: '普通攻击',
              damage: Math.floor(damage),
              heal: 0,
              animationType: creature.element,
              attackerIsEnemy: !!creature.isEnemy,
              targetIsEnemy: !!target.isEnemy,
            });
          }
        }
      } else {
        const target = selectTarget(creature, foes);
        if (!target) {
          battleEnded = true;
          break;
        }
        
        const damage = calculateDamage(creature, target, skill);
        target.currentHp -= damage;
        
        if (isAlly) {
          totalDamageDealt += damage;
        } else {
          totalDamageTaken += damage;
        }
        
        battleLog.push({
          turn,
          attacker: creature.name,
          target: target.name,
          skill: skill.name,
          damage,
          heal: 0,
          effect: skill.effect,
          animationType: skill.animationType,
          attackerIsEnemy: !!creature.isEnemy,
          targetIsEnemy: !!target.isEnemy,
        });
        
        applySkillEffect(skill, target, creature);
        tryPassiveOnAttack(creature, target);
        tryPassiveOnDefend(target, creature);
      }
      
      creature.currentCooldown = skill.cooldown;
      
      const allyAlive = allyTeam.some(c => c.currentHp > 0);
      const enemyAlive = enemyTeam.some(c => c.currentHp > 0);
      if (!allyAlive || !enemyAlive) {
        battleEnded = true;
        break;
      }
    }
    
    if (battleEnded) break;
    
    decrementDurations(allyTeam);
    decrementDurations(enemyTeam);
  }
  
  const allyAlive = allyTeam.some(c => c.currentHp > 0);
  const victory = allyAlive;
  
  const remainingAllies = allyTeam
    .filter(c => c.currentHp > 0)
    .map(c => ({
      ...c,
      currentHp: c.currentHp,
      buffs: undefined,
      debuffs: undefined,
      currentCooldown: undefined,
    } as Creature));
  
  const remainingEnemies = enemyTeam
    .filter(c => c.currentHp > 0)
    .map(c => ({
      ...c,
      currentHp: c.currentHp,
      buffs: undefined,
      debuffs: undefined,
      currentCooldown: undefined,
    } as Creature));
  
  const baseGold = 50;
  const waveMultiplier = 1;
  const goldReward = victory ? Math.floor(baseGold * (1 + waveMultiplier * 0.2)) : Math.floor(baseGold * 0.3);
  const expReward = victory ? 30 : 10;
  
  return {
    victory,
    remainingAllies,
    remainingEnemies,
    totalDamageDealt,
    totalDamageTaken,
    goldReward,
    expReward,
    battleLog,
  };
}
