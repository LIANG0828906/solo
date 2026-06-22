import {
  rollD20,
  getAttributeModifier,
  getProficiencyBonus,
  rollDamageFromWeapon,
  rollSpellDamage,
  rollDice,
  rollDiceWithModifier,
} from '../../utils/dice';
import type { Character, Enemy, DiceResult } from '../../types';

export interface AttackResult {
  diceRoll: number;
  attackModifier: number;
  total: number;
  hit: boolean;
  damage: number;
  critical: boolean;
  criticalFumble: boolean;
  damageBreakdown?: {
    diceNotation: string;
    diceValue: number;
    modifier: number;
  };
}

export interface SpellResult {
  diceRoll: number;
  spellModifier: number;
  total: number;
  hit: boolean;
  damage: number;
  manaCost: number;
  critical: boolean;
  damageBreakdown?: {
    diceNotation: string;
    diceValue: number;
    modifier: number;
  };
}

export interface DefenseResult {
  damageReduction: number;
  acBonus: number;
}

const WEAPON_DICE_MAP: Record<string, string> = {
  'starter-sword': '1d8',
  'dagger-sharp': '1d4',
};

export class CombatEngine {
  static getWeaponDamageDice(character: Character): string {
    const weapon = character.equipment.weapon;
    if (!weapon) return '1d4';

    if (weapon.damageDice) return weapon.damageDice;

    const baseId = weapon.id.split('-').slice(0, -1).join('-');
    if (WEAPON_DICE_MAP[baseId]) return WEAPON_DICE_MAP[baseId];
    if (WEAPON_DICE_MAP[weapon.id]) return WEAPON_DICE_MAP[weapon.id];

    if (weapon.effects?.damage) {
      const dmg = weapon.effects.damage;
      if (dmg >= 12) return '1d12';
      if (dmg >= 10) return '1d10';
      if (dmg >= 8) return '1d8';
      if (dmg >= 6) return '1d6';
      return '1d4';
    }

    return '1d4';
  }

  static getSpellDamageDice(character: Character): string {
    const level = character.level;
    if (level >= 9) return '8d6';
    if (level >= 5) return '4d6';
    if (level >= 3) return '3d6';
    return '2d6';
  }

  static getAttackModifier(character: Character): number {
    const strMod = getAttributeModifier(character.attributes.strength);
    const proficiencyBonus = getProficiencyBonus(character.level);
    return strMod + proficiencyBonus;
  }

  static getSpellAttackModifier(character: Character): number {
    const intMod = getAttributeModifier(character.attributes.intelligence);
    const wisdomMod = getAttributeModifier(character.attributes.wisdom);
    const primaryMod = Math.max(intMod, wisdomMod);
    const proficiencyBonus = getProficiencyBonus(character.level);
    return primaryMod + proficiencyBonus;
  }

  static getAbilityModifier(character: Character): number {
    const weaponType = character.equipment.weapon?.type;
    if (weaponType === 'weapon' && character.class === 'rogue') {
      return Math.max(
        getAttributeModifier(character.attributes.strength),
        getAttributeModifier(character.attributes.dexterity)
      );
    }
    if (weaponType === 'weapon') {
      return getAttributeModifier(character.attributes.strength);
    }
    return getAttributeModifier(character.attributes.dexterity);
  }

  static calculateArmorClass(character: Character): number {
    const dexMod = getAttributeModifier(character.attributes.dexterity);
    const armorBonus = character.equipment.body?.effects?.defense || 0;
    const shieldBonus = 0;
    const ringBonus = character.equipment.ring?.effects?.defense || 0;
    return 10 + dexMod + armorBonus + shieldBonus + ringBonus;
  }

  static playerAttack(character: Character, enemy: Enemy): AttackResult {
    const diceRoll = rollD20();
    const attackModifier = this.getAttackModifier(character);
    const total = diceRoll + attackModifier;
    const critical = diceRoll === 20;
    const criticalFumble = diceRoll === 1;

    let enemyAC = 10 + enemy.defense;
    const hit = criticalFumble ? false : critical || total >= enemyAC;

    let damage = 0;
    let damageBreakdown;

    if (hit) {
      const damageDice = this.getWeaponDamageDice(character);
      const abilityMod = this.getAbilityModifier(character);

      const damageRoll = rollDamageFromWeapon(damageDice, abilityMod, critical);
      damage = damageRoll.total;
      damageBreakdown = {
        diceNotation: critical ? `${damageDice.split('d')[0] * 2}d${damageDice.split('d')[1]}` : damageDice,
        diceValue: damageRoll.diceValue,
        modifier: damageRoll.modifier,
      };
    }

    return {
      diceRoll,
      attackModifier,
      total,
      hit,
      damage,
      critical,
      criticalFumble,
      damageBreakdown,
    };
  }

  static playerCastSpell(character: Character, enemy: Enemy): SpellResult {
    const diceRoll = rollD20();
    const spellModifier = this.getSpellAttackModifier(character);
    const total = diceRoll + spellModifier;
    const critical = diceRoll === 20;
    const criticalFumble = diceRoll === 1;

    const manaCost = 15;
    let enemyAC = 10 + enemy.defense;
    const hit = criticalFumble ? false : critical || total >= enemyAC;

    let damage = 0;
    let damageBreakdown;

    if (hit) {
      const damageDice = this.getSpellDamageDice(character);
      const primaryMod = Math.max(
        getAttributeModifier(character.attributes.intelligence),
        getAttributeModifier(character.attributes.wisdom)
      );

      const damageRoll = rollSpellDamage(damageDice, primaryMod, critical);
      damage = damageRoll.total;
      damageBreakdown = {
        diceNotation: critical ? `${damageDice.split('d')[0] * 2}d${damageDice.split('d')[1]}` : damageDice,
        diceValue: damageRoll.diceValue,
        modifier: damageRoll.modifier,
      };
    }

    return {
      diceRoll,
      spellModifier,
      total,
      hit,
      damage,
      manaCost,
      critical,
      damageBreakdown,
    };
  }

  static playerDefend(character: Character): DefenseResult {
    const conMod = getAttributeModifier(character.attributes.constitution);
    const proficiencyBonus = getProficiencyBonus(character.level);
    const damageReduction = 3 + conMod + Math.floor(proficiencyBonus / 2);
    const acBonus = 2;
    return { damageReduction, acBonus };
  }

  static enemyAttack(enemy: Enemy, character: Character, defending: boolean): AttackResult {
    const diceRoll = rollD20();
    const proficiencyBonus = Math.floor(Math.max(1, enemy.maxHealth / 50));
    const attackModifier = enemy.damage - 5 + proficiencyBonus;
    const total = diceRoll + attackModifier;
    const critical = diceRoll === 20;
    const criticalFumble = diceRoll === 1;

    const baseAC = this.calculateArmorClass(character);
    const ac = defending ? baseAC + 2 : baseAC;
    const hit = criticalFumble ? false : critical || total >= ac;

    let damage = 0;
    let damageBreakdown;

    if (hit) {
      const enemyDice = enemy.damage <= 6 ? '1d4' : enemy.damage <= 8 ? '1d6' : enemy.damage <= 10 ? '1d8' : enemy.damage <= 12 ? '1d10' : '1d12';
      const abilityMod = Math.floor(enemy.damage / 3) - 2;

      const damageRoll = rollDamageFromWeapon(enemyDice, abilityMod, critical);
      damage = damageRoll.total;

      const defense = character.equipment.body?.effects?.defense || 0;
      damage = Math.max(1, damage - Math.floor(defense / 2));

      if (defending) {
        damage = Math.max(1, Math.floor(damage * 0.5));
      }

      damageBreakdown = {
        diceNotation: critical ? `${enemyDice.split('d')[0] * 2}d${enemyDice.split('d')[1]}` : enemyDice,
        diceValue: damageRoll.diceValue,
        modifier: damageRoll.modifier - Math.floor(defense / 2) - (defending ? Math.floor(damage / 2) : 0),
      };
    }

    return {
      diceRoll,
      attackModifier,
      total,
      hit,
      damage,
      critical,
      criticalFumble,
      damageBreakdown,
    };
  }

  static calculateRewards(enemy: Enemy): {
    experience: number;
    gold: number;
    items: string[];
  } {
    const experience = enemy.experienceReward;
    const gold = rollDiceWithModifier(2, 6, 10);
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

  static rollSavingThrow(
    character: Character,
    attribute: keyof Character['attributes'],
    dc: number,
    isProficient: boolean = false
  ): DiceResult {
    const roll = rollD20();
    const modifier = getAttributeModifier(character.attributes[attribute]) +
      (isProficient ? getProficiencyBonus(character.level) : 0);
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
