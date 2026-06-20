import { rollD20, getAttributeModifier } from '../../utils/dice';
import type { Character, Enemy, DiceResult } from '../../types';

export interface AttackResult {
  diceRoll: number;
  attackModifier: number;
  total: number;
  hit: boolean;
  damage: number;
  critical: boolean;
}

export interface SpellResult {
  diceRoll: number;
  spellModifier: number;
  total: number;
  hit: boolean;
  damage: number;
  manaCost: number;
  critical: boolean;
}

export interface DefenseResult {
  damageReduction: number;
}

export class CombatEngine {
  static calculateAttackDamage(character: Character): number {
    const baseDamage = character.equipment.weapon?.effects?.damage || 10;
    const strMod = getAttributeModifier(character.attributes.strength);
    return baseDamage + strMod;
  }

  static calculateArmorClass(character: Character): number {
    const dexMod = getAttributeModifier(character.attributes.dexterity);
    const armorBonus = character.equipment.body?.effects?.defense || 0;
    return 10 + dexMod + armorBonus;
  }

  static playerAttack(character: Character, enemy: Enemy): AttackResult {
    const diceRoll = rollD20();
    const attackModifier =
      getAttributeModifier(character.attributes.strength) + character.level;
    const total = diceRoll + attackModifier;
    const critical = diceRoll === 20;
    const hit = critical || total >= enemy.defense + 10;

    let damage = 0;
    if (hit) {
      damage = this.calculateAttackDamage(character);
      if (critical) {
        damage = Math.floor(damage * 2);
      }
    }

    return {
      diceRoll,
      attackModifier,
      total,
      hit,
      damage,
      critical,
    };
  }

  static playerCastSpell(character: Character, enemy: Enemy): SpellResult {
    const diceRoll = rollD20();
    const spellModifier =
      getAttributeModifier(character.attributes.intelligence) + character.level;
    const total = diceRoll + spellModifier;
    const critical = diceRoll === 20;
    const hit = critical || total >= enemy.defense + 10;

    const manaCost = 15;
    let damage = 0;
    if (hit) {
      const baseDamage = 20 + getAttributeModifier(character.attributes.intelligence) * 2;
      damage = baseDamage;
      if (critical) {
        damage = Math.floor(damage * 1.5);
      }
    }

    return {
      diceRoll,
      spellModifier,
      total,
      hit,
      damage,
      manaCost,
      critical,
    };
  }

  static playerDefend(character: Character): DefenseResult {
    const conMod = getAttributeModifier(character.attributes.constitution);
    const damageReduction = 5 + conMod + character.level;
    return { damageReduction };
  }

  static enemyAttack(enemy: Enemy, character: Character, defending: boolean): AttackResult {
    const diceRoll = rollD20();
    const attackModifier = enemy.damage - 5;
    const total = diceRoll + attackModifier;
    const critical = diceRoll === 20;
    const ac = this.calculateArmorClass(character);
    const hit = critical || total >= ac;

    let damage = 0;
    if (hit) {
      damage = Math.max(1, enemy.damage - (character.equipment.body?.effects?.defense || 0));
      if (defending) {
        damage = Math.max(1, Math.floor(damage * 0.5));
      }
      if (critical) {
        damage = Math.floor(damage * 1.5);
      }
    }

    return {
      diceRoll,
      attackModifier,
      total,
      hit,
      damage,
      critical,
    };
  }

  static calculateRewards(enemy: Enemy): {
    experience: number;
    gold: number;
    items: string[];
  } {
    const experience = enemy.experienceReward;
    const gold = Math.floor(Math.random() * 20) + 10;
    const items: string[] = [];

    enemy.lootTable.forEach((loot) => {
      if (Math.random() < loot.chance) {
        items.push(loot.itemId);
      }
    });

    return { experience, gold, items };
  }

  static rollAbilityCheck(
    character: Character,
    attribute: keyof Character['attributes'],
    dc: number
  ): DiceResult {
    const roll = rollD20();
    const modifier = getAttributeModifier(character.attributes[attribute]);
    const total = roll + modifier;
    return {
      value: roll,
      modifier,
      total,
      success: total >= dc,
      dc,
    };
  }
}
