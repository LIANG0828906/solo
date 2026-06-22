import { v4 as uuidv4 } from 'uuid';

export enum CharacterClass {
  Warrior = 'warrior',
  Archer = 'archer',
  Mage = 'mage',
}

export enum Team {
  Ally = 'ally',
  Enemy = 'enemy',
}

export enum DamageType {
  Physical = 'physical',
  Magical = 'magical',
}

export enum StatusEffectType {
  Poison = 'poison',
  Burn = 'burn',
}

export interface StatusEffect {
  type: StatusEffectType;
  damagePerTick: number;
  remainingTicks: number;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  team: Team;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  moveRange: number;
  attackRange: number;
  x: number;
  y: number;
  isAlive: boolean;
  statusEffects: StatusEffect[];
  damageType: DamageType;
}

export interface DamageResult {
  attackerId: string;
  targetId: string;
  damage: number;
  damageType: DamageType;
  isCritical: boolean;
}

export interface BattleReport {
  totalRounds: number;
  survivors: Character[];
  totalDamageDealt: number;
  winner: Team;
}

export class CombatEngine {
  static createCharacter(
    name: string,
    characterClass: CharacterClass,
    team: Team,
    x: number = 0,
    y: number = 0
  ): Character {
    const id = uuidv4();
    const baseStats = CombatEngine.getBaseStats(characterClass);
    return {
      id,
      name,
      class: characterClass,
      team,
      x,
      y,
      isAlive: true,
      statusEffects: [],
      ...baseStats,
    };
  }

  private static getBaseStats(characterClass: CharacterClass): Omit<Character, 'id' | 'name' | 'class' | 'team' | 'x' | 'y' | 'isAlive' | 'statusEffects'> {
    switch (characterClass) {
      case CharacterClass.Warrior:
        return {
          hp: 120,
          maxHp: 120,
          atk: 25,
          def: 12,
          speed: 6,
          moveRange: 3,
          attackRange: 1,
          damageType: DamageType.Physical,
        };
      case CharacterClass.Archer:
        return {
          hp: 80,
          maxHp: 80,
          atk: 22,
          def: 6,
          speed: 10,
          moveRange: 3,
          attackRange: 4,
          damageType: DamageType.Physical,
        };
      case CharacterClass.Mage:
        return {
          hp: 70,
          maxHp: 70,
          atk: 30,
          def: 4,
          speed: 8,
          moveRange: 2,
          attackRange: 3,
          damageType: DamageType.Magical,
        };
    }
  }

  static calculateDamage(attacker: Character, defender: Character): DamageResult {
    const baseDamage = attacker.atk - defender.def;
    const variance = 1 + (Math.random() * 0.2 - 0.1);
    let damage = Math.max(1, Math.floor(baseDamage * variance));
    const isCritical = Math.random() < 0.15;
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }
    return {
      attackerId: attacker.id,
      targetId: defender.id,
      damage,
      damageType: attacker.damageType,
      isCritical,
    };
  }

  static applyDamage(character: Character, damage: number): Character {
    const newHp = Math.max(0, character.hp - damage);
    return {
      ...character,
      hp: newHp,
      isAlive: newHp > 0,
    };
  }

  static sortCharactersBySpeed(characters: Character[]): Character[] {
    return [...characters].filter(c => c.isAlive).sort((a, b) => b.speed - a.speed);
  }

  static applyStatusEffects(character: Character): { character: Character; totalDamage: number; effects: string[] } {
    let totalDamage = 0;
    const effects: string[] = [];
    const remainingEffects: StatusEffect[] = [];
    for (const effect of character.statusEffects) {
      totalDamage += effect.damagePerTick;
      effects.push(`${effect.type} dealt ${effect.damagePerTick} damage`);
      const updated = { ...effect, remainingTicks: effect.remainingTicks - 1 };
      if (updated.remainingTicks > 0) {
        remainingEffects.push(updated);
      }
    }
    const newHp = Math.max(0, character.hp - totalDamage);
    return {
      character: {
        ...character,
        hp: newHp,
        isAlive: newHp > 0,
        statusEffects: remainingEffects,
      },
      totalDamage,
      effects,
    };
  }

  static addStatusEffect(character: Character, effect: StatusEffect): Character {
    const existing = character.statusEffects.find(e => e.type === effect.type);
    if (existing) {
      return {
        ...character,
        statusEffects: character.statusEffects.map(e =>
          e.type === effect.type ? { ...e, remainingTicks: Math.max(e.remainingTicks, effect.remainingTicks) } : e
        ),
      };
    }
    return {
      ...character,
      statusEffects: [...character.statusEffects, effect],
    };
  }

  static getSkillEffect(character: Character): StatusEffect | null {
    if (character.class === CharacterClass.Mage) {
      return { type: StatusEffectType.Burn, damagePerTick: 5, remainingTicks: 3 };
    }
    if (character.class === CharacterClass.Warrior) {
      return null;
    }
    if (character.class === CharacterClass.Archer) {
      return { type: StatusEffectType.Poison, damagePerTick: 3, remainingTicks: 2 };
    }
    return null;
  }

  static findNearestEnemy(character: Character, allCharacters: Character[]): Character | null {
    const enemies = allCharacters.filter(c => c.isAlive && c.team !== character.team);
    if (enemies.length === 0) return null;
    let nearest: Character | null = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
      const dist = Math.abs(enemy.x - character.x) + Math.abs(enemy.y - character.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  static isInAttackRange(attacker: Character, target: Character): boolean {
    const dist = Math.abs(target.x - attacker.x) + Math.abs(target.y - attacker.y);
    return dist <= attacker.attackRange;
  }

  static generateBattleReport(
    rounds: number,
    characters: Character[],
    totalDamage: number
  ): BattleReport {
    const survivors = characters.filter(c => c.isAlive);
    const allyAlive = survivors.some(c => c.team === Team.Ally);
    const enemyAlive = survivors.some(c => c.team === Team.Enemy);
    let winner: Team = Team.Ally;
    if (allyAlive && !enemyAlive) winner = Team.Ally;
    else if (!allyAlive && enemyAlive) winner = Team.Enemy;
    return {
      totalRounds: rounds,
      survivors,
      totalDamageDealt: totalDamage,
      winner,
    };
  }
}
